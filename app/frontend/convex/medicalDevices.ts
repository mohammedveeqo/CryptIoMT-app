import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getAllMedicalDevices = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, { organizationId }) => {
    return await ctx.db
      .query("medicalDevices")
      .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
      .collect();
  },
});

export const clearOrganizationDevices = mutation({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, { organizationId }) => {
    // Verify admin access
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    
    if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
      throw new Error("Admin access required");
    }

    // Delete all devices for this organization
    const devices = await ctx.db
      .query("medicalDevices")
      .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
      .collect();
    
    for (const device of devices) {
      await ctx.db.delete(device._id);
    }
    
    return { deleted: devices.length };
  },
});

export const bulkUpdateDeviceStatus = mutation({
  args: {
    organizationId: v.id("organizations"),
    deviceIds: v.array(v.id("medicalDevices")),
    status: v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("maintenance"),
      v.literal("retired")
    )
  },
  handler: async (ctx, { organizationId, deviceIds, status }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const isAdmin = ["admin", "super_admin", "analyst"].includes(user.role);
    if (!isAdmin) throw new Error("Admin access required");

    // Verify devices belong to organization and update status
    let updated = 0;
    for (const id of deviceIds) {
      const dev = await ctx.db.get(id);
      if (!dev) continue;
      if (dev.organizationId !== organizationId) continue;
      await ctx.db.patch(id, { status, updatedAt: Date.now() });
      updated++;
    }

    return { updated };
  }
});

export const importMedicalDevices = mutation({
  args: {
    organizationId: v.id("organizations"),
    devices: v.array(v.any())
  },
  handler: async (ctx, { organizationId, devices }) => {
    // Verify admin access
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    
    if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
      throw new Error("Admin access required");
    }

    const results = { imported: 0, errors: [] as string[] };
    
    for (const deviceData of devices) {
      try {
        await ctx.db.insert("medicalDevices", {
          organizationId,
          name: deviceData.Name || "",
          entity: deviceData.Entity || "",
          serialNumber: deviceData["Serial Number"] || "",
          manufacturer: deviceData.Manufacturer || "",
          model: deviceData.Model || "",
          category: deviceData.Category || "",
          classification: deviceData.Classification || "",
          technician: deviceData.Technician || "",
          customerPHICategory: deviceData["Customer PHI category"] || "",
          deviceOnNetwork: deviceData["Device on network?"] === "Yes",
          hasPHI: deviceData["Has PHI"] === "Yes",
          ipAddress: deviceData["IP Address"] || "",
          macAddress: deviceData["MAC Address"] || "",
          osManufacturer: deviceData["OS manufacturer"] || "",
          osVersion: deviceData["OS Version"] || "",
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
        results.imported++;
      } catch (error) {
        results.errors.push(`Row ${results.imported + results.errors.length + 1}: ${error}`);
      }
    }
    
    return results;
  },
});

// Get device statistics for dashboard
export const getDeviceStats = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, { organizationId }) => {
    const devices = await ctx.db
      .query("medicalDevices")
      .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
      .collect();

    const totalDevices = devices.length;
    const onlineDevices = devices.filter(d => d.deviceOnNetwork).length;
    const devicesWithPHI = devices.filter(d => d.hasPHI).length;
    const criticalDevices = devices.filter(d => d.customerPHICategory === "High" || d.customerPHICategory === "Critical").length;

    // Calculate percentages for changes (mock data for now)
    return {
      totalDevices,
      onlineDevices,
      devicesWithPHI,
      criticalDevices,
      offlineDevices: totalDevices - onlineDevices,
      // Category breakdown
      categoryBreakdown: devices.reduce((acc, device) => {
        acc[device.category] = (acc[device.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      // Manufacturer breakdown
      manufacturerBreakdown: devices.reduce((acc, device) => {
        acc[device.manufacturer] = (acc[device.manufacturer] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      // Network status
      networkStats: {
        connected: onlineDevices,
        disconnected: totalDevices - onlineDevices,
        percentage: totalDevices > 0 ? Math.round((onlineDevices / totalDevices) * 100) : 0
      },
      // PHI classification
      phiStats: {
        withPHI: devicesWithPHI,
        withoutPHI: totalDevices - devicesWithPHI,
        percentage: totalDevices > 0 ? Math.round((devicesWithPHI / totalDevices) * 100) : 0
      }
    };
  },
});

// Get devices by category for charts
export const getDevicesByCategory = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, { organizationId }) => {
    const devices = await ctx.db
      .query("medicalDevices")
      .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
      .collect();

    return devices.reduce((acc, device) => {
      const category = device.category || "Unknown";
      if (!acc[category]) {
        acc[category] = {
          name: category,
          count: 0,
          devices: []
        };
      }
      acc[category].count++;
      acc[category].devices.push({
        name: device.name,
        manufacturer: device.manufacturer,
        model: device.model,
        entity: device.entity,
        networkStatus: device.deviceOnNetwork ? "Connected" : "Disconnected",
        hasPHI: device.hasPHI
      });
      return acc;
    }, {} as Record<string, { name: string; count: number; devices: any[] }>);
  },
});

// Get recent device activities (mock for now, can be enhanced later)
export const getRecentDeviceActivities = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, { organizationId }) => {
    const devices = await ctx.db
      .query("medicalDevices")
      .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
      .order("desc")
      .take(10);

    return devices.map(device => ({
      id: device._id,
      message: `Device ${device.name} health check completed`,
      timestamp: device.updatedAt,
      type: "health_check" as const,
      deviceName: device.name,
      entity: device.entity
    }));
  },
});

