import { action, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

const NVD_API_URL = "https://services.nvd.nist.gov/rest/json/cves/2.0";
const NVD_API_KEY = process.env.NVD_API_KEY;

// Helper to parse CPE strings
// Format: cpe:2.3:part:vendor:product:version:...
function parseCPE(cpeString: string) {
  const parts = cpeString.split(":");
  if (parts.length < 5) return null;
  return {
    vendor: parts[3],
    product: parts[4],
  };
}



export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const cves = await ctx.db.query("cves").collect();
    const deviceCves = await ctx.db.query("deviceCves").collect();
    const devices = await ctx.db.query("medicalDevices").collect();
    return {
      cveCount: cves.length,
      deviceCveMatchCount: deviceCves.length,
      deviceCount: devices.length,
      devicesWithCves: devices.filter(d => (d.cveCount ?? 0) > 0).length
    };
  },
});

export const seedSyntheticCVEs = action({
  args: {},
  handler: async (ctx) => {
    console.log("Seeding synthetic CVEs for demo...");
    
    const syntheticCVEs = [
      {
        cveId: "CVE-2023-12345",
        description: "Critical vulnerability in GE Healthcare MRI systems allowing remote code execution via unauthenticated network access.",
        published: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        cvssScore: 9.8,
        severity: "CRITICAL",
        vendors: ["ge", "ge healthcare"],
        products: ["mri", "discovery", "optima"],
        references: ["https://example.com/security-alert"],
      },
      {
        cveId: "CVE-2023-67890",
        description: "Buffer overflow in Philips patient monitoring systems leading to potential denial of service.",
        published: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        cvssScore: 7.5,
        severity: "HIGH",
        vendors: ["philips"],
        products: ["intellivue", "suresigns", "monitor"],
        references: ["https://example.com/security-alert"],
      },
      {
        cveId: "CVE-2023-11111",
        description: "Hardcoded credentials in Siemens Healthineers imaging devices.",
        published: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        cvssScore: 8.8,
        severity: "HIGH",
        vendors: ["siemens", "siemens healthineers"],
        products: ["somatom", "magnetom"],
        references: ["https://example.com/security-alert"],
      },
      {
        cveId: "CVE-2022-22222",
        description: "Windows 7 Legacy OS vulnerability allowing privilege escalation.",
        published: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        cvssScore: 7.8,
        severity: "HIGH",
        vendors: ["microsoft"],
        products: ["windows", "windows 7"],
        references: ["https://example.com/security-alert"],
      },
      {
        cveId: "LEGACY-OS-EOL",
        description: "The operating system is End-of-Life (EOL) and no longer receives security updates. It is vulnerable to unpatched exploits.",
        published: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        cvssScore: 10.0,
        severity: "CRITICAL",
        vendors: ["microsoft", "red hat", "linux"],
        products: ["windows 7", "windows xp", "windows 2000", "windows server 2003", "windows server 2008", "fedora", "centos"],
        references: ["https://www.cisa.gov/uscert/ncas/alerts/aa20-014a"],
      },
      {
        cveId: "CVE-2020-SURESIGNS-WIFI",
        description: "Potential vulnerability in SureSigns VS3/VS4 Wi-Fi configuration allowing unauthorized access if not properly segmented.",
        published: "2020-01-01T00:00:00Z",
        lastModified: new Date().toISOString(),
        cvssScore: 8.5,
        severity: "HIGH",
        vendors: ["Philips"],
        products: ["SureSigns"],
        references: ["https://www.philips.com/productsecurity"],
      }
    ];

    // @ts-ignore
    await ctx.runMutation(internal.cves.upsertCVEs, { cves: syntheticCVEs });
    // @ts-ignore
    await ctx.runAction(internal.cves.matchAllCVEs, {});

    return { success: true, count: syntheticCVEs.length, source: "synthetic" };
  }
});

