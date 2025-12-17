import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getDevice = query({
  args: { id: v.id("medicalDevices") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

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
      
      const previousStatus = dev.status || "active";
      if (previousStatus !== status) {
        await ctx.db.patch(id, { status, updatedAt: Date.now() });
        
        // Log status change
        await ctx.db.insert("deviceLogs", {
          deviceId: id,
          timestamp: Date.now(),
          type: "status_change",
          previousValue: previousStatus,
          newValue: status,
          userId: user.name || identity.name || identity.email || "Unknown User",
          details: `Status changed from ${previousStatus} to ${status}`
        });
        
        updated++;
      }
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
    const vulnerableDevices = devices.filter(d => (d.cveCount || 0) > 0).length;

    const legacyOSDevices = devices.filter(d => {
      const os = (d.osVersion || "").toLowerCase();
      const isLegacyWindows = 
          os.includes("xp") || 
          os.includes("2000") || 
          os.includes("vista") || 
          os.includes("windows 7") || 
          os.includes("windows 8") ||
          os.includes("server 2003") || 
          os.includes("server 2008");

      const isLegacyLinux = 
          (os.includes("fedora") && parseInt(os.split("fedora")[1] || "99") < 30) ||
          (os.includes("centos") && parseInt(os.split("centos")[1] || "99") < 8) ||
          (os.includes("red hat") && parseInt(os.split("red hat")[1] || "99") < 8);
          
      return isLegacyWindows || isLegacyLinux;
    }).length;

    // Calculate percentages for changes (mock data for now)
    return {
      totalDevices,
      onlineDevices,
      devicesWithPHI,
      criticalDevices,
      vulnerableDevices,
      legacyOSDevices,
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
      const isSureSigns = device.name?.toLowerCase().includes("suresigns") || 
                          device.model?.toLowerCase().includes("suresigns");
      
      // More robust classification
      if (phiCategory.includes("critical") || 
          category.includes("life support") || 
          category.includes("ventilator") ||
          category.includes("defibrillator")) {
        acc[hospital].critical++;
      } else if (phiCategory.includes("high") || 
                 hasPHI || 
                 category.includes("monitor") ||
                 category.includes("imaging") ||
                 (isSureSigns && isNetworked)) {
        acc[hospital].high++;
      } else if (phiCategory.includes("medium") ||
                 category.includes("diagnostic") ||
                 isSureSigns) {
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

export const updateDeviceTags = mutation({
  args: {
    deviceId: v.id("medicalDevices"),
    tags: v.array(v.string())
  },
  handler: async (ctx, { deviceId, tags }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const device = await ctx.db.get(deviceId);
    if (!device) throw new Error("Device not found");

    const oldTags = device.tags || [];
    
    // Only update if changed
    if (JSON.stringify(oldTags.sort()) !== JSON.stringify(tags.sort())) {
      await ctx.db.patch(deviceId, { tags });
      
      // Log change
      await ctx.db.insert("deviceLogs", {
        deviceId,
        timestamp: Date.now(),
        type: "manual_update",
        previousValue: oldTags,
        newValue: tags,
        userId: identity.name || identity.email || "Unknown User",
        details: `Tags updated: ${tags.join(", ")}`
      });
    }
  }
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
             os.includes("windows 7") || os.includes("windows 8") ||
             os.includes("server 2003") || os.includes("server 2008") ||
             os.includes("fedora") || os.includes("red hat") || os.includes("centos");
    }).length;
    
    // Critical alerts calculation
    const criticalAlerts = devices.filter(d => 
      d.customerPHICategory?.toLowerCase().includes("critical") || 
      (d.hasPHI && d.deviceOnNetwork) ||
      (d.osVersion?.toLowerCase().includes("xp") || d.osVersion?.toLowerCase().includes("2000") || 
       d.osVersion?.toLowerCase().includes("fedora") || d.osVersion?.toLowerCase().includes("red hat")) ||
      ((d.name?.toLowerCase().includes("suresigns") || d.model?.toLowerCase().includes("suresigns")) && d.deviceOnNetwork)
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
                         device.osVersion?.toLowerCase().includes("vista") ||
                         device.osVersion?.toLowerCase().includes("fedora") ||
                         device.osVersion?.toLowerCase().includes("red hat") ||
                         device.osVersion?.toLowerCase().includes("centos");
      const hasCriticalPHI = device.hasPHI && device.customerPHICategory?.toLowerCase().includes("critical");
      const hasHighPHI = device.hasPHI && device.customerPHICategory?.toLowerCase().includes("high");
      const isNetworkExposed = device.deviceOnNetwork && device.hasPHI;
      // Force CVE count check if undefined, and ensure SureSigns gets flagged if it matches known vulnerabilities
      const cveCount = (device as any).cveCount || 0;
      const hasCVEs = cveCount > 0;
      
      // Special check for SureSigns devices to ensure they are caught if they have known issues
      // This is a temporary fix until we have full CVE mapping for all devices
      const isSureSigns = device.name?.toLowerCase().includes("suresigns") || 
                          device.model?.toLowerCase().includes("suresigns");
                          
      if (hasCriticalPHI || hasLegacyOS) {
        riskLevel = "critical";
        acc[hospital].critical++;
      } else if (hasHighPHI || isNetworkExposed || hasCVEs || (isSureSigns && device.deviceOnNetwork)) {
        // Elevate SureSigns on network to High risk if not already Critical
        riskLevel = "high";
        acc[hospital].high++;
      } else if (device.hasPHI || isSureSigns) {
        // Elevate SureSigns to Medium if not networked
        riskLevel = "medium";
        acc[hospital].medium++;
      } else {
        acc[hospital].low++;
      }
      
      acc[hospital].total++;
      return acc;
    }, {} as Record<string, any>);
    
    // OS Risk Profile
    const osRiskProfile = devices.reduce((acc, device) => {
      const os = device.osVersion || device.osManufacturer || "Unknown";
      if (!acc[os]) {
        acc[os] = { 
          count: 0, 
          riskScore: 0, 
          isLegacy: false,
          vulnerabilities: 0 
        };
      }
      
      const isLegacy = os.toLowerCase().includes("xp") || 
                       os.toLowerCase().includes("2000") || 
                       os.toLowerCase().includes("windows 7") || 
                       os.toLowerCase().includes("server 2003") ||
                       os.toLowerCase().includes("fedora") ||
                       os.toLowerCase().includes("red hat") ||
                       os.toLowerCase().includes("centos");
      
      // Simple risk scoring
      let risk = 10; // Base risk
      if (isLegacy) risk += 50;
      if (device.deviceOnNetwork) risk += 10;
      if (device.hasPHI) risk += 20;
      
      acc[os].count++;
      acc[os].riskScore += risk;
      if (isLegacy) acc[os].isLegacy = true;
      acc[os].vulnerabilities += (device as any).cveCount || 0;
      
      return acc;
    }, {} as Record<string, any>);

    return {
      hospitalRiskHeatmap: Object.entries(hospitalRiskMap).map(([name, stats]: [string, any]) => ({
        name,
        ...stats,
        riskScore: Math.round((stats.critical * 100 + stats.high * 70 + stats.medium * 40 + stats.low * 10) / stats.total)
      })).sort((a, b) => b.riskScore - a.riskScore),
      
      osRiskProfile: Object.entries(osRiskProfile).map(([os, stats]: [string, any]) => {
        const avgRisk = stats.riskScore / stats.count;
        let riskLevel = "low";
        if (avgRisk > 70) riskLevel = "critical";
        else if (avgRisk > 50) riskLevel = "high";
        else if (avgRisk > 30) riskLevel = "medium";
        
        return {
          os,
          count: stats.count,
          isLegacy: stats.isLegacy,
          riskLevel,
          vulnerabilities: stats.vulnerabilities
        };
      }).sort((a, b) => {
        const riskOrder = { critical: 3, high: 2, medium: 1, low: 0 };
        return (riskOrder[b.riskLevel as keyof typeof riskOrder] || 0) - (riskOrder[a.riskLevel as keyof typeof riskOrder] || 0);
      }).slice(0, 8),
      
      // ... other data
      totalRiskScore: 0, // Placeholder
      riskTrends: [] // Placeholder
    };
  }
});

// Get legacy OS devices
export const getLegacyOSDevices = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, { organizationId }) => {
    const devices = await ctx.db
      .query("medicalDevices")
      .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
      .collect();

    return devices
      .filter(d => {
        const os = d.osVersion?.toLowerCase() || "";
        return os.includes("xp") || os.includes("2000") || os.includes("vista") || 
               os.includes("windows 7") || os.includes("windows 8") ||
               os.includes("server 2003") || os.includes("server 2008");
      })
      .map(d => {
        let riskLevel = "low";
        const hasCriticalPHI = d.hasPHI && d.customerPHICategory?.toLowerCase().includes("critical");
        const hasHighPHI = d.hasPHI && d.customerPHICategory?.toLowerCase().includes("high");
        const isNetworkExposed = d.deviceOnNetwork && d.hasPHI;
        const hasCVEs = (d as any).cveCount && (d as any).cveCount > 0;
        
        // Legacy OS is inherently high risk, critical if networked or PHI
        if (hasCriticalPHI || (d.deviceOnNetwork && d.hasPHI)) {
           riskLevel = "critical";
        } else if (hasHighPHI || d.deviceOnNetwork || hasCVEs) {
           riskLevel = "high";
        } else if (d.hasPHI) {
           riskLevel = "medium";
        }
        
        return { ...d, riskLevel };
      });
  },
});

