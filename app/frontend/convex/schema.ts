import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Schema for CryptIoMT Cybersecurity Risk Assessment Platform
export default defineSchema({
  // Organizations collection - Healthcare organizations using the system
  organizations: defineTable({
    name: v.string(),                          // Organization name
    address: v.optional(v.string()),           // Physical address (optional)
    contactEmail: v.string(),                  // Primary contact email
    contactPhone: v.optional(v.string()),      // Contact phone number (optional)
    logoUrl: v.optional(v.string()),           // Organization logo URL for reports
    type: v.string(),                          // E.g., "Hospital", "Clinic", "Lab"
    status: v.union(v.literal("active"), v.literal("inactive")), // Organization status
    subscriptionTier: v.union(v.literal("basic"), v.literal("pro"), v.literal("enterprise")), // Subscription tier
    isActive: v.boolean(),                     // Active status (for backward compatibility)
    createdBy: v.string(),                     // Admin who created this org
    createdAt: v.number(),                     // Timestamp of creation
    updatedAt: v.number(),                     // Timestamp of last update
    lastUpdated: v.number(),                   // Alias for updatedAt (backward compatibility)
    settings: v.object({                       // Organization settings
      allowUserRegistration: v.boolean(),      // Allow users to self-register
      requireApproval: v.boolean(),            // Require approval for new members
      allowedDomains: v.optional(v.array(v.string())), // Approved email domains for users
      notificationEmails: v.optional(v.array(v.string())), // Emails to receive notifications
      customFields: v.optional(v.any()),       // Organization-specific custom fields
      maxUsers: v.optional(v.number()),        // Maximum number of users
    }),
    metadata: v.optional(v.any()),             // Additional metadata
  }).index("by_name", ["name"])
    .index("by_status", ["status"])
    .index("by_contact_email", ["contactEmail"])
    .index("by_type", ["type"])
    .index("by_subscription", ["subscriptionTier"]),

  // NEW: Junction table for many-to-many user-organization relationships
  organizationMembers: defineTable({
    userId: v.id("users"),                     // Reference to user
    organizationId: v.id("organizations"),     // Reference to organization
    memberRole: v.union(
      v.literal("owner"),                      // Organization owner
      v.literal("admin"),                     // Organization admin
      v.literal("member"),                    // Regular member
      v.literal("viewer")                     // Read-only access
    ),
    memberStatus: v.union(
      v.literal("active"),                    // Active member
      v.literal("pending"),                  // Pending invitation
      v.literal("inactive"),                 // Inactive member
      v.literal("suspended")                 // Suspended member
    ),
    joinedAt: v.number(),                      // When user joined organization
    invitedBy: v.optional(v.id("users")),      // Who invited this user
    invitedAt: v.optional(v.number()),         // When invitation was sent
    permissions: v.optional(v.array(v.string())), // Organization-specific permissions
    createdAt: v.number(),                     // Timestamp of creation
    updatedAt: v.number(),                     // Timestamp of last update
  }).index("by_user", ["userId"])
    .index("by_organization", ["organizationId"])
    .index("by_user_org", ["userId", "organizationId"]) // Unique constraint
    .index("by_status", ["memberStatus"])
    .index("by_role", ["memberRole"])
    .index("by_invited_by", ["invitedBy"]),

  // UPDATED: Users collection - Removed organizationId, orgRole (now in organizationMembers)
  users: defineTable({
    clerkId: v.string(),                       // External ID from Clerk auth
    email: v.string(),                         // User email
    firstName: v.optional(v.string()),         // First name
    lastName: v.optional(v.string()),          // Last name
    name: v.optional(v.string()),              // Full name (for backward compatibility)
    role: v.union(
      v.literal("super_admin"),                // Platform super admin
      v.literal("admin"),                     // Platform admin
      v.literal("customer"),                  // Regular user (can join organizations)
      v.literal("analyst")                    // Security analyst
    ),
    // REMOVED: organizationId - now handled by organizationMembers table
    // REMOVED: orgRole - now handled by organizationMembers table
    status: v.union(v.literal("active"), v.literal("inactive"), v.literal("pending"), v.literal("suspended")), // User status
    subscriptionTier: v.optional(v.union(v.literal("basic"), v.literal("pro"), v.literal("enterprise"))),
    isActive: v.boolean(),                     // Active status
    isBlocked: v.optional(v.boolean()),        // Blocked status
    permissions: v.optional(v.array(v.string())), // Global user permissions
    lastLogin: v.optional(v.number()),         // Timestamp of last login
    lastActive: v.optional(v.number()),        // Last activity timestamp
    invitedBy: v.optional(v.string()),         // Who invited this user
    createdBy: v.optional(v.string()),         // Who created this user
    createdAt: v.number(),                     // Timestamp of creation
    updatedAt: v.number(),                     // Timestamp of last update
    lastUpdated: v.number(),                   // Alias for updatedAt (backward compatibility)
    preferences: v.optional(v.object({         // User preferences
      theme: v.optional(v.union(v.literal("light"), v.literal("dark"))), // UI theme preference
      dashboardLayout: v.optional(v.string()),  // Dashboard layout preference
      notifications: v.optional(v.boolean()),   // Notification settings
      defaultOrganization: v.optional(v.id("organizations")), // User's preferred default organization
      emailDigests: v.optional(v.object({
        weeklySummary: v.boolean(),
        securityAlerts: v.boolean(),
        marketingUpdates: v.boolean(),
      })),
    })),
    // Legacy fields for backward compatibility
    company: v.optional(v.string()),           // Legacy company field
  }).index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_role", ["role"])
    .index("by_status", ["status"])
    .index("by_company", ["company"]),

  // Medical Devices collection - Core data about each medical device
  medicalDevices: defineTable({
    organizationId: v.id("organizations"),     // Organization that owns the device
    name: v.string(),                          // Device name (from "Name" column)
    entity: v.string(),                        // Hospital/entity name (from "Entity" column)
    serialNumber: v.string(),                  // Serial number (from "Serial Number" column)
    manufacturer: v.string(),                  // Device manufacturer (from "Manufacturer" column)
    model: v.string(),                         // Device model (from "Model" column)
    category: v.string(),                      // Device category (from "Category" column)
    classification: v.string(),                // Device classification (from "Classification" column)
    technician: v.optional(v.string()),        // Assigned technician name (from "Technician" column)
    customerPHICategory: v.optional(v.string()), // Customer PHI category (from "Customer PHI category" column)
    deviceOnNetwork: v.boolean(),              // Device on network status (from "Device on network?" column)
    hasPHI: v.boolean(),                       // Has PHI status (from "Has PHI" column)
    ipAddress: v.optional(v.string()),         // IP address (from "IP Address" column)
    macAddress: v.optional(v.string()),        // MAC address (from "MAC Address" column)
    osManufacturer: v.optional(v.string()),    // OS manufacturer (from "OS manufacturer" column)
    osVersion: v.optional(v.string()),         // OS version (from "OS Version" column)
    
    // Keep existing fields for backward compatibility
    controlNumber: v.optional(v.string()),     // Control/asset number (legacy)
    modalityType: v.optional(v.string()),      // Modality type (legacy)
    equipmentCriticality: v.optional(v.union(v.literal("Critical"), v.literal("High"), v.literal("Medium"), v.literal("Low"))), // Criticality level (legacy)
    location: v.optional(v.string()),          // Physical location (legacy)
    department: v.optional(v.string()),        // Department (legacy)
    acquisitionDate: v.optional(v.number()),   // When device was acquired (legacy)
    lastServiceDate: v.optional(v.number()),   // Last service date (legacy)
    nextServiceDate: v.optional(v.number()),   // Next scheduled service (legacy)
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"), v.literal("maintenance"), v.literal("retired"))), // Device status (legacy)
    importBatch: v.optional(v.string()),       // Import batch identifier
    createdAt: v.number(),                     // Timestamp of creation
    updatedAt: v.number(),                     // Timestamp of last update
    importedBy: v.optional(v.id("users")),     // Admin who imported the device
    cveCount: v.optional(v.number()),          // Number of active CVEs
    tags: v.optional(v.array(v.string())),     // Device tags
  }).index("by_organization", ["organizationId"])
    .index("by_serial_number", ["serialNumber"])
    .index("by_manufacturer_model", ["manufacturer", "model"])
    .index("by_category", ["category"])
    .index("by_device_on_network", ["deviceOnNetwork"])
    .index("by_has_phi", ["hasPHI"])
    .index("by_ip_address", ["ipAddress"])
    .index("by_mac_address", ["macAddress"])
    .index("by_import_batch", ["importBatch"])
    .searchIndex("search_all", {
      searchField: "name",
      filterFields: ["organizationId"],
    }),

  // Device Groups - Smart groups or static lists
  deviceGroups: defineTable({
    organizationId: v.id("organizations"),
    name: v.string(),
    description: v.optional(v.string()),
    filters: v.object({
      tags: v.optional(v.array(v.string())),
      category: v.optional(v.string()),
      manufacturer: v.optional(v.string()),
      classification: v.optional(v.string()),
      status: v.optional(v.string()),
      hasPHI: v.optional(v.string()), // "yes" or "no"
      network: v.optional(v.string()), // "connected" or "offline"
      search: v.optional(v.string()),
    }),
    isSmartGroup: v.boolean(),
    createdBy: v.id("users"),
    createdAt: v.number(),
  }).index("by_org", ["organizationId"]),

  // Technical Details collection - Technical specifications including network and OS details
  technicalDetails: defineTable({
    deviceId: v.id("medicalDevices"),          // Reference to medical device
    ipAddress: v.optional(v.string()),         // IP address
    macAddress: v.optional(v.string()),        // MAC address
    networkStatus: v.union(v.literal("connected"), v.literal("not_connected"), v.literal("not_evaluated")), // Network connectivity status
    networkType: v.optional(v.string()),       // Network type
    osManufacturer: v.optional(v.string()),    // OS manufacturer
    osName: v.optional(v.string()),            // OS name
    osVersion: v.optional(v.string()),         // OS version
    osBuild: v.optional(v.string()),           // OS build number
    osArchitecture: v.optional(v.string()),    // OS architecture (32-bit/64-bit)
    lastOsUpdate: v.optional(v.number()),      // Last OS update timestamp
    antivirusInstalled: v.optional(v.boolean()), // Whether antivirus is installed
    antivirusName: v.optional(v.string()),     // Antivirus software name
    antivirusVersion: v.optional(v.string()),  // Antivirus version
    lastAntivirusUpdate: v.optional(v.number()), // Last antivirus update
    firewallEnabled: v.optional(v.boolean()),  // Whether firewall is enabled
    encryptionStatus: v.optional(v.string()),  // Encryption status
    openPorts: v.optional(v.array(v.number())), // List of open ports
    installedSoftware: v.optional(v.array(v.object({ // Installed software list
      name: v.string(),
      version: v.string(),
      vendor: v.optional(v.string()),
    }))),
    lastScanned: v.optional(v.number()),       // Last security scan timestamp
    createdAt: v.number(),                     // Timestamp of creation
    updatedAt: v.number(),                     // Timestamp of last update
  }).index("by_device", ["deviceId"])
    .index("by_ip_address", ["ipAddress"])
    .index("by_mac_address", ["macAddress"])
    .index("by_network_status", ["networkStatus"])
    .index("by_os_manufacturer", ["osManufacturer"]),

  // CVEs collection - Known security vulnerabilities from NVD
  cves: defineTable({
    cveId: v.string(),                         // CVE ID (e.g., "CVE-2024-1234")
    description: v.string(),                   // Vulnerability description
    published: v.string(),                     // Published date (ISO 8601)
    lastModified: v.string(),                  // Last modified date (ISO 8601)
    cvssScore: v.optional(v.number()),         // CVSS score (0-10)
    severity: v.optional(v.string()),          // Severity level (CRITICAL, HIGH, MEDIUM, LOW)
    vendors: v.array(v.string()),              // Affected vendors/manufacturers
    products: v.array(v.string()),             // Affected products/models
    references: v.optional(v.array(v.string())), // Reference links
    cisaExploited: v.optional(v.boolean()),    // Whether it's actively exploited
  }).index("by_cve_id", ["cveId"])
    .index("by_published", ["published"])
    .searchIndex("search_description", {
      searchField: "description",
    }),

  // Device-CVE Junction table - Links devices to their specific vulnerabilities
  deviceCves: defineTable({
    organizationId: v.optional(v.id("organizations")), // Added for org-level queries
    deviceId: v.id("medicalDevices"),          // Reference to medical device
    cveId: v.id("cves"),                       // Reference to CVE
    cveCode: v.string(),                       // CVE ID string for easier querying
    status: v.string(),                        // Status (e.g., "active", "mitigated", "patched", "accepted")
    notes: v.optional(v.string()),             // User notes for this specific device-cve
    detectedAt: v.number(),                    // When this vulnerability was matched to the device
    mitigatedAt: v.optional(v.number()),       // When it was marked mitigated/patched
    mitigatedBy: v.optional(v.id("users")),    // Who mitigated it
  }).index("by_device", ["deviceId"])
    .index("by_cve", ["cveId"])
    .index("by_device_cve", ["deviceId", "cveId"])
    .index("by_org", ["organizationId"])
    .index("by_org_status", ["organizationId", "status"]),

  // Risk Assessments collection - Security risk assessments for devices
  riskAssessments: defineTable({
    deviceId: v.id("medicalDevices"),          // Reference to medical device
    organizationId: v.id("organizations"),     // Organization reference
    overallRiskScore: v.number(),              // Overall risk score (0-100)
    riskLevel: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")), // Risk level
    riskFactors: v.object({                    // Risk assessment factors
      networkExposure: v.number(),             // Network exposure score
      osVulnerabilities: v.number(),           // OS vulnerability score
      softwareVulnerabilities: v.number(),     // Software vulnerability score
      patchLevel: v.number(),                  // Patch management score
      accessControls: v.number(),              // Access control score
      encryptionScore: v.number(),             // Encryption implementation score
      configurationScore: v.number(),          // Security configuration score
    }),
    vulnerabilities: v.array(v.object({        // Identified vulnerabilities
      cveId: v.optional(v.string()),           // CVE identifier
      severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
      description: v.string(),                 // Vulnerability description
      impact: v.string(),                      // Potential impact
      recommendation: v.string(),              // Remediation recommendation
    })),
    recommendations: v.array(v.string()),      // Security recommendations
    complianceStatus: v.object({               // Compliance assessment
      hipaa: v.optional(v.boolean()),          // HIPAA compliance
      hitech: v.optional(v.boolean()),         // HITECH compliance
      fda: v.optional(v.boolean()),            // FDA compliance
      nist: v.optional(v.boolean()),           // NIST compliance
    }),
    assessedBy: v.id("users"),                 // User who performed assessment
    assessmentDate: v.number(),                // Assessment timestamp
    nextAssessmentDue: v.number(),             // Next assessment due date
    createdAt: v.number(),                     // Timestamp of creation
    updatedAt: v.number(),                     // Timestamp of last update
  }).index("by_device", ["deviceId"])
    .index("by_organization", ["organizationId"])
    .index("by_risk_level", ["riskLevel"])
    .index("by_assessment_date", ["assessmentDate"])
    .index("by_next_assessment", ["nextAssessmentDue"]),

  // Excel Uploads collection - Track file uploads and processing
  excelUploads: defineTable({
    organizationId: v.id("organizations"),     // Organization reference
    fileName: v.string(),                      // Original file name
    uploadedBy: v.id("users"),                 // User who uploaded the file
    uploadDate: v.number(),                    // Upload timestamp
    status: v.union(v.literal("processing"), v.literal("completed"), v.literal("failed")), // Processing status
    recordsProcessed: v.number(),              // Total records processed
    recordsAdded: v.number(),                  // New records added
    recordsUpdated: v.number(),                // Existing records updated
    recordsSkipped: v.number(),                // Records skipped due to errors
    errors: v.array(v.object({                 // Processing errors
      row: v.number(),                         // Row number with error
      column: v.optional(v.string()),          // Column with error
      message: v.string(),                     // Error message
      severity: v.union(v.literal("warning"), v.literal("error")), // Error severity
    })),
    fileHash: v.string(),                      // File hash for duplicate detection
    batchId: v.string(),                       // Batch identifier for imported devices
    processingStarted: v.optional(v.number()), // Processing start timestamp
    processingCompleted: v.optional(v.number()), // Processing completion timestamp
    createdAt: v.number(),                     // Timestamp of creation
  }).index("by_organization", ["organizationId"])
    .index("by_upload_date", ["uploadDate"])
    .index("by_status", ["status"])
    .index("by_batch_id", ["batchId"])
    .index("by_file_hash", ["fileHash"]),

  // Audit Logs collection - Track user actions and system events
  auditLogs: defineTable({
    userId: v.id("users"),                     // User who performed the action
    organizationId: v.optional(v.id("organizations")), // Organization context (if applicable)
    action: v.string(),                        // Action performed
    resource: v.string(),                      // Resource affected
    resourceId: v.optional(v.string()),        // ID of affected resource
    details: v.object({                        // Action details
      before: v.optional(v.any()),             // State before action
      after: v.optional(v.any()),              // State after action
      metadata: v.optional(v.any()),           // Additional metadata
    }),
    timestamp: v.number(),                     // Action timestamp
    ipAddress: v.optional(v.string()),         // User's IP address
    userAgent: v.optional(v.string()),         // User's browser/client info
    sessionId: v.optional(v.string()),         // Session identifier
    severity: v.union(v.literal("info"), v.literal("warning"), v.literal("error")), // Log severity
  }).index("by_user", ["userId"])
    .index("by_organization", ["organizationId"])
    .index("by_timestamp", ["timestamp"])
    .index("by_action", ["action"])
    .index("by_resource", ["resource"])
    .index("by_severity", ["severity"]),

  // Scheduled Reports - Automated email reports
  reportSchedules: defineTable({
    organizationId: v.id("organizations"),
    name: v.string(),
    frequency: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly")),
    recipients: v.array(v.string()), // Email addresses
    type: v.union(v.literal("summary"), v.literal("risk_detail"), v.literal("compliance")),
    dayOfWeek: v.optional(v.number()), // 0-6 for weekly
    dayOfMonth: v.optional(v.number()), // 1-31 for monthly
    lastRun: v.optional(v.number()),
    nextRun: v.number(),
    createdBy: v.id("users"),
    isActive: v.boolean(),
  }).index("by_org", ["organizationId"])
    .index("by_next_run", ["nextRun"]),

  // Equipment collection - General IT equipment (separate from medical devices)
  equipment: defineTable({
    organizationId: v.id("organizations"),
    deviceName: v.string(),
    deviceType: v.union(
      v.literal("server"),
      v.literal("workstation"),
      v.literal("laptop"),
      v.literal("mobile"),
      v.literal("iot"),
      v.literal("network_device"),
      v.literal("medical_device"),
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
    excelRowId: v.optional(v.string()),
  }).index("by_organization", ["organizationId"])
    .index("by_device_type", ["deviceType"])
    .index("by_risk_score", ["riskScore"])
    .index("by_excel_row", ["excelRowId"]),

  // Software collection - Software installed on equipment
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

  // Vulnerabilities collection - CVE database
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

  // Utility table for testing
  numbers: defineTable({
    value: v.number(),
  }),
  // Add invitations table inside the schema object
  invitations: defineTable({
    organizationId: v.id("organizations"),
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("member")),
    code: v.string(),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("expired")),
    createdById: v.id("users"),
    createdAt: v.number(),
    expiresAt: v.number(),
    usedAt: v.optional(v.number()),
    usedById: v.optional(v.id("users")),
  }).index("by_organization", ["organizationId"])
    .index("by_email", ["email"])
    .index("by_code", ["code"])
    .index("by_status", ["status"]),
  // Device Audit Logs - History of changes
  deviceLogs: defineTable({
    deviceId: v.id("medicalDevices"),
    timestamp: v.number(),
    type: v.union(
      v.literal("risk_change"),
      v.literal("status_change"),
      v.literal("cve_match"),
      v.literal("manual_update"),
      v.literal("network_change")
    ),
    previousValue: v.optional(v.any()), 
    newValue: v.optional(v.any()),
    userId: v.optional(v.string()), // Clerk ID or User ID
    details: v.string(), 
  }).index("by_device", ["deviceId"])
    .index("by_timestamp", ["timestamp"]),

  // Daily Risk Snapshots - Organization-wide risk trend
  riskSnapshots: defineTable({
    organizationId: v.id("organizations"),
    date: v.string(), // YYYY-MM-DD
    timestamp: v.number(),
    totalRiskScore: v.number(),
    avgRiskScore: v.number(),
    deviceCount: v.number(),
    highRiskCount: v.number(),
    criticalRiskCount: v.number(),
    devicesWithCVEs: v.number(),
  }).index("by_org_date", ["organizationId", "date"])
    .index("by_org_timestamp", ["organizationId", "timestamp"]),

  // Compliance Assessments - Track compliance status against frameworks
  complianceAssessments: defineTable({
    organizationId: v.id("organizations"),
    frameworkId: v.string(), // "hipaa", "nist"
    controlId: v.string(), // "164.308(a)(1)"
    status: v.string(), // "compliant", "non_compliant", "in_progress", "not_applicable"
    evidence: v.optional(v.string()), // User notes/evidence
    lastUpdated: v.number(),
    updatedBy: v.optional(v.id("users")), // Made optional for now to ease migration/auto-updates
  }).index("by_org_framework", ["organizationId", "frameworkId"])
    .index("by_org_control", ["organizationId", "controlId"]),
});