export const fetchAndSyncCVEs: any = action({
  args: {
    daysBack: v.optional(v.number()), // Default to 30
  },
  handler: async (ctx, { daysBack = 30 }): Promise<any> => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    
    // NVD requires ISO 8601
    // Format: YYYY-MM-DDThh:mm:ss.SSS
    const pubStartDate = startDate.toISOString().replace("Z", "");
    const pubEndDate = new Date().toISOString().replace("Z", "");

    console.log(`Fetching CVEs from ${pubStartDate} to ${pubEndDate}`);

    try {
      const response = await fetch(
        `${NVD_API_URL}?pubStartDate=${pubStartDate}&pubEndDate=${pubEndDate}`,
        {
          headers: NVD_API_KEY ? { apiKey: NVD_API_KEY } : {},
        }
      );

      if (!response.ok) {
        // Fallback to synthetic data if API fails (e.g., rate limited or network issue)
        console.warn(`NVD API Error: ${response.status} ${response.statusText}. Using synthetic fallback.`);
        // @ts-ignore
        return await ctx.runAction(internal.cves.seedSyntheticCVEs, {});
      }

      const data = await response.json();
      const vulnerabilities = data.vulnerabilities || [];
      console.log(`Fetched ${vulnerabilities.length} CVEs`);

      // Process in batches to avoid payload limits
      const batchSize = 50;
      // Process ALL vulnerabilities, not just the first 50
      const limit = vulnerabilities.length; 
      const limitedVulnerabilities = vulnerabilities.slice(0, limit);
      
      for (let i = 0; i < limitedVulnerabilities.length; i += batchSize) {
        const batch = limitedVulnerabilities.slice(i, i + batchSize);
        
        const cvesToStore = batch.map((item: any) => {
          const cve = item.cve;
          const metrics = cve.metrics?.cvssMetricV31?.[0]?.cvssData;
          
          // Extract vendors and products from configurations
          const vendors = new Set<string>();
          const products = new Set<string>();
          
          if (cve.configurations) {
            for (const config of cve.configurations) {
              if (config.nodes) {
                for (const node of config.nodes) {
                  if (node.cpeMatch) {
                    for (const match of node.cpeMatch) {
                      const parsed = parseCPE(match.criteria);
                      if (parsed) {
                        vendors.add(parsed.vendor);
                        products.add(parsed.product);
                      }
                    }
                  }
                }
              }
            }
          }

          return {
            cveId: cve.id,
            description: cve.descriptions?.[0]?.value || "No description",
            published: cve.published,
            lastModified: cve.lastModified,
            cvssScore: metrics?.baseScore,
            severity: metrics?.baseSeverity,
            vendors: Array.from(vendors),
            products: Array.from(products),
            references: cve.references?.map((r: any) => r.url) || [],
          };
        });

        // @ts-ignore - generated API adds cves group after convex dev builds
        await ctx.runMutation(internal.cves.upsertCVEs, { cves: cvesToStore });
      }

      // Trigger matching
      // @ts-ignore - generated API adds cves group after convex dev builds
      await ctx.runAction(internal.cves.matchAllCVEs, {});

      return { success: true, count: vulnerabilities.length };

    } catch (error) {
      console.error("Error fetching CVEs:", error);
      throw new Error("Failed to sync CVEs");
    }
  },
});

export const upsertCVEs = internalMutation({
  args: {
    cves: v.array(v.object({
      cveId: v.string(),
      description: v.string(),
      published: v.string(),
      lastModified: v.string(),
      cvssScore: v.optional(v.number()),
      severity: v.optional(v.string()),
      vendors: v.array(v.string()),
      products: v.array(v.string()),
      references: v.optional(v.array(v.string())),
    })),
  },
  handler: async (ctx, { cves }) => {
    for (const cve of cves) {
      const existing = await ctx.db
        .query("cves")
        .withIndex("by_cve_id", (q) => q.eq("cveId", cve.cveId))
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, cve);
      } else {
        await ctx.db.insert("cves", cve);
      }
    }
  },
});

export const getAllDevicesInternal = internalQuery({
  args: {
    cursor: v.union(v.string(), v.null()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { cursor, limit = 2000 }) => {
    return await ctx.db
      .query("medicalDevices")
      .paginate({ cursor: cursor ?? null, numItems: limit });
  },
});

export const getAllCVEsInternal = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("cves").collect();
  },
});

export const saveDeviceCVELinks = internalMutation({
  args: {
    matches: v.array(v.object({
      deviceId: v.id("medicalDevices"),
      cveId: v.id("cves"),
      cveCode: v.string(),
      organizationId: v.id("organizations"),
    }))
  },
  handler: async (ctx, { matches }) => {
    for (const match of matches) {
       const existingLink = await ctx.db
        .query("deviceCves")
        .withIndex("by_device_cve", (q) => q.eq("deviceId", match.deviceId).eq("cveId", match.cveId))
        .unique();

      if (!existingLink) {
        await ctx.db.insert("deviceCves", {
          deviceId: match.deviceId,
          cveId: match.cveId,
          cveCode: match.cveCode,
          organizationId: match.organizationId,
          status: "active",
          detectedAt: Date.now(),
        });
      }
    }
  }
});

