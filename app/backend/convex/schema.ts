import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Schema for CryptIoMT Cybersecurity Risk Assessment Platform
export default defineSchema({
  // Admin users and permissions
  adminUsers: defineTable({
    clerkUserId: v.string(),
    email: v.string(),
    name: v.string(),
    role: v.union(v.literal("super_admin"), v.literal("admin"), v.literal("analyst")),
    permissions: v.array(v.string()),
    isActive: v.boolean(),
    lastLogin: v.optional(v.number()),
    customersAssigned: v.array(v.id("customers")),
  }).index("by_clerk_id", ["clerkUserId"])
    .index("by_email", ["email"]),

  // Customer management
  customers: defineTable({
    name: v.string(),
    email: v.string(),
    company: v.string(),
    role: v.union(v.literal("customer"), v.literal("admin"), v.literal("super_admin")),
    subscriptionTier: v.union(v.literal("basic"), v.literal("pro"), v.literal("enterprise")),
    isActive: v.boolean(),
    isBlocked: v.optional(v.boolean()),
    createdBy: v.string(), // Admin user ID
    lastUpdated: v.number(),
    clerkUserId: v.optional(v.string()), // For customer portal access
  }).index("by_email", ["email"])
    .index("by_company", ["company"])
    .index("by_clerk_id", ["clerkUserId"])
    .index("by_role", ["role"]),

  // Equipment inventory
  equipment: defineTable({
    customerId: v.id("customers"),
    deviceName: v.string(),
    deviceType: v.union(
      v.literal("server"),
      v.literal("workstation"),
      v.literal("laptop"),
      v.literal("mobile"),
      v.literal("iot"),
      v.literal("network_device"),
      v.literal("other")
    ),
    operatingSystem: v.string(),
    osVersion: v.string(),
    ipAddress: v.optional(v.string()),
    macAddress: v.optional(v.string()),
    location: v.optional(v.string()),
    department: v.optional(v.string()),
    owner: v.optional(v.string()),
    lastSeen: v.optional(v.number()),
    status: v.union(v.literal("active"), v.literal("inactive"), v.literal("maintenance")),
    riskScore: v.optional(v.number()),
    lastRiskAssessment: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
    excelRowId: v.optional(v.string()), // For Excel sync tracking
  }).index("by_customer", ["customerId"])
    .index("by_device_type", ["deviceType"])
    .index("by_risk_score", ["riskScore"])
    .index("by_excel_row", ["excelRowId"]),

  // Software inventory
  software: defineTable({
    equipmentId: v.id("equipment"),
    name: v.string(),
    version: v.string(),
    vendor: v.string(),
    category: v.union(
      v.literal("operating_system"),
      v.literal("antivirus"),
      v.literal("firewall"),
      v.literal("application"),
      v.literal("driver"),
      v.literal("other")
    ),
    installDate: v.optional(v.number()),
    lastUpdated: v.optional(v.number()),
    isVulnerable: v.boolean(),
    vulnerabilityCount: v.number(),
    riskLevel: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
  }).index("by_equipment", ["equipmentId"])
    .index("by_vulnerability", ["isVulnerable"])
    .index("by_risk_level", ["riskLevel"]),

  // Vulnerability database
  vulnerabilities: defineTable({
    cveId: v.string(),
    title: v.string(),
    description: v.string(),
    severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    cvssScore: v.number(),
    affectedSoftware: v.array(v.string()),
    affectedVersions: v.array(v.string()),
    patchAvailable: v.boolean(),
    patchUrl: v.optional(v.string()),
    publishedDate: v.number(),
    lastModified: v.number(),
  }).index("by_cve", ["cveId"])
    .index("by_severity", ["severity"])
    .index("by_cvss_score", ["cvssScore"]),

  // Risk assessments
  riskAssessments: defineTable({
    equipmentId: v.id("equipment"),
    customerId: v.id("customers"),
    overallRiskScore: v.number(),
    riskLevel: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    factors: v.object({
      osVulnerabilities: v.number(),
      softwareVulnerabilities: v.number(),
      patchLevel: v.number(),
      networkExposure: v.number(),
      accessControls: v.number(),
    }),
    recommendations: v.array(v.string()),
    assessedBy: v.string(), // Admin user ID
    assessmentDate: v.number(),
    nextAssessmentDue: v.number(),
  }).index("by_equipment", ["equipmentId"])
    .index("by_customer", ["customerId"])
    .index("by_risk_level", ["riskLevel"])
    .index("by_assessment_date", ["assessmentDate"]),

  // Excel upload tracking
  excelUploads: defineTable({
    customerId: v.id("customers"),
    fileName: v.string(),
    uploadedBy: v.string(), // Admin user ID
    uploadDate: v.number(),
    status: v.union(v.literal("processing"), v.literal("completed"), v.literal("failed")),
    recordsProcessed: v.number(),
    recordsAdded: v.number(),
    recordsUpdated: v.number(),
    errors: v.array(v.string()),
    fileHash: v.string(), // For duplicate detection
  }).index("by_customer", ["customerId"])
    .index("by_upload_date", ["uploadDate"])
    .index("by_status", ["status"]),

  // Audit logs
  auditLogs: defineTable({
    userId: v.string(),
    action: v.string(),
    resource: v.string(),
    resourceId: v.optional(v.string()),
    details: v.object({
      before: v.optional(v.any()),
      after: v.optional(v.any()),
      metadata: v.optional(v.any()),
    }),
    timestamp: v.number(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  }).index("by_user", ["userId"])
    .index("by_timestamp", ["timestamp"])
    .index("by_action", ["action"]),

  // Keep the existing numbers table for now
  numbers: defineTable({
    value: v.number(),
  }),
});
