import { action, internalMutation, mutation, query } from "./_generated/server";
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

export const fetchAndSyncCVEs = action({
  args: {
    daysBack: v.optional(v.number()), // Default to 30
  },
  handler: async (ctx, { daysBack = 30 }) => {
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
        throw new Error(`NVD API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const vulnerabilities = data.vulnerabilities || [];
      console.log(`Fetched ${vulnerabilities.length} CVEs`);

      // Process in batches to avoid payload limits
      const batchSize = 50;
      for (let i = 0; i < vulnerabilities.length; i += batchSize) {
        const batch = vulnerabilities.slice(i, i + batchSize);
        
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
      await ctx.runMutation(internal.cves.matchCVEsToDevices, {});

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

export const matchCVEsToDevices = internalMutation({
  args: {},
  handler: async (ctx) => {
    const devices = await ctx.db.query("medicalDevices").collect();
    // In a production environment, this should be optimized to not fetch all CVEs
    // But for the initial sync/implementation, we will check against all stored CVEs
    const cves = await ctx.db.query("cves").collect(); 
    
    let matchCount = 0;

    for (const device of devices) {
      if (!device.manufacturer || !device.model) continue;

      const manufacturer = device.manufacturer.toLowerCase();
      const model = device.model.toLowerCase();

      for (const cve of cves) {
        // Check match
        // Vendor match: Check if device manufacturer contains cve vendor or vice versa
        const vendorMatch = cve.vendors.some(v => {
            const vendor = v.toLowerCase();
            return manufacturer.includes(vendor) || vendor.includes(manufacturer);
        });
        
        // Product match: Check if device model contains cve product or vice versa
        const productMatch = cve.products.some(p => {
            const product = p.toLowerCase();
            return model.includes(product) || product.includes(model);
        });

        if (vendorMatch && productMatch) {
          // Check if link exists
          const existingLink = await ctx.db
            .query("deviceCves")
            .withIndex("by_device_cve", (q) => q.eq("deviceId", device._id).eq("cveId", cve._id))
            .unique();

          if (!existingLink) {
            await ctx.db.insert("deviceCves", {
              deviceId: device._id,
              cveId: cve._id,
              cveCode: cve.cveId,
              status: "active",
              detectedAt: Date.now(),
            });
            matchCount++;
          }
        }
      }

      // Update CVE count on device
      const cveLinks = await ctx.db
        .query("deviceCves")
        .withIndex("by_device", (q) => q.eq("deviceId", device._id))
        .collect();
      
      if (device.cveCount !== cveLinks.length) {
        await ctx.db.patch(device._id, { cveCount: cveLinks.length });
      }
    }
    console.log(`Matched ${matchCount} new CVE connections`);
  },
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
    // Sort by severity (Critical first)
    const severityOrder: Record<string, number> = { "CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3 };
    return cves.sort((a, b) => {
        const sA = severityOrder[a.severity || "LOW"] ?? 4;
        const sB = severityOrder[b.severity || "LOW"] ?? 4;
        return sA - sB;
    });
  },
});

export const getAllCVEs = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("cves").order("desc").take(100);
    }
});
