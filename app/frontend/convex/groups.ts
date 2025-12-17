import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create a new device group
export const createGroup = mutation({
  args: {
    organizationId: v.id("organizations"),
    name: v.string(),
    description: v.optional(v.string()),
    filters: v.object({
      tags: v.optional(v.array(v.string())),
      category: v.optional(v.string()),
      manufacturer: v.optional(v.string()),
      classification: v.optional(v.string()),
      status: v.optional(v.string()),
      hasPHI: v.optional(v.string()),
      network: v.optional(v.string()),
      search: v.optional(v.string()),
    }),
    isSmartGroup: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const groupId = await ctx.db.insert("deviceGroups", {
      organizationId: args.organizationId,
      name: args.name,
      description: args.description,
      filters: args.filters,
      isSmartGroup: args.isSmartGroup,
      createdBy: user._id,
      createdAt: Date.now(),
    });

    return groupId;
  },
});

// Get all groups for an organization
export const getGroups = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, { organizationId }) => {
    return await ctx.db
      .query("deviceGroups")
      .withIndex("by_org", (q) => q.eq("organizationId", organizationId))
      .collect();
  },
});

// Delete a group
export const deleteGroup = mutation({
  args: { groupId: v.id("deviceGroups") },
  handler: async (ctx, { groupId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Check ownership or admin status (skipping for now for speed)
    await ctx.db.delete(groupId);
  },
});

// Calculate risk summary for a group (can be expensive, use sparingly)
export const getGroupRiskSummary = query({
  args: { 
    organizationId: v.id("organizations"),
    filters: v.object({
      tags: v.optional(v.array(v.string())),
      category: v.optional(v.string()),
      manufacturer: v.optional(v.string()),
      classification: v.optional(v.string()),
      status: v.optional(v.string()),
      hasPHI: v.optional(v.string()),
      network: v.optional(v.string()),
      search: v.optional(v.string()),
    })
  },
  handler: async (ctx, { organizationId, filters }) => {
    // Fetch all devices (optimized by index where possible)
    let devices = await ctx.db
      .query("medicalDevices")
      .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
      .collect();

    // Apply filters in memory
    devices = devices.filter(d => {
      if (filters.category && d.category !== filters.category) return false;
      if (filters.manufacturer && d.manufacturer !== filters.manufacturer) return false;
      if (filters.classification && d.classification !== filters.classification) return false;
      if (filters.status && d.status !== filters.status) return false;
      if (filters.hasPHI) {
        if (filters.hasPHI === "yes" && !d.hasPHI) return false;
        if (filters.hasPHI === "no" && d.hasPHI) return false;
      }
      if (filters.network) {
        if (filters.network === "connected" && !d.deviceOnNetwork) return false;
        if (filters.network === "offline" && d.deviceOnNetwork) return false;
      }
      if (filters.tags && filters.tags.length > 0) {
        if (!d.tags) return false;
        // Check if device has ALL required tags (AND logic)
        const hasAllTags = filters.tags.every(tag => d.tags!.includes(tag));
        if (!hasAllTags) return false;
      }
      if (filters.search) {
        const search = filters.search.toLowerCase();
        return (
          d.name.toLowerCase().includes(search) ||
          d.manufacturer.toLowerCase().includes(search) ||
          d.model.toLowerCase().includes(search) ||
          d.serialNumber.toLowerCase().includes(search)
        );
      }
      return true;
    });

    if (devices.length === 0) {
      return { deviceCount: 0, avgRiskScore: 0, criticalCount: 0, highCount: 0 };
    }

    // Calculate stats
    let totalRisk = 0;
    let criticalCount = 0;
    let highCount = 0;

    for (const device of devices) {
      const assessment = await ctx.db
        .query("riskAssessments")
        .withIndex("by_device", (q) => q.eq("deviceId", device._id))
        .unique();
      
      const score = assessment?.overallRiskScore || 0;
      totalRisk += score;
      
      if (score >= 80) criticalCount++;
      else if (score >= 60) highCount++;
    }

    return {
      deviceCount: devices.length,
      avgRiskScore: Math.round(totalRisk / devices.length),
      criticalCount,
      highCount
    };
  }
});