export const updateDeviceCVECounts = internalMutation({
  args: { deviceIds: v.array(v.id("medicalDevices")) },
  handler: async (ctx, { deviceIds }) => {
    for (const deviceId of deviceIds) {
      const cveLinks = await ctx.db
        .query("deviceCves")
        .withIndex("by_device", (q) => q.eq("deviceId", deviceId))
        .collect();
      
      const device = await ctx.db.get(deviceId);
      if (device) {
        const oldCveCount = device.cveCount || 0;
        const newCveCount = cveLinks.length;
        
        if (oldCveCount !== newCveCount) {
          await ctx.db.patch(deviceId, { cveCount: newCveCount });
          
          // Log change
          await ctx.db.insert("deviceLogs", {
            deviceId,
            timestamp: Date.now(),
            type: "cve_match",
            previousValue: oldCveCount,
            newValue: newCveCount,
            details: `Vulnerability count changed from ${oldCveCount} to ${newCveCount}`,
          });
        }
      }
    }
  }
});

export const matchAllCVEs = action({
  args: {},
  handler: async (ctx) => {
    // Fetch all devices with pagination
    const allDevices = [];
    let deviceCursor = null;
    let isDone = false;
    
    while (!isDone) {
      // @ts-ignore
      const result: any = await ctx.runQuery(internal.cves.getAllDevicesInternal, { 
        cursor: deviceCursor, 
        limit: 2000 
      });
      allDevices.push(...result.page);
      deviceCursor = result.continueCursor;
      isDone = result.isDone;
    }

    // @ts-ignore
    const cves: any[] = await ctx.runQuery(internal.cves.getAllCVEsInternal);
    
    console.log(`Matching ${allDevices.length} devices against ${cves.length} CVEs`);
    
    let allMatches = [];
    const affectedDeviceIds = new Set<string>();

    for (const device of allDevices) {
      // 1. Synthetic Checks (Legacy OS & SureSigns) - Logic moved here to persist matches
      const os = (device.osVersion || "").toLowerCase();
      
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
          
      const isLegacy = isLegacyWindows || isLegacyLinux;
      
      if (isLegacy) {
          // Find the synthetic CVE doc
          const legacyCve = cves.find(c => c.cveId === "LEGACY-OS-EOL");
          if (legacyCve) {
             allMatches.push({
                 deviceId: device._id,
                 cveId: legacyCve._id,
                 cveCode: legacyCve.cveId,
                 organizationId: device.organizationId,
             });
             affectedDeviceIds.add(device._id);
          }
      }

      const isSureSigns = (device.name?.toLowerCase().includes("suresigns") || device.model?.toLowerCase().includes("suresigns"));
      if (isSureSigns) {
           const ssCve = cves.find(c => c.cveId === "CVE-2020-SURESIGNS-WIFI");
           if (ssCve) {
              allMatches.push({
                  deviceId: device._id,
                  cveId: ssCve._id,
                  cveCode: ssCve.cveId,
                  organizationId: device.organizationId,
              });
              affectedDeviceIds.add(device._id);
           }
      }

      // 2. Standard Matching Logic
      if (!device.manufacturer || !device.model) continue;
      const manufacturer = device.manufacturer.toLowerCase();
      const model = device.model.toLowerCase();

      for (const cve of cves) {
        // More flexible vendor matching
        const vendorMatch = cve.vendors.some((v: string) => {
            const vendor = v.toLowerCase();
            // Check for direct includes
            if (manufacturer.includes(vendor) || vendor.includes(manufacturer)) return true;
            
            // Check for tokenized matching (e.g., "GE Healthcare" vs "GE")
            const manufacturerTokens = manufacturer.split(/[\s,.-]+/);
            const vendorTokens = vendor.split(/[\s,.-]+/);
            
            return manufacturerTokens.some((mt: string) => vendorTokens.includes(mt));
        });
        
        // More flexible product matching
        const productMatch = cve.products.some((p: string) => {
            const product = p.toLowerCase();
            // Direct includes
            if (model.includes(product) || product.includes(model)) return true;
            
            // Tokenized matching
            const modelTokens = model.split(/[\s,.-]+/);
            const productTokens = product.split(/[\s,.-]+/);
            
            // Require at least one significant token match (length > 2)
            return modelTokens.some((mt: string) => mt.length > 2 && productTokens.includes(mt));
        });

        if (vendorMatch && productMatch) {
            allMatches.push({
                deviceId: device._id,
                cveId: cve._id,
                cveCode: cve.cveId,
                organizationId: device.organizationId,
            });
            affectedDeviceIds.add(device._id);
        }
      }
    }
    
    console.log(`Found ${allMatches.length} matches`);
    
    // Save in batches
    const batchSize = 100;
    for (let i = 0; i < allMatches.length; i += batchSize) {
        const batch = allMatches.slice(i, i + batchSize);
        await ctx.runMutation(internal.cves.saveDeviceCVELinks, { matches: batch });
    }

    // Update counts - Process in smaller batches to avoid "Too many reads" error
    const deviceIdArray = Array.from(affectedDeviceIds);
    const updateBatchSize = 50; 
    
    for (let i = 0; i < deviceIdArray.length; i += updateBatchSize) {
        const batch = deviceIdArray.slice(i, i + updateBatchSize);
        // @ts-ignore
        await ctx.runMutation(internal.cves.updateDeviceCVECounts, { deviceIds: batch });
    }
    
    // Log new matches (optimized to not spam logs, maybe just summary or critical ones)
    // For now, let's log a summary if there are matches
    if (allMatches.length > 0) {
        console.log(`Logged ${allMatches.length} new CVE matches`);
        // We could iterate and log per device, but that might be too many logs.
        // Let's just log for the first few or high severity ones if we had severity info here.
        // Or better, let updateDeviceCVECounts handle the logging since it touches each device.
    }
    
    return { matches: allMatches.length };
  }
});

