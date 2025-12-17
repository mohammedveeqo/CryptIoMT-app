import { mutation, query, internalMutation, action } from "./_generated/server";
import { v } from "convex/values";
import { internal, api } from "./_generated/api";

export const createSchedule = mutation({
  args: {
    organizationId: v.id("organizations"),
    name: v.string(),
    frequency: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly")),
    recipients: v.array(v.string()),
    type: v.union(v.literal("summary"), v.literal("risk_detail"), v.literal("compliance")),
    dayOfWeek: v.optional(v.number()),
    dayOfMonth: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Calculate initial nextRun
    const now = Date.now();
    let nextRun = now;
    // Simple logic for now: run immediately if not specified, or calculate next occurrence
    // For MVP, just set to tomorrow if daily, etc.
    // Actually, let's set it to next occurrence based on frequency.
    
    // For simplicity in this implementation, we'll start "tomorrow" or next cycle
    if (args.frequency === "daily") {
        nextRun = now + 24 * 60 * 60 * 1000;
    } else if (args.frequency === "weekly") {
        nextRun = now + 7 * 24 * 60 * 60 * 1000;
    } else {
        nextRun = now + 30 * 24 * 60 * 60 * 1000;
    }

    // Adjust to specific day if provided (logic omitted for brevity, keeping it simple)

    const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .unique();

    if (!user) throw new Error("User not found");

    await ctx.db.insert("reportSchedules", {
      ...args,
      createdBy: user._id,
      isActive: true,
      nextRun,
    });
  },
});

export const getSchedules = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("reportSchedules")
      .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
      .collect();
  },
});

export const deleteSchedule = mutation({
  args: { id: v.id("reportSchedules") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    await ctx.db.delete(args.id);
  },
});

export const processScheduledReports = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    // Find due reports
    const dueReports = await ctx.db
      .query("reportSchedules")
      .withIndex("by_next_run", (q) => q.lte("nextRun", now))
      .filter((q) => q.eq(q.field("isActive"), true))
      .take(10); // Process in batches

    for (const report of dueReports) {
      // Fetch some summary data to pass to email
      const org = await ctx.db.get(report.organizationId);
      if (!org) continue;

      // Calculate next run
      const reportDate = new Date(report.nextRun); // Base off previous scheduled time to avoid drift? 
      // Or base off now? Base off now is safer to prevent catch-up loops.
      const runDate = new Date(now);
      
      let nextRun = runDate.getTime();
      if (report.frequency === "daily") {
         runDate.setDate(runDate.getDate() + 1);
         nextRun = runDate.getTime();
      }
      else if (report.frequency === "weekly") {
         runDate.setDate(runDate.getDate() + 7);
         nextRun = runDate.getTime();
      }
      else if (report.frequency === "monthly") {
         runDate.setMonth(runDate.getMonth() + 1);
         nextRun = runDate.getTime();
      }

      await ctx.db.patch(report._id, {
        lastRun: now,
        nextRun,
      });

      // Schedule email
      await ctx.scheduler.runAfter(0, (internal.reports as any).sendReportEmail, {
        reportId: report._id,
        organizationId: report.organizationId,
        orgName: org.name,
        recipients: report.recipients,
        type: report.type,
        logoUrl: org.logoUrl,
      });
    }
  },
});

export const sendReportEmail = action({
  args: {
    reportId: v.id("reportSchedules"),
    organizationId: v.id("organizations"),
    orgName: v.string(),
    recipients: v.array(v.string()),
    type: v.string(),
    logoUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    console.log(`[MOCK EMAIL] Preparing ${args.type} report for ${args.orgName}...`);

    // Fetch data for the report
    const alertsData = await ctx.runQuery(api.alerts.getAlertsAndThreats, { 
        organizationId: args.organizationId 
    });
    
    const riskData = await ctx.runQuery(api.audit.getRiskHistory, { 
        organizationId: args.organizationId,
        days: 30 
    });

    // Construct Email Content
    const subject = `Security Report: ${args.orgName} - ${new Date().toLocaleDateString()}`;
    
    let body = `
      <h1>Security Report for ${args.orgName}</h1>
      <p>Date: ${new Date().toLocaleDateString()}</p>
    `;

    if (args.logoUrl) {
        body = `<img src="${args.logoUrl}" alt="${args.orgName} Logo" style="max-width: 200px;" /><br/>` + body;
    }

    if (args.type === 'summary' || args.type === 'risk_detail') {
        const currentRisk = riskData.length > 0 ? riskData[riskData.length - 1] : null;
        
        body += `
          <h2>Executive Summary</h2>
          <ul>
            <li><strong>Total Devices:</strong> ${alertsData?.summary?.totalAlerts !== undefined ? 'Checked' : 'N/A'}</li> 
            <li><strong>Current Risk Score:</strong> ${currentRisk?.avgRiskScore ?? 'N/A'}</li>
            <li><strong>Critical Alerts:</strong> ${alertsData?.summary?.criticalAlerts ?? 0}</li>
            <li><strong>High Alerts:</strong> ${alertsData?.summary?.highAlerts ?? 0}</li>
          </ul>
        `;
    }

    if (args.type === 'risk_detail' && alertsData?.alerts?.length > 0) {
        body += `<h2>Top Critical Alerts</h2><ul>`;
        alertsData.alerts.slice(0, 5).forEach((alert: any) => {
            body += `<li>[${alert.severity.toUpperCase()}] ${alert.message} (${alert.deviceName})</li>`;
        });
        body += `</ul>`;
    }
    
    body += `
      <p>
        <a href="https://cryptiomt.com/dashboard">View Full Dashboard</a>
      </p>
    `;

    console.log(`[MOCK EMAIL] Sending to ${args.recipients.join(", ")}`);
    console.log(`[MOCK EMAIL] Subject: ${subject}`);
    console.log(`[MOCK EMAIL] Body Preview: ${body.substring(0, 200)}...`);
    
    // Here we would use Resend/SendGrid
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // await resend.emails.send({ ... });
  },
});
