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

    // Check if user is admin - first check customers table
    const customer = await ctx.db
      .query("customers")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .first();

    if (customer && ["super_admin", "admin", "analyst"].includes(customer.role)) {
      return await ctx.db.query("customers").collect();
    }

    // Fallback to adminUsers table for existing admin accounts
    const adminUser = await ctx.db
      .query("adminUsers")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .first();

    if (!adminUser || !["super_admin", "admin", "analyst"].includes(adminUser.role)) {
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

    const user = await ctx.db
      .query("adminUsers")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .first();

    if (!user || !["super_admin", "admin"].includes(user.role)) {
      throw new Error("Unauthorized: Admin access required");
    }

    return await ctx.db.insert("customers", {
      ...args,
      role: "customer", // Add the required role field with default value
      isActive: true,
      isBlocked: false, // Add the isBlocked field as well
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

// Remove this import as we can't call queries from mutations
// import { getCurrentUser } from "./users";

// Update customer role (admin only)
export const updateCustomerRole = mutation({
  args: {
    customerId: v.id("customers"),
    newRole: v.union(v.literal("customer"), v.literal("admin"), v.literal("super_admin")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Check if current user is admin (duplicate the logic from getCurrentUser)
    const currentCustomer = await ctx.db
      .query("customers")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .first();

    const currentAdmin = await ctx.db
      .query("adminUsers")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .first();

    const currentUserRole = currentCustomer?.role || currentAdmin?.role;
    
    if (!currentUserRole || (currentUserRole !== "admin" && currentUserRole !== "super_admin")) {
      throw new Error("Insufficient permissions");
    }

    await ctx.db.patch(args.customerId, {
      role: args.newRole,
      lastUpdated: Date.now(),
    });

    return { success: true };
  },
});

// Block/unblock customer (admin only)
export const toggleCustomerBlock = mutation({
  args: {
    customerId: v.id("customers"),
    isBlocked: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Check if current user is admin (duplicate the logic)
    const currentCustomer = await ctx.db
      .query("customers")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .first();

    const currentAdmin = await ctx.db
      .query("adminUsers")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .first();

    const currentUserRole = currentCustomer?.role || currentAdmin?.role;
    
    if (!currentUserRole || (currentUserRole !== "admin" && currentUserRole !== "super_admin")) {
      throw new Error("Insufficient permissions");
    }

    await ctx.db.patch(args.customerId, {
      isBlocked: args.isBlocked,
      lastUpdated: Date.now(),
    });

    return { success: true };
  },
});

// Delete customer (admin only)
export const deleteCustomer = mutation({
  args: {
    customerId: v.id("customers"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Check if current user is admin (duplicate the logic)
    const currentCustomer = await ctx.db
      .query("customers")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .first();

    const currentAdmin = await ctx.db
      .query("adminUsers")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .first();

    const currentUserRole = currentCustomer?.role || currentAdmin?.role;
    
    if (!currentUserRole || (currentUserRole !== "admin" && currentUserRole !== "super_admin")) {
      throw new Error("Insufficient permissions");
    }

    // Delete associated equipment first
    const equipment = await ctx.db
      .query("equipment")
      .withIndex("by_customer", (q) => q.eq("customerId", args.customerId))
      .collect();

    for (const item of equipment) {
      await ctx.db.delete(item._id);
    }

    // Delete customer
    await ctx.db.delete(args.customerId);

    return { success: true };
  },
});

// Get all customers for admin view
export const getAllCustomersForAdmin = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Check if current user is admin (duplicate the logic)
    const currentCustomer = await ctx.db
      .query("customers")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .first();

    const currentAdmin = await ctx.db
      .query("adminUsers")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .first();

    const currentUserRole = currentCustomer?.role || currentAdmin?.role;
    
    if (!currentUserRole || (currentUserRole !== "admin" && currentUserRole !== "super_admin")) {
      throw new Error("Insufficient permissions");
    }

    return await ctx.db.query("customers").collect();
  },
});