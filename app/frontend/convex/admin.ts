import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const createInitialAdmin = mutation({
  args: {
    clerkUserId: v.string(),
    email: v.string(),
    name: v.string(),
    role: v.union(v.literal("super_admin"), v.literal("admin"), v.literal("analyst")),
  },
  handler: async (ctx, args) => {
    // Check if any admin users exist - only allow if none exist (bootstrap)
    const existingAdmins = await ctx.db
      .query("users")
      .filter((q) => q.or(
        q.eq(q.field("role"), "super_admin"),
        q.eq(q.field("role"), "admin"),
        q.eq(q.field("role"), "analyst")
      ))
      .collect();
    
    if (existingAdmins.length > 0) {
      // If admins exist, require authentication
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        throw new Error("Not authenticated");
      }

      const currentAdmin = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .first();

      if (!currentAdmin || currentAdmin.role !== "super_admin") {
        throw new Error("Only super admins can create new admin users");
      }
    }

    // Create the admin user with all required fields
    const adminId = await ctx.db.insert("users", {
      clerkId: args.clerkUserId,
      email: args.email,
      name: args.name,
      role: args.role,
      status: "active",
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastUpdated: Date.now(),
    });

    return adminId;
  },
});

// Get system-wide statistics (admin only)
export const getSystemStats = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Check if user is admin
    const adminUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!adminUser || !["super_admin", "admin", "analyst"].includes(adminUser.role)) {
      throw new Error("Admin access required");
    }

    // Get counts
    const organizations = await ctx.db.query("organizations").collect();
    const users = await ctx.db.query("users").collect();
    const medicalDevices = await ctx.db.query("medicalDevices").collect();
    const riskAssessments = await ctx.db.query("riskAssessments").collect();

    const criticalAlerts = riskAssessments.filter(r => 
      r.riskLevel === "high" || r.riskLevel === "critical"
    ).length;

    return {
      totalOrganizations: organizations.length,
      totalUsers: users.length,
      totalDevices: medicalDevices.length,
      criticalAlerts,
    };
  },
});

// Migration function is no longer needed since we're using unified schema
// Remove the migrateToUnifiedUsers function entirely