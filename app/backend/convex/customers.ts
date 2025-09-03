import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get all customers (for admins)
export const getAllCustomers = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Check if user is admin
    const user = await ctx.db
      .query("adminUsers")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .first();

    if (!user || !["super_admin", "admin", "analyst"].includes(user.role)) {
      throw new Error("Unauthorized: Admin access required");
    }

    return await ctx.db.query("customers").collect();
  },
});

// Get customer by ID
export const getCustomer = query({
  args: { customerId: v.id("customers") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    return await ctx.db.get(args.customerId);
  },
});

// Create new customer
export const createCustomer = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    company: v.string(),
    subscriptionTier: v.union(v.literal("basic"), v.literal("pro"), v.literal("enterprise")),
    clerkUserId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Check if user is admin
    const user = await ctx.db
      .query("adminUsers")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .first();

    if (!user || !["super_admin", "admin"].includes(user.role)) {
      throw new Error("Unauthorized: Admin access required");
    }

    return await ctx.db.insert("customers", {
      ...args,
      isActive: true,
      createdBy: user._id,
      lastUpdated: Date.now(),
    });
  },
});

// Update customer
export const updateCustomer = mutation({
  args: {
    customerId: v.id("customers"),
    updates: v.object({
      name: v.optional(v.string()),
      email: v.optional(v.string()),
      company: v.optional(v.string()),
      subscriptionTier: v.optional(v.union(v.literal("basic"), v.literal("pro"), v.literal("enterprise"))),
      isActive: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    await ctx.db.patch(args.customerId, {
      ...args.updates,
      lastUpdated: Date.now(),
    });
  },
});

// Get current customer (for customer portal)
export const getCurrentCustomer = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    // Check if user is a customer
    const customer = await ctx.db
      .query("customers")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .first();

    return customer;
  },
});