// Get technician performance data (Data Collection Avg Score)
export const getTechnicianPerformance = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, { organizationId }) => {
    const devices = await ctx.db
      .query("medicalDevices")
      .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
      .collect();

    const technicianStats = devices.reduce((acc, device) => {
      const technician = device.technician || "Unknown";
      if (!acc[technician]) {
        acc[technician] = {
          name: technician,
          totalDevices: 0,
          completedAssessments: 0,
          avgScore: 0
        };
      }
      acc[technician].totalDevices++;
      
      // More comprehensive scoring system
      const requiredFields = [
        device.name,
        device.manufacturer, 
        device.model,
        device.category,
        device.osManufacturer,
        device.serialNumber,
        device.entity,
        device.customerPHICategory,
        device.hasPHI,
        device.deviceOnNetwork
      ];
      
      const completedFields = requiredFields.filter(field => 
        field !== null && field !== undefined && field !== ""
      ).length;
      
      // Score based on percentage of completed fields (0-100)
      const completionScore = Math.round((completedFields / requiredFields.length) * 100);
      acc[technician].completedAssessments += completionScore;
      
      return acc;
    }, {} as Record<string, any>);

    // Calculate average scores
    Object.values(technicianStats).forEach((tech: any) => {
      tech.avgScore = tech.totalDevices > 0 
        ? Math.round(tech.completedAssessments / tech.totalDevices) 
        : 0;
    });

    return Object.values(technicianStats).sort((a: any, b: any) => b.avgScore - a.avgScore);
  },
});

// Get equipment criticality by hospital/entity
export const getEquipmentCriticalityByHospital = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, { organizationId }) => {
    const devices = await ctx.db
      .query("medicalDevices")
      .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
      .collect();

    const hospitalStats = devices.reduce((acc, device) => {
      const hospital = device.entity || "Unknown Hospital";
      if (!acc[hospital]) {
        acc[hospital] = {
          name: hospital,
          total: 0,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          networkOnly: 0
        };
      }
      
      acc[hospital].total++;
      
      // Improved criticality logic with fallbacks
      const phiCategory = device.customerPHICategory?.toLowerCase() || "";
      const hasPHI = device.hasPHI || false;
      const isNetworked = device.deviceOnNetwork || false;
      const category = device.category?.toLowerCase() || "";
      
      // More robust classification
      if (phiCategory.includes("critical") || 
          category.includes("life support") || 
          category.includes("ventilator") ||
          category.includes("defibrillator")) {
        acc[hospital].critical++;
      } else if (phiCategory.includes("high") || 
                 hasPHI || 
                 category.includes("monitor") ||
                 category.includes("imaging")) {
        acc[hospital].high++;
      } else if (phiCategory.includes("medium") ||
                 category.includes("diagnostic")) {
        acc[hospital].medium++;
      } else if (isNetworked && !hasPHI) {
        acc[hospital].networkOnly++;
      } else {
        acc[hospital].low++;
      }
      
      return acc;
    }, {} as Record<string, any>);

    return Object.values(hospitalStats).sort((a: any, b: any) => b.total - a.total);
  },
});

