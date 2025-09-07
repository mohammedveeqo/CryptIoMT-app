import { v } from "convex/values";
import { query, mutation } from "./_generated/server";


// Get all equipment for an organization
export const getOrganizationEquipment = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    return await ctx.db
      .query("equipment")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();
  },
});


// Add new equipment
export const addEquipment = mutation({
  args: {
    organizationId: v.id("organizations"), // Changed from customerId
    deviceName: v.string(),
    deviceType: v.union(
      v.literal("server"),
      v.literal("workstation"),
      v.literal("laptop"),
      v.literal("mobile"),
      v.literal("iot"),
      v.literal("network_device"),
      v.literal("medical_device"), // Added medical device type
      v.literal("other")
    ),
    operatingSystem: v.string(),
    osVersion: v.string(),
    ipAddress: v.optional(v.string()),
    macAddress: v.optional(v.string()),
    location: v.optional(v.string()),
    department: v.optional(v.string()),
    owner: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const now = Date.now();
    
    return await ctx.db.insert("equipment", {
      ...args,
      status: "active",
      createdAt: now,
      updatedAt: now,
      lastSeen: now,
    });
  },
});

// Update equipment
export const updateEquipment = mutation({
  args: {
    equipmentId: v.id("equipment"),
    updates: v.object({
      deviceName: v.optional(v.string()),
      deviceType: v.optional(v.union(
        v.literal("server"),
        v.literal("workstation"),
        v.literal("laptop"),
        v.literal("mobile"),
        v.literal("iot"),
        v.literal("network_device"),
        v.literal("other")
      )),
      operatingSystem: v.optional(v.string()),
      osVersion: v.optional(v.string()),
      ipAddress: v.optional(v.string()),
      macAddress: v.optional(v.string()),
      location: v.optional(v.string()),
      department: v.optional(v.string()),
      owner: v.optional(v.string()),
      status: v.optional(v.union(v.literal("active"), v.literal("inactive"), v.literal("maintenance"))),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    await ctx.db.patch(args.equipmentId, {
      ...args.updates,
      updatedAt: Date.now(),
    });
  },
});

// Delete equipment
export const deleteEquipment = mutation({
  args: { equipmentId: v.id("equipment") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    await ctx.db.delete(args.equipmentId);
  },
});

// Get equipment statistics
export const getEquipmentStats = query({
  args: { organizationId: v.optional(v.id("organizations")) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    let equipment;
    
    if (args.organizationId) {
      equipment = await ctx.db
        .query("equipment")
        .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId!))
        .collect();
    } else {
      equipment = await ctx.db
        .query("equipment")
        .collect();
    }
    
    const stats = {
      total: equipment.length,
      active: equipment.filter(e => e.status === "active").length,
      inactive: equipment.filter(e => e.status === "inactive").length,
      maintenance: equipment.filter(e => e.status === "maintenance").length,
      byType: {} as Record<string, number>,
      riskDistribution: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0,
      },
    };

    equipment.forEach(e => {
      // Count by device type
      stats.byType[e.deviceType] = (stats.byType[e.deviceType] || 0) + 1;
      
      // Count by risk level
      if (e.riskScore) {
        if (e.riskScore < 3) stats.riskDistribution.low++;
        else if (e.riskScore < 6) stats.riskDistribution.medium++;
        else if (e.riskScore < 8) stats.riskDistribution.high++;
        else stats.riskDistribution.critical++;
      }
    });

    return stats;
  },
});