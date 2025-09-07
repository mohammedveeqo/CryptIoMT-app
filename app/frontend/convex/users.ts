import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { UserRoles, UserRole } from './types';

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

// UPDATED: Get current user with organizations (now supports multiple organizations)
export const getCurrentUserWithOrganizations = query({
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

    // Get all organizations the user belongs to
    const memberships = await ctx.db
      .query("organizationMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("memberStatus"), "active"))
      .collect();

    // Get organization details for each membership
    const organizations = await Promise.all(
      memberships.map(async (membership) => {
        const org = await ctx.db.get(membership.organizationId);
        return {
          ...org,
          memberRole: membership.memberRole,
          memberStatus: membership.memberStatus,
          joinedAt: membership.joinedAt,
        };
      })
    );

    // Get default/current organization (from user preferences or first active membership)
    let currentOrganization = null;
    if (user.preferences?.defaultOrganization) {
      currentOrganization = organizations.find(
        (org) => org?._id === user.preferences?.defaultOrganization
      );
    }
    // If no default set, use the first organization
    if (!currentOrganization && organizations.length > 0) {
      currentOrganization = organizations[0];
    }

    return {
      ...user,
      organizations,
      currentOrganization,
      // Legacy support - return first organization as 'organization'
      organization: currentOrganization,
    };
  },
});

// DEPRECATED: Keep for backward compatibility but redirect to new function
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

    // Get user's first active organization membership for backward compatibility
    const membership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("memberStatus"), "active"))
      .first();

    let organization = null;
    if (membership) {
      const org = await ctx.db.get(membership.organizationId);
      organization = {
        ...org,
        memberRole: membership.memberRole,
        memberStatus: membership.memberStatus,
        joinedAt: membership.joinedAt,
      };
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

    return {
      success: true,
      message: `User role updated to ${args.newRole}`,
    };
  },
});

// NEW: Set user's default organization
export const setDefaultOrganization = mutation({
  args: {
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Verify user is a member of this organization
    const membership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_user_org", (q) => 
        q.eq("userId", user._id).eq("organizationId", args.organizationId)
      )
      .filter((q) => q.eq(q.field("memberStatus"), "active"))
      .first();

    if (!membership) {
      throw new Error("User is not a member of this organization");
    }

    // Update user preferences
    await ctx.db.patch(user._id, {
      preferences: {
        ...user.preferences,
        defaultOrganization: args.organizationId,
      },
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});