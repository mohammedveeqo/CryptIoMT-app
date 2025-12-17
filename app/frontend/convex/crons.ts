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

export default crons;