// Get operating system distribution
export const getOperatingSystemDistribution = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, { organizationId }) => {
    const devices = await ctx.db
      .query("medicalDevices")
      .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
      .collect();

    const osStats = devices.reduce((acc, device) => {
      const osManufacturer = device.osManufacturer || "Unknown";
      const osVersion = device.osVersion || "";
      
      // Group by manufacturer first
      if (!acc[osManufacturer]) {
        acc[osManufacturer] = {
          name: osManufacturer,
          total: 0,
          versions: {} as Record<string, number>
        };
      }
      
      acc[osManufacturer].total++;
      
      // Track specific versions
      if (osVersion) {
        const versionKey = `${osManufacturer} ${osVersion}`;
        acc[osManufacturer].versions[versionKey] = (acc[osManufacturer].versions[versionKey] || 0) + 1;
      }
      
      return acc;
    }, {} as Record<string, any>);

    // Flatten the data for chart display
    const flattenedData: any[] = [];
    Object.values(osStats).forEach((os: any) => {
      // Add manufacturer total
      flattenedData.push({
        name: os.name,
        count: os.total,
        type: 'manufacturer'
      });
      
      // Add top versions
      Object.entries(os.versions)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 5) // Top 5 versions per manufacturer
        .forEach(([version, count]) => {
          flattenedData.push({
            name: version,
            count: count as number,
            type: 'version',
            parent: os.name
          });
        });
    });

    return flattenedData.sort((a, b) => b.count - a.count);
  },
});

