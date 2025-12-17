import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Daily sync of CVEs
crons.daily(
  "sync-cves-daily",
  { hourUTC: 2, minuteUTC: 0 }, // Run at 2 AM UTC
  // @ts-ignore - generated API adds cves group after convex dev builds
  internal.cves.fetchAndSyncCVEs,
  { daysBack: 7 }
);

// Daily risk snapshot
crons.daily(
  "daily-risk-snapshot",
  { hourUTC: 23, minuteUTC: 55 }, // Run at end of day
  // @ts-ignore
  internal.audit.captureAllDailyRiskSnapshots
);

// Hourly report processing
crons.hourly(
  "process-scheduled-reports",
  { minuteUTC: 0 }, // Run every hour
  // @ts-ignore
  internal.reports.processScheduledReports
);

export default crons;
