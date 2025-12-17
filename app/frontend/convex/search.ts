import { query } from "./_generated/server";
import { v } from "convex/values";

export const searchGlobal = query({
  args: {
    query: v.string(),
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const searchTerm = args.query.toLowerCase().trim();
    if (!searchTerm) return { devices: [], cves: [] };

    // 1. Search Devices
    // We try to match name, serial, ip, mac, manufacturer, model
    // Using filter for multi-field matching since we don't have a unified search index yet
    const devices = await ctx.db
      .query("medicalDevices")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .filter((q) =>
        q.or(
          // q.eq(q.field("name"), searchTerm), // Exact match? No, we want partial.
          // Convex filters don't support "contains" for strings efficiently without search index.
          // But we can iterate and filter in JS for "quick win" if dataset < 1000.
          // OR use the search index for name, and exact match for others?
          // Let's use the search index for Name, and then separate queries for exact IP/Serial?
          // Actually, let's just fetch recent/all and filter in JS for this "Quick Win" 
          // to support "contains" on multiple fields.
          // Ideally we should use .search("search_all", ...) for name.
          q.eq(q.field("organizationId"), args.organizationId)
        )
      )
      .collect();

    // Filter devices in memory for partial matches on multiple fields
    const matchedDevices = devices.filter((d) => {
        const s = searchTerm;
        return (
            d.name?.toLowerCase().includes(s) ||
            d.serialNumber?.toLowerCase().includes(s) ||
            d.ipAddress?.toLowerCase().includes(s) ||
            d.macAddress?.toLowerCase().includes(s) ||
            d.manufacturer?.toLowerCase().includes(s) ||
            d.model?.toLowerCase().includes(s)
        );
    }).slice(0, 10); // Limit to 10

    // 2. Search CVEs
    // Use the search index for description
    const cves = await ctx.db
        .query("cves")
        .withSearchIndex("search_description", (q) => q.search("description", searchTerm))
        .take(10);
    
    // Also check CVE ID exact/partial
    if (searchTerm.toUpperCase().startsWith("CVE-")) {
        const cveIdMatch = await ctx.db
            .query("cves")
            .withIndex("by_cve_id", q => q.eq("cveId", searchTerm.toUpperCase()))
            .first();
        if (cveIdMatch && !cves.find(c => c._id === cveIdMatch._id)) {
            cves.unshift(cveIdMatch);
        }
    }

    return {
        devices: matchedDevices.map(d => ({
            _id: d._id,
            type: 'device',
            title: d.name,
            subtitle: `${d.manufacturer} ${d.model} • ${d.ipAddress || 'No IP'}`,
            url: `/dashboard/devices/${d._id}`
        })),
        cves: cves.map(c => ({
            _id: c._id,
            type: 'cve',
            title: c.cveId,
            subtitle: c.description.substring(0, 60) + "...",
            url: `/dashboard/vulnerabilities?cve=${c.cveId}` // We might need a detail page or query param
        }))
    };
  },
});
