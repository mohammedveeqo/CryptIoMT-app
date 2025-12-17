import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Log a change to a device
export const logChange = internalMutation({
  args: {
    deviceId: v.id("medicalDevices"),
    type: v.union(
      v.literal("risk_change"),
      v.literal("status_change"),
      v.literal("cve_match"),
      v.literal("manual_update"),
      v.literal("network_change")
    ),
    previousValue: v.optional(v.any()),
    newValue: v.optional(v.any()),
    userId: v.optional(v.string()),
    details: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("deviceLogs", {
      deviceId: args.deviceId,
      timestamp: Date.now(),
      type: args.type,
      previousValue: args.previousValue,
      newValue: args.newValue,
      userId: args.userId,
      details: args.details,
    });
  },
});

// Get history for a specific device
export const getDeviceHistory = query({
  args: { deviceId: v.id("medicalDevices") },
  handler: async (ctx, { deviceId }) => {
    return await ctx.db
      .query("deviceLogs")
      .withIndex("by_device", (q) => q.eq("deviceId", deviceId))
      .order("desc")
      .take(50);
  },
});

// Capture daily risk snapshot for all organizations
export const captureAllDailyRiskSnapshots = internalMutation({
  args: {},
  handler: async (ctx) => {
    const organizations = await ctx.db.query("organizations").collect();
    
    for (const org of organizations) {
      await captureSnapshotForOrg(ctx, org._id);
    }
  },
});

async function captureSnapshotForOrg(ctx: any, organizationId: any) {
    const devices = await ctx.db
      .query("medicalDevices")
      .withIndex("by_organization", (q: any) => q.eq("organizationId", organizationId))
      .collect();

    if (devices.length === 0) return;

    let totalRiskScore = 0;
    let highRiskCount = 0;
    let criticalRiskCount = 0;
    let devicesWithCVEs = 0;

    for (const device of devices) {
      // Calculate risk score based on logic in medicalDevices.ts
      let deviceRisk = 0;
      const category = device.customerPHICategory?.toLowerCase() || "";
      const os = device.osVersion?.toLowerCase() || "";
      const hasLegacyOS = os.includes("xp") || os.includes("2000") || os.includes("vista");
      
      if (category.includes("critical") || hasLegacyOS) {
        criticalRiskCount++;
        deviceRisk = 90;
      } else if (category.includes("high")) {
        highRiskCount++;
        deviceRisk = 70;
      } else {
        deviceRisk = 10;
      }

      if ((device.cveCount ?? 0) > 0) {
        devicesWithCVEs++;
        deviceRisk += Math.min(20, (device.cveCount ?? 0) * 5);
      }

      totalRiskScore += Math.min(100, deviceRisk);
    }

    const avgRiskScore = Math.round(totalRiskScore / devices.length);
    const date = new Date().toISOString().split("T")[0];

    // Check if snapshot already exists for today
    const existing = await ctx.db
      .query("riskSnapshots")
      .withIndex("by_org_date", (q: any) => q.eq("organizationId", organizationId).eq("date", date))
      .unique();

    const snapshot = {
      organizationId,
      date,
      timestamp: Date.now(),
      totalRiskScore,
      avgRiskScore,
      deviceCount: devices.length,
      highRiskCount,
      criticalRiskCount,
      devicesWithCVEs,
    };

    if (existing) {
      await ctx.db.patch(existing._id, snapshot);
    } else {
      await ctx.db.insert("riskSnapshots", snapshot);
    }
}

// Capture daily risk snapshot for an organization (Legacy/Direct call)
export const captureDailyRiskSnapshot = internalMutation({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, { organizationId }) => {
    await captureSnapshotForOrg(ctx, organizationId);
  },
});

// Get risk history for charts
export const getRiskHistory = query({
  args: { organizationId: v.id("organizations"), days: v.optional(v.number()) },
  handler: async (ctx, { organizationId, days = 30 }) => {
    // We can't easily filter by date range with index only on date string without range query support being perfect
    // But since we index by timestamp as well...
    // Actually, taking last N is easiest
    const snapshots = await ctx.db
      .query("riskSnapshots")
      .withIndex("by_org_timestamp", (q) => q.eq("organizationId", organizationId))
      .order("desc")
      .take(days);
    
    return snapshots.reverse(); // Return oldest to newest
  },
});
