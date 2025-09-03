import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get current user info (updated to handle both customers and admins)
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    // First check customers table
    const customer = await ctx.db
      .query("customers")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .first();

    if (customer) {
      return {
        ...customer,
        userType: "customer" as const,
        identity,
        isAuthenticated: true,
        role: customer.role, // Explicitly include role
      };
    }

    // Fallback to adminUsers for existing admin accounts
    const adminUser = await ctx.db
      .query("adminUsers")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .first();

    if (adminUser) {
      return {
        ...adminUser,
        userType: "admin" as const,
        identity,
        isAuthenticated: true,
        role: adminUser.role, // Explicitly include role
      };
    }

    return {
      identity,
      user: null,
      isAuthenticated: true,
      role: null, // Add role property to maintain consistent type
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
    // Check if user already exists in customers table
    const existingCustomer = await ctx.db
      .query("customers")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();

    if (existingCustomer) {
      // Update existing customer's last login
      await ctx.db.patch(existingCustomer._id, {
        lastUpdated: Date.now(),
      });
      return existingCustomer;
    }

    // Create new customer with default role
    const newCustomer = await ctx.db.insert("customers", {
      name: args.name,
      email: args.email,
      company: "Default Company", // Can be updated later
      role: "customer", // Default role for all new signups
      subscriptionTier: "basic",
      isActive: true,
      isBlocked: false,
      createdBy: "system", // System created
      lastUpdated: Date.now(),
      clerkUserId: args.clerkUserId,
    });

    return await ctx.db.get(newCustomer);
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