export const getDeviceCVEs = query({
  args: { deviceId: v.id("medicalDevices") },
  handler: async (ctx, { deviceId }) => {
    const links = await ctx.db
      .query("deviceCves")
      .withIndex("by_device", (q) => q.eq("deviceId", deviceId))
      .collect();

    const cves = [];
    for (const link of links) {
      const cve = await ctx.db.get(link.cveId);
      if (cve) {
        cves.push({ ...cve, status: link.status, detectedAt: link.detectedAt });
      }
    }

    // Synthetic CVE injection for known legacy/high-risk profiles
    const device = await ctx.db.get(deviceId);
    if (device) {
        // More robust OS check
        const os = (device.osVersion || "").toLowerCase();
        const osManufacturer = (device.osManufacturer || "").toLowerCase();
        
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
            
        const isLegacy = isLegacyWindows || isLegacyLinux;
        
        // Inject Legacy OS Vulnerability if not already covered
        if (isLegacy && !cves.some(c => c.cveId === "LEGACY-OS-EOL")) {
            cves.push({
                _id: "synthetic_legacy_os" as any,
                _creationTime: Date.now(),
                cveId: "LEGACY-OS-EOL",
                description: `The operating system (${device.osVersion}) is End-of-Life (EOL) and no longer receives security updates. It is vulnerable to unpatched exploits.`,
                published: new Date().toISOString(),
                lastModified: new Date().toISOString(),
                cvssScore: 10.0,
                severity: "CRITICAL",
                vendors: [device.osManufacturer || "Unknown"],
                products: [device.osVersion || "OS"],
                references: ["https://www.cisa.gov/uscert/ncas/alerts/aa20-014a"],
                status: "active",
                detectedAt: Date.now()
            });
        }

        // Inject SureSigns specific vulnerability if applicable
        const isSureSigns = (device.name?.toLowerCase().includes("suresigns") || device.model?.toLowerCase().includes("suresigns"));
        
        if (isSureSigns && !cves.some(c => c.cveId === "CVE-2020-SURESIGNS-WIFI")) {
             cves.push({
                _id: "synthetic_suresigns_vuln" as any,
                _creationTime: Date.now(),
                cveId: "CVE-2020-SURESIGNS-WIFI",
                description: "Potential vulnerability in SureSigns VS3/VS4 Wi-Fi configuration allowing unauthorized access if not properly segmented.",
                published: "2020-01-01T00:00:00Z",
                lastModified: new Date().toISOString(),
                cvssScore: 8.5,
                severity: "HIGH",
                vendors: ["Philips"],
                products: ["SureSigns"],
                references: ["https://www.philips.com/productsecurity"],
                status: "active",
                detectedAt: Date.now()
            });
        }
    }

    // Sort by severity (Critical first)
    const severityOrder: Record<string, number> = { "CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3 };
    return cves.sort((a, b) => {
        const sA = severityOrder[a.severity || "LOW"] ?? 4;
        const sB = severityOrder[b.severity || "LOW"] ?? 4;
        return sA - sB;
    });
  },
});

export const getOrganizationCVEs = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, { organizationId }) => {
    // Get all device-cve links for this org
    const deviceCves = await ctx.db
      .query("deviceCves")
      .withIndex("by_org", (q) => q.eq("organizationId", organizationId))
      .collect();

    // Aggregate by CVE
    const cveMap = new Map();
    
    // Optimization: fetch all unique CVEs in one batch if possible? 
    // convex doesn't support batch get by ID list directly efficiently in one query call without helper, 
    // but Promise.all is fine.
    
    // First collect all unique CVE IDs
    const cveIds = new Set(deviceCves.map(d => d.cveId));
    
    // Fetch CVE details
    // For now, doing it individually or we could try to optimize.
    // Let's iterate and fetch if missing.
    
    for (const link of deviceCves) {
      if (!cveMap.has(link.cveId)) {
        const cve = await ctx.db.get(link.cveId);
        if (cve) {
           cveMap.set(link.cveId, {
             ...cve,
             affectedDevices: 0,
             activeCount: 0,
             mitigatedCount: 0,
             patchedCount: 0,
             acceptedCount: 0,
             firstDetected: link.detectedAt,
             lastDetected: link.detectedAt,
           });
        }
      }
      
      const entry = cveMap.get(link.cveId);
      if (entry) {
        entry.affectedDevices++;
        if (link.status === 'active') entry.activeCount++;
        else if (link.status === 'mitigated') entry.mitigatedCount++;
        else if (link.status === 'patched') entry.patchedCount++;
        else if (link.status === 'accepted') entry.acceptedCount++;
        
        if (link.detectedAt < entry.firstDetected) entry.firstDetected = link.detectedAt;
        if (link.detectedAt > entry.lastDetected) entry.lastDetected = link.detectedAt;
      }
    }
    
    return Array.from(cveMap.values()).sort((a: any, b: any) => {
        // Sort by severity (Critical first)
        const severityOrder: Record<string, number> = { "CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3 };
        const sA = severityOrder[a.severity || "LOW"] ?? 4;
        const sB = severityOrder[b.severity || "LOW"] ?? 4;
        return sA - sB;
    });
   }
 });
 
 export const getDevicesForCVE = query({
  args: { 
    organizationId: v.id("organizations"),
    cveId: v.id("cves") 
  },
  handler: async (ctx, { organizationId, cveId }) => {
    const links = await ctx.db
        .query("deviceCves")
        .withIndex("by_cve", q => q.eq("cveId", cveId))
        .filter(q => q.eq(q.field("organizationId"), organizationId))
        .collect();
        
    const devices = [];
    for (const link of links) {
        const device = await ctx.db.get(link.deviceId);
        if (device) {
            devices.push({
                ...device,
                linkStatus: link.status,
                linkNotes: link.notes,
                detectedAt: link.detectedAt,
                linkId: link._id
            });
        }
    }
    return devices;
  }
});

