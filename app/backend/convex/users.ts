import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get current user info
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    // Check if user exists in our database
    const user = await ctx.db
      .query("adminUsers")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .first();

    return {
      identity,
      user,
      isAuthenticated: true,
    };
  },
});

// Create or update user in our database
export const createOrUpdateUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Check if user already exists
    const existingUser = await ctx.db
      .query("adminUsers")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .first();

    if (existingUser) {
      // Update last login
      await ctx.db.patch(existingUser._id, {
        lastLogin: Date.now(),
        name: identity.name || existingUser.name,
        email: identity.email || existingUser.email,
      });
      return existingUser._id;
    } else {
      // Create new user
      const userId = await ctx.db.insert("adminUsers", {
        clerkUserId: identity.subject,
        email: identity.email || "",
        name: identity.name || "",
        role: "admin", // Default role
        permissions: ["read", "write", "manage_customers"],
        isActive: true,
        lastLogin: Date.now(),
        customersAssigned: [],
      });
      return userId;
    }
  },
});

// Get all admin users (for super admin)
export const getAllAdminUsers = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Check if current user is super admin
    const currentUser = await ctx.db
      .query("adminUsers")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .first();

    if (!currentUser || currentUser.role !== "super_admin") {
      throw new Error("Unauthorized: Super admin access required");
    }

    return await ctx.db.query("adminUsers").collect();
  },
});