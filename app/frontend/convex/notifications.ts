import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// Get user notifications
export const getNotifications = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) return [];

    return await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(50);
  },
});

// Mark notification as read
export const markAsRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, { notificationId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    await ctx.db.patch(notificationId, { read: true });
  },
});

// Mark all notifications as read
export const markAllAsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) return;

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) => q.eq("userId", user._id).eq("read", false))
      .collect();

    for (const notification of unread) {
      await ctx.db.patch(notification._id, { read: true });
    }
  },
});

// Internal mutation to create a notification
export const sendNotification = internalMutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    message: v.string(),
    type: v.union(v.literal("cve"), v.literal("risk"), v.literal("offline"), v.literal("info")),
    link: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("notifications", {
      ...args,
      read: false,
      createdAt: Date.now(),
    });
  },
});

// Check device alerts (to be scheduled via cron)
export const checkDeviceAlerts = internalMutation({
  args: {},
  handler: async (ctx) => {
    const devices = await ctx.db.query("medicalDevices").collect();
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    for (const device of devices) {
      if (!device.ownerId) continue;

      // Check for offline > 24h
      if (device.lastSeen && (now - device.lastSeen > oneDay) && device.deviceOnNetwork) {
         // Check if we already sent a notification recently to avoid spam
         // For now, we'll just check if there's an unread notification for this device of this type
         // This is a simplification.
         const existing = await ctx.db
             .query("notifications")
             .withIndex("by_user_read", (q) => q.eq("userId", device.ownerId!).eq("read", false))
             .filter(q => q.eq(q.field("type"), "offline") && q.eq(q.field("link"), `/dashboard?tab=devices&deviceId=${device._id}`))
             .first();
             
         if (!existing) {
             await ctx.db.insert("notifications", {
                 userId: device.ownerId,
                 title: "Device Offline Alert",
                 message: `Device ${device.name} has been offline for more than 24 hours.`,
                 type: "offline",
                 link: `/dashboard?tab=devices&deviceId=${device._id}`,
                 read: false,
                 createdAt: now,
             });
         }
      }
      
      // Check for high risk
      // Assuming we have risk score or similar. Using cveCount as proxy or riskAssessments if linked.
      // But device table has `cveCount`.
      if ((device.cveCount || 0) > 0) {
          // Check for recent CVE alert
          const existing = await ctx.db
             .query("notifications")
             .withIndex("by_user_read", (q) => q.eq("userId", device.ownerId!).eq("read", false))
             .filter(q => q.eq(q.field("type"), "cve") && q.eq(q.field("link"), `/dashboard?tab=devices&deviceId=${device._id}`))
             .first();
             
          if (!existing) {
              await ctx.db.insert("notifications", {
                 userId: device.ownerId,
                 title: "Vulnerability Alert",
                 message: `Device ${device.name} has ${device.cveCount} active vulnerabilities.`,
                 type: "cve",
                 link: `/dashboard?tab=devices&deviceId=${device._id}`,
                 read: false,
                 createdAt: now,
             });
          }
      }
    }
  },
});