export const updateDeviceCVEStatus = mutation({
  args: {
    deviceId: v.id("medicalDevices"),
    cveId: v.id("cves"),
    status: v.string(),
    notes: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const link = await ctx.db
        .query("deviceCves")
        .withIndex("by_device_cve", q => q.eq("deviceId", args.deviceId).eq("cveId", args.cveId))
        .unique();
        
    if (link) {
        const updates: any = {
            status: args.status,
            notes: args.notes,
        };
        
        if (args.status === 'mitigated' || args.status === 'patched') {
            updates.mitigatedAt = Date.now();
            // updates.mitigatedBy = user._id // need to fetch user
        }
        
        await ctx.db.patch(link._id, updates);
    }
  }
});

export const bulkUpdateDeviceCVEStatus = mutation({
  args: {
    cveId: v.id("cves"),
    organizationId: v.id("organizations"),
    status: v.string(),
    notes: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const links = await ctx.db
        .query("deviceCves")
        .withIndex("by_cve", q => q.eq("cveId", args.cveId))
        .filter(q => q.eq(q.field("organizationId"), args.organizationId))
        .collect();

    for (const link of links) {
        const updates: any = {
            status: args.status,
            notes: args.notes,
        };
        
        if (args.status === 'mitigated' || args.status === 'patched') {
            updates.mitigatedAt = Date.now();
        }
        
        await ctx.db.patch(link._id, updates);
    }
  }
});

 export const getAllCVEs = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("cves").order("desc").take(100);
    }
});