// Get technician metrics for staff performance
export const getTechnicianMetrics = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, { organizationId }) => {
    const devices = await ctx.db
      .query("medicalDevices")
      .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
      .collect();

    const technicianStats = devices.reduce((acc, device) => {
      const technicianId = device.technician || "unassigned";
      const technicianName = device.technician || "Unassigned";

      if (!acc[technicianId]) {
        acc[technicianId] = {
          technicianId,
          name: technicianName,
          deviceCount: 0,
          totalDevices: devices.length,
          criticalPHIDevices: 0,
          supportedOSDevices: 0,
          networkConnectedDevices: 0,
          validIPDevices: 0,
          duplicateIPCount: 0,
          legacyOSCount: 0,
          // Raw counts for rate calculation
          osComplianceCount: 0,
          networkComplianceCount: 0,
          ipValidityCount: 0,
          criticalPHIScoreTotal: 0,
          legacyOSScoreTotal: 0,
          resolutionScoreTotal: 0,
        };
      }

      const stats = acc[technicianId];
      stats.deviceCount++;

      // Check for legacy OS
      const os = device.osVersion?.toLowerCase() || "";
      const isLegacy = os.includes("xp") || os.includes("2000") || os.includes("vista") || 
                       os.includes("windows 7") || os.includes("windows 8") ||
                       os.includes("server 2003") || os.includes("server 2008");
      
      if (isLegacy) stats.legacyOSCount++;
      else stats.supportedOSDevices++; // Assuming non-legacy is supported for simplicity

      // Check for PHI
      const hasCriticalPHI = device.hasPHI && device.customerPHICategory?.toLowerCase().includes("critical");
      if (hasCriticalPHI) stats.criticalPHIDevices++;

      // Network
      if (device.deviceOnNetwork) stats.networkConnectedDevices++;

      // IP Validity (simple check)
      if (device.ipAddress && device.ipAddress.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)) {
        stats.validIPDevices++;
      }

      // Calculate scores for this device
      stats.osComplianceCount += isLegacy ? 0 : 1;
      stats.networkComplianceCount += (device.deviceOnNetwork && !device.hasPHI) ? 1 : (device.deviceOnNetwork && device.hasPHI ? 0.5 : 1); // Penalize networked PHI
      stats.ipValidityCount += (device.ipAddress && device.ipAddress !== "0.0.0.0") ? 1 : 0;
      
      // Risk scores (inverse of risk)
      stats.criticalPHIScoreTotal += hasCriticalPHI ? 0 : 1;
      stats.legacyOSScoreTotal += isLegacy ? 0 : 1;
      stats.resolutionScoreTotal += 1; // Placeholder as we don't have resolution time yet

      return acc;
    }, {} as Record<string, any>);

    // Calculate rates and return array
    return Object.values(technicianStats).map((stats: any) => {
      const count = stats.deviceCount || 1;
      
      return {
        technicianId: stats.technicianId,
        name: stats.name,
        deviceCount: stats.deviceCount,
        totalDevices: stats.totalDevices,
        criticalPHIDevices: stats.criticalPHIDevices,
        supportedOSDevices: stats.supportedOSDevices,
        networkConnectedDevices: stats.networkConnectedDevices,
        validIPDevices: stats.validIPDevices,
        duplicateIPCount: 0, // Placeholder, needs global check
        legacyOSCount: stats.legacyOSCount,
        alertsAssigned: 0,
        alertsResolved: 0,
        avgResolutionTime: 0,
        
        // Calculated rates (0-1)
        osComplianceRate: stats.osComplianceCount / count,
        networkComplianceRate: stats.networkComplianceCount / count,
        ipValidityRate: stats.ipValidityCount / count,
        duplicateIPPenalty: 0,
        criticalPHIScore: stats.criticalPHIScoreTotal / count,
        legacyOSScore: stats.legacyOSScoreTotal / count,
        resolutionScore: 1 // Default to perfect until we have real data
      };
    });
  },
});