// Get dashboard analytics summary
export const getDashboardAnalytics = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, { organizationId }) => {
    const devices = await ctx.db
      .query("medicalDevices")
      .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
      .collect();

    const totalDevices = devices.length;
    const uniqueHospitals = new Set(devices.map(d => d.entity).filter(Boolean)).size;
    const uniqueTechnicians = new Set(devices.map(d => d.technician).filter(Boolean)).size;
    
    // Network connectivity analysis
    const networkConnectedDevices = devices.filter(d => d.deviceOnNetwork).length;
    const networkConnectedPercentage = totalDevices > 0 ? Math.round((networkConnectedDevices / totalDevices) * 100) : 0;
    
    // PHI Risk Distribution
    const phiDevices = devices.filter(d => d.hasPHI);
    const criticalPHI = devices.filter(d => 
      d.hasPHI && (d.customerPHICategory?.toLowerCase().includes("critical") || 
      (d.deviceOnNetwork && d.customerPHICategory?.toLowerCase().includes("high")))
    ).length;
    const highPHI = devices.filter(d => 
      d.hasPHI && d.customerPHICategory?.toLowerCase().includes("high") && 
      !d.customerPHICategory?.toLowerCase().includes("critical")
    ).length;
    const mediumPHI = devices.filter(d => 
      d.hasPHI && d.customerPHICategory?.toLowerCase().includes("medium")
    ).length;
    const lowPHI = phiDevices.length - criticalPHI - highPHI - mediumPHI;
    
    // Legacy OS Detection
    const legacyOSDevices = devices.filter(d => {
      const os = d.osVersion?.toLowerCase() || "";
      return os.includes("xp") || os.includes("2000") || os.includes("vista") || 
             os.includes("windows 7") || os.includes("windows 8");
    }).length;
    
    // Critical alerts calculation
    const criticalAlerts = devices.filter(d => 
      d.customerPHICategory?.toLowerCase().includes("critical") || 
      (d.hasPHI && d.deviceOnNetwork) ||
      (d.osVersion?.toLowerCase().includes("xp") || d.osVersion?.toLowerCase().includes("2000"))
    ).length;
    
    // Average technician score from performance data
    const technicianScores = devices.reduce((acc, device) => {
      if (device.technician) {
        if (!acc[device.technician]) {
          acc[device.technician] = { total: 0, count: 0 };
        }
        // Calculate score based on data completeness
        const completeness = [
          device.name, device.manufacturer, device.model, device.category,
          device.serialNumber, device.ipAddress, device.osVersion
        ].filter(Boolean).length / 7 * 100;
        acc[device.technician].total += completeness;
        acc[device.technician].count += 1;
      }
      return acc;
    }, {} as Record<string, { total: number; count: number }>);
    
    const avgTechnicianScore = Object.values(technicianScores).length > 0 
      ? Math.round(Object.values(technicianScores).reduce((sum, tech) => 
          sum + (tech.total / tech.count), 0) / Object.values(technicianScores).length)
      : 0;

    return {
      // Basic counts
      totalDevices,
      totalHospitals: uniqueHospitals,
      totalTechnicians: uniqueTechnicians,
      
      // Network analysis
      networkConnectedDevices,
      networkConnectedPercentage,
      offlineDevices: totalDevices - networkConnectedDevices,
      
      // PHI Risk Distribution
      phiDevices: phiDevices.length,
      phiRiskDistribution: {
        critical: criticalPHI,
        high: highPHI,
        medium: mediumPHI,
        low: lowPHI
      },
      
      // Security metrics
      criticalAlerts,
      legacyOSDevices,
      avgTechnicianScore,
      
      // Data quality
      dataCollectionScore: totalDevices > 0 ? Math.round((devices.filter(d => 
        d.name && d.manufacturer && d.model && d.category
      ).length / totalDevices) * 100) : 0
    };
  },
});

