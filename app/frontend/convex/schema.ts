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

  // Unified Users collection - All users (admins, org owners, org members)
  users: defineTable({
    clerkId: v.string(),                       // External ID from Clerk auth
    email: v.string(),                         // User email
    firstName: v.optional(v.string()),         // First name
    lastName: v.optional(v.string()),          // Last name
    name: v.optional(v.string()),              // Full name (for backward compatibility)
    role: v.union(
      v.literal("super_admin"),                // Platform super admin
      v.literal("admin"),                     // Platform admin
      v.literal("orgOwner"),                  // Organization owner
      v.literal("orgMember"),                 // Organization member
      v.literal("customer"),                  // Legacy customer role
      v.literal("analyst")                    // Security analyst
    ),
    organizationId: v.optional(v.id("organizations")), // Reference to organization (null for platform admins)
    orgRole: v.optional(v.string()),           // Role within organization ("owner", "admin", "member")
    status: v.union(v.literal("active"), v.literal("inactive"), v.literal("pending"), v.literal("suspended")), // User status
    subscriptionTier: v.optional(v.union(v.literal("basic"), v.literal("pro"), v.literal("enterprise"))),
    isActive: v.boolean(),                     // Active status
    isBlocked: v.optional(v.boolean()),        // Blocked status
    permissions: v.optional(v.array(v.string())), // User permissions
    lastLogin: v.optional(v.number()),         // Timestamp of last login
    joinedAt: v.optional(v.number()),          // When user joined organization
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
    })),
    // Legacy fields for backward compatibility
    company: v.optional(v.string()),           // Legacy company field
  }).index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_organization", ["organizationId"])
    .index("by_role", ["role"])
    .index("by_status", ["status"])
    .index("by_org_role", ["orgRole"])
    .index("by_company", ["company"]),

  // Medical Devices collection - Core data about each medical device
  medicalDevices: defineTable({
    organizationId: v.id("organizations"),     // Organization that owns the device
    controlNumber: v.string(),                 // Control/asset number
    entity: v.string(),                        // Hospital/entity name
    name: v.string(),                          // Device name
    manufacturer: v.string(),                  // Device manufacturer
    model: v.string(),                         // Device model
    serialNumber: v.string(),                  // Serial number
    category: v.string(),                      // Device category
    modalityType: v.optional(v.string()),      // Modality type (e.g., "MRI", "CT")
    classification: v.string(),                // Device classification
    equipmentCriticality: v.union(v.literal("Critical"), v.literal("High"), v.literal("Medium"), v.literal("Low")), // Criticality level
    technician: v.optional(v.string()),        // Assigned technician name
    location: v.optional(v.string()),          // Physical location
    department: v.optional(v.string()),        // Department
    acquisitionDate: v.optional(v.number()),   // When device was acquired
    lastServiceDate: v.optional(v.number()),   // Last service date
    nextServiceDate: v.optional(v.number()),   // Next scheduled service
    status: v.union(v.literal("active"), v.literal("inactive"), v.literal("maintenance"), v.literal("retired")), // Device status
    importBatch: v.string(),                   // Import batch identifier
    createdAt: v.number(),                     // Timestamp of creation
    updatedAt: v.number(),                     // Timestamp of last update
    importedBy: v.id("users"),                 // Admin who imported the device
  }).index("by_organization", ["organizationId"])
    .index("by_control_number", ["controlNumber"])
    .index("by_serial_number", ["serialNumber"])
    .index("by_equipment_criticality", ["equipmentCriticality"])
    .index("by_manufacturer_model", ["manufacturer", "model"])
    .index("by_category", ["category"])
    .index("by_status", ["status"])
    .index("by_import_batch", ["importBatch"]),

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
});
