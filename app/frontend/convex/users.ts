import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get current user info (updated to handle unified users table)
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    // Single query to users table
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (user) {
      return {
        ...user,
        identity,
        isAuthenticated: true,
      };
    }

    return {
      identity,
      user: null,
      isAuthenticated: true,
      role: null,
    };
  },
});

// Create or update user in our database
export const createOrUpdateUser = mutation({
  args: {
    clerkUserId: v.string(),
    email: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if user already exists in users table
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkUserId))
      .first();

    if (existingUser) {
      // Update existing user's last login
      await ctx.db.patch(existingUser._id, {
        lastUpdated: Date.now(),
        updatedAt: Date.now(),
      });
      return existingUser;
    }

    // Create new user with default role
    const newUser = await ctx.db.insert("users", {
      clerkId: args.clerkUserId,
      name: args.name,
      email: args.email,
      role: "customer", // Default role for all new signups
      status: "active",
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastUpdated: Date.now(),
    });

    return await ctx.db.get(newUser);
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
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser || currentUser.role !== "super_admin") {
      throw new Error("Unauthorized: Super admin access required");
    }

    // Get all admin users
    return await ctx.db
      .query("users")
      .filter((q) => q.or(
        q.eq(q.field("role"), "super_admin"),
        q.eq(q.field("role"), "admin"),
        q.eq(q.field("role"), "analyst")
      ))
      .collect();
  },
});

// Get current user with organization context
export const getCurrentUserWithOrganization = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    // Get user from unified users table
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      return null;
    }

    // Get user's organization if they have one
    let organization = null;
    if (user.organizationId) {
      organization = await ctx.db.get(user.organizationId);
    }

    return {
      ...user,
      organization,
      currentOrganization: organization,
    };
  },
});

// Get all customers (admin only)
export const getAllCustomers = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser || !["super_admin", "admin"].includes(currentUser.role)) {
      throw new Error("Admin access required");
    }

    // Get all users with customer role
    return await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "customer"))
      .collect();
  },
});

// Update user role
export const updateUserRole = mutation({
  args: {
    userId: v.id("users"),
    newRole: v.union(
      v.literal("customer"),
      v.literal("orgMember"),
      v.literal("orgOwner"),
      v.literal("admin"),
      v.literal("super_admin"),
      v.literal("analyst")
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser || !["super_admin", "admin"].includes(currentUser.role)) {
      throw new Error("Admin access required");
    }

    await ctx.db.patch(args.userId, {
      role: args.newRole,
      updatedAt: Date.now(),
      lastUpdated: Date.now(),
    });

    return { success: true };
  },
});