// Risk Assessment Queries
export const getRiskAssessmentData = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, { organizationId }) => {
    const devices = await ctx.db
      .query("medicalDevices")
      .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
      .collect();

    if (devices.length === 0) {
      return {
        hospitalRiskHeatmap: [],
        osRiskProfile: [],
        phiRiskOverview: { critical: 0, high: 0, medium: 0, low: 0 },
        deviceCategoryRisk: [],
        totalRiskScore: 0,
        riskTrends: []
      };
    }

    // Hospital Risk Heatmap Data
    const hospitalRiskMap = devices.reduce((acc, device) => {
      const hospital = device.entity || "Unknown";
      if (!acc[hospital]) {
        acc[hospital] = { critical: 0, high: 0, medium: 0, low: 0, total: 0 };
      }
      
      // Calculate device risk level
      let riskLevel = "low";
      const hasLegacyOS = device.osVersion?.toLowerCase().includes("xp") || 
                         device.osVersion?.toLowerCase().includes("2000") ||
                         device.osVersion?.toLowerCase().includes("vista");
      const hasCriticalPHI = device.hasPHI && device.customerPHICategory?.toLowerCase().includes("critical");
      const hasHighPHI = device.hasPHI && device.customerPHICategory?.toLowerCase().includes("high");
      const isNetworkExposed = device.deviceOnNetwork && device.hasPHI;
      
      if (hasLegacyOS || hasCriticalPHI || isNetworkExposed) {
        riskLevel = "critical";
      } else if (hasHighPHI || (device.deviceOnNetwork && !device.osVersion)) {
        riskLevel = "high";
      } else if (device.hasPHI || device.deviceOnNetwork) {
        riskLevel = "medium";
      }
      
      acc[hospital][riskLevel as keyof typeof acc[typeof hospital]]++;
      acc[hospital].total++;
      return acc;
    }, {} as Record<string, { critical: number; high: number; medium: number; low: number; total: number }>);

    const hospitalRiskHeatmap = Object.entries(hospitalRiskMap).map(([hospital, risks]) => ({
      hospital,
      critical: risks.critical,
      high: risks.high,
      medium: risks.medium,
      low: risks.low,
      total: risks.total,
      riskScore: Math.round(((risks.critical * 4 + risks.high * 3 + risks.medium * 2 + risks.low * 1) / risks.total) * 25)
    }));

    // OS Risk Profile
    const osRiskMap = devices.reduce((acc, device) => {
      const os = device.osVersion || "Unknown";
      const manufacturer = device.osManufacturer || "Unknown";
      const key = `${manufacturer} ${os}`;
      
      if (!acc[key]) {
        acc[key] = { 
          os: key, 
          count: 0, 
          isLegacy: false, 
          riskLevel: "low",
          vulnerabilities: 0
        };
      }
      
      acc[key].count++;
      
      // Check if legacy OS
      const osLower = os.toLowerCase();
      const isLegacy = osLower.includes("xp") || osLower.includes("2000") || 
                      osLower.includes("vista") || osLower.includes("windows 7") ||
                      osLower.includes("windows 8");
      
      if (isLegacy) {
        acc[key].isLegacy = true;
        acc[key].riskLevel = "critical";
        acc[key].vulnerabilities += 5; // High vulnerability count for legacy OS
      } else if (osLower.includes("windows 10") && !osLower.includes("ltsc")) {
        acc[key].riskLevel = "medium";
        acc[key].vulnerabilities += 2;
      } else if (osLower.includes("windows 11") || osLower.includes("ltsc")) {
        acc[key].riskLevel = "low";
        acc[key].vulnerabilities += 1;
      } else {
        acc[key].riskLevel = "medium";
        acc[key].vulnerabilities += 2;
      }
      
      return acc;
    }, {} as Record<string, { os: string; count: number; isLegacy: boolean; riskLevel: string; vulnerabilities: number }>);

    const osRiskProfile = Object.values(osRiskMap).sort((a, b) => {
      const riskOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return riskOrder[b.riskLevel as keyof typeof riskOrder] - riskOrder[a.riskLevel as keyof typeof riskOrder];
    });

    // PHI Risk Overview
    const phiRiskOverview = devices.reduce((acc, device) => {
      if (!device.hasPHI) return acc;
      
      const category = device.customerPHICategory?.toLowerCase() || "low";
      if (category.includes("critical")) {
        acc.critical++;
      } else if (category.includes("high")) {
        acc.high++;
      } else if (category.includes("medium")) {
        acc.medium++;
      } else {
        acc.low++;
      }
      return acc;
    }, { critical: 0, high: 0, medium: 0, low: 0 });

    // Device Category Risk Scoring
    const categoryRiskMap = devices.reduce((acc, device) => {
      const category = device.category || "Unknown";
      if (!acc[category]) {
        acc[category] = { 
          category, 
          count: 0, 
          riskScore: 0, 
          phiDevices: 0, 
          networkDevices: 0,
          legacyDevices: 0
        };
      }
      
      acc[category].count++;
      
      // Calculate risk factors
      let deviceRisk = 1; // Base risk
      
      if (device.hasPHI) {
        acc[category].phiDevices++;
        deviceRisk += 2;
      }
      
      if (device.deviceOnNetwork) {
        acc[category].networkDevices++;
        deviceRisk += 1;
      }
      
      const hasLegacyOS = device.osVersion?.toLowerCase().includes("xp") || 
                         device.osVersion?.toLowerCase().includes("2000");
      if (hasLegacyOS) {
        acc[category].legacyDevices++;
        deviceRisk += 3;
      }
      
      acc[category].riskScore += deviceRisk;
      return acc;
    }, {} as Record<string, { category: string; count: number; riskScore: number; phiDevices: number; networkDevices: number; legacyDevices: number }>);

    const deviceCategoryRisk = Object.values(categoryRiskMap).map(cat => ({
      ...cat,
      avgRiskScore: Math.round((cat.riskScore / cat.count) * 20), // Scale to 0-100
      phiPercentage: Math.round((cat.phiDevices / cat.count) * 100),
      networkPercentage: Math.round((cat.networkDevices / cat.count) * 100),
      legacyPercentage: Math.round((cat.legacyDevices / cat.count) * 100)
    })).sort((a, b) => b.avgRiskScore - a.avgRiskScore);

    // Calculate overall risk score
    const totalRiskScore = Math.round(
      deviceCategoryRisk.reduce((sum, cat) => sum + cat.avgRiskScore, 0) / deviceCategoryRisk.length
    );

    return {
      hospitalRiskHeatmap,
      osRiskProfile,
      phiRiskOverview,
      deviceCategoryRisk,
      totalRiskScore,
      riskTrends: [] // Placeholder for future trend analysis
    };
  },
});

export const getLegacyOSDevices = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, { organizationId }) => {
    const devices = await ctx.db
      .query("medicalDevices")
      .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
      .collect();

    return devices.filter(device => {
      const os = device.osVersion?.toLowerCase() || "";
      return os.includes("xp") || os.includes("2000") || os.includes("vista") ||
             os.includes("windows 7") || os.includes("windows 8");
    }).map(device => ({
      id: device._id,
      name: device.name,
      entity: device.entity,
      osVersion: device.osVersion,
      manufacturer: device.manufacturer,
      model: device.model,
      hasPHI: device.hasPHI,
      deviceOnNetwork: device.deviceOnNetwork,
      riskLevel: device.osVersion?.toLowerCase().includes("xp") || 
                device.osVersion?.toLowerCase().includes("2000") ? "critical" : "high"
    }));
  },
});

export const getHospitalRiskDetails = query({
  args: { organizationId: v.id("organizations"), hospital: v.string() },
  handler: async (ctx, { organizationId, hospital }) => {
    const devices = await ctx.db
      .query("medicalDevices")
      .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
      .collect();

    const list = devices.filter(d => (d.entity || "Unknown") === hospital);

    const items = list.map(d => {
      const osLower = (d.osVersion || "").toLowerCase();
      const phiCat = (d.customerPHICategory || "").toLowerCase();
      const hasLegacyOS = osLower.includes("xp") || osLower.includes("2000") || osLower.includes("vista") || osLower.includes("windows 7") || osLower.includes("windows 8");
      const hasCriticalPHI = !!d.hasPHI && phiCat.includes("critical");
      const hasHighPHI = !!d.hasPHI && phiCat.includes("high");
      const isNetworkExposed = !!d.deviceOnNetwork && !!d.hasPHI;

      let riskLevel: "low" | "medium" | "high" | "critical" = "low";
      if (hasLegacyOS || hasCriticalPHI || isNetworkExposed) {
        riskLevel = "critical";
      } else if (hasHighPHI || (d.deviceOnNetwork && !d.osVersion)) {
        riskLevel = "high";
      } else if (d.hasPHI || d.deviceOnNetwork) {
        riskLevel = "medium";
      }

      const reasons: string[] = [];
      if (hasLegacyOS) reasons.push("Legacy OS detected");
      if (hasCriticalPHI) reasons.push("PHI marked Critical");
      if (hasHighPHI && !hasCriticalPHI) reasons.push("PHI marked High");
      if (isNetworkExposed) reasons.push("PHI device on network");
      if (d.deviceOnNetwork && !d.hasPHI) reasons.push("Network exposure");
      if (!d.osVersion) reasons.push("Unknown OS version");

      const remediation: string[] = [];
      if (hasLegacyOS) {
        remediation.push("Plan upgrade to supported OS");
        remediation.push("Isolate device on segmented network");
      }
      if (isNetworkExposed) {
        remediation.push("Enable encryption for PHI");
        remediation.push("Apply access controls and auditing");
        remediation.push("Segment PHI devices from general network");
      }
      if (!d.osVersion) {
        remediation.push("Inventory OS and apply latest patches");
      }
      if (riskLevel === "high" && !isNetworkExposed) {
        remediation.push("Review PHI handling and minimize exposure");
      }

      return {
        id: d._id,
        name: d.name,
        entity: d.entity,
        manufacturer: d.manufacturer,
        model: d.model,
        osVersion: d.osVersion || "Unknown",
        hasPHI: !!d.hasPHI,
        deviceOnNetwork: !!d.deviceOnNetwork,
        riskLevel,
        reasons,
        remediation
      };
    });

    const summary = items.reduce((acc, it) => {
      acc[it.riskLevel] = (acc[it.riskLevel] || 0) + 1;
      return acc;
    }, { low: 0, medium: 0, high: 0, critical: 0 } as Record<"low"|"medium"|"high"|"critical", number>);

    return { hospital, items, summary };
  },
});

// Add this to your existing medicalDevices.ts file

export const getTechnicianMetrics = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, { organizationId }) => {
    const devices = await ctx.db
      .query("medicalDevices")
      .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
      .collect();

    // Group devices by technician
    const technicianGroups = devices.reduce((acc, device) => {
      const technicianName = device.technician || "Unassigned";
      if (!acc[technicianName]) {
        acc[technicianName] = [];
      }
      acc[technicianName].push(device);
      return acc;
    }, {} as Record<string, typeof devices>);

    return Object.entries(technicianGroups).map(([technicianName, technicianDevices]) => {
      const deviceCount = technicianDevices.length;
      const totalDevices = devices.length;
      
      const criticalPHIDevices = technicianDevices.filter(
        d => d.hasPHI && (d.customerPHICategory === "Critical" || d.customerPHICategory === "High")
      ).length;
      
      const supportedOSDevices = technicianDevices.filter(
        d => d.osVersion && !d.osVersion.toLowerCase().includes("unsupported")
      ).length;
      
      const networkConnectedDevices = technicianDevices.filter(
        d => d.deviceOnNetwork
      ).length;
      
      const validIPDevices = technicianDevices.filter(
        d => d.ipAddress && d.ipAddress !== "Unknown" && !d.ipAddress.includes("DHCP")
      ).length;
      
      const duplicateIPCount = technicianDevices.filter(
        d => d.ipAddress && devices.filter(other => other.ipAddress === d.ipAddress).length > 1
      ).length;
      
      const legacyOSCount = technicianDevices.filter(
        d => d.osVersion && (d.osVersion.toLowerCase().includes("unsupported") || 
             d.osVersion.toLowerCase().includes("legacy"))
      ).length;

      // Calculate rates (percentages) instead of raw counts
      const osComplianceRate = deviceCount > 0 ? (supportedOSDevices / deviceCount) * 100 : 0;
      const networkComplianceRate = deviceCount > 0 ? (networkConnectedDevices / deviceCount) * 100 : 0;
      const ipValidityRate = deviceCount > 0 ? (validIPDevices / deviceCount) * 100 : 0;
      const duplicateIPPenalty = deviceCount > 0 ? (duplicateIPCount / deviceCount) * 100 : 0;
      const criticalPHIScore = deviceCount > 0 ? (criticalPHIDevices / deviceCount) * 100 : 0;
      const legacyOSScore = deviceCount > 0 ? 100 - ((legacyOSCount / deviceCount) * 100) : 100;
      const resolutionScore = Math.max(0, 100 - (duplicateIPPenalty * 0.5)); // Example calculation

      return {
        technicianId: technicianName.replace(/\s+/g, '_').toLowerCase(),
        name: technicianName,
        deviceCount,
        totalDevices,
        criticalPHIDevices,
        supportedOSDevices,
        networkConnectedDevices,
        validIPDevices,
        duplicateIPCount,
        legacyOSCount,
        // Add the required rate properties
        osComplianceRate,
        networkComplianceRate,
        ipValidityRate,
        duplicateIPPenalty,
        criticalPHIScore,
        legacyOSScore,
        resolutionScore
      };
    });
  },
});
