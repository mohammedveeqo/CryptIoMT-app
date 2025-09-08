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
      // Mock completion rate based on device data completeness
      const completeness = [device.name, device.manufacturer, device.model, device.category, device.osManufacturer].filter(Boolean).length;
      acc[technician].completedAssessments += completeness >= 4 ? 1 : 0;
      return acc;
    }, {} as Record<string, any>);

    // Calculate average scores
    Object.values(technicianStats).forEach((tech: any) => {
      tech.avgScore = tech.totalDevices > 0 ? Math.round((tech.completedAssessments / tech.totalDevices) * 100) : 0;
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
      
      // Determine criticality based on PHI category and device characteristics
      const phiCategory = device.customerPHICategory?.toLowerCase() || "";
      const hasPHI = device.hasPHI;
      const isNetworked = device.deviceOnNetwork;
      
      if (phiCategory.includes("critical") || (hasPHI && isNetworked)) {
        acc[hospital].critical++;
      } else if (phiCategory.includes("high") || hasPHI) {
        acc[hospital].high++;
      } else if (phiCategory.includes("medium")) {
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
    const criticalAlerts = devices.filter(d => 
      d.customerPHICategory?.toLowerCase().includes("critical") || 
      (d.hasPHI && d.deviceOnNetwork)
    ).length;
    const phiDevices = devices.filter(d => d.hasPHI).length;
    const onlineDevices = devices.filter(d => d.deviceOnNetwork).length;

    return {
      totalDevices,
      criticalAlerts,
      phiDevices,
      onlineDevices,
      offlineDevices: totalDevices - onlineDevices,
      dataCollectionScore: totalDevices > 0 ? Math.round((devices.filter(d => 
        d.name && d.manufacturer && d.model && d.category
      ).length / totalDevices) * 100) : 0
    };
  },
});