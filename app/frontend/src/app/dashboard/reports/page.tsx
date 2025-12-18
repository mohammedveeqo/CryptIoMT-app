"use client";

import { ScheduledReports } from "@/components/dashboard/scheduled-reports";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useOrganization } from "@/contexts/organization-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, Printer } from "lucide-react";

export default function ReportsPage() {
  const { currentOrganization } = useOrganization();
  const devices = useQuery(
    api.medicalDevices.getAllMedicalDevices,
    currentOrganization ? { organizationId: currentOrganization._id } : "skip"
  );

  const exportSummary = () => {
    if (!devices) return;
    
    const totalDevices = devices.length;
    const phiDevices = devices.filter((d) => d.hasPHI).length;
    const connectedDevices = devices.filter((d) => d.deviceOnNetwork).length;
    const offlineDevices = totalDevices - connectedDevices;
    
    const byClassification: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    const byManufacturer: Record<string, number> = {};
    const byOsVersion: Record<string, number> = {};
    
    devices.forEach((d) => {
      const cls = d.classification || "Unknown";
      const cat = d.category || "Unknown";
      const man = d.manufacturer || "Unknown";
      const osv = (d as any).osVersion || "Unknown";
      
      byClassification[cls] = (byClassification[cls] || 0) + 1;
      byCategory[cat] = (byCategory[cat] || 0) + 1;
      byManufacturer[man] = (byManufacturer[man] || 0) + 1;
      byOsVersion[osv] = (byOsVersion[osv] || 0) + 1;
    });

    const rows: { [k: string]: string | number }[] = [];
    rows.push({ Metric: "Total Devices", Value: totalDevices });
    rows.push({ Metric: "PHI Devices", Value: phiDevices });
    rows.push({ Metric: "Connected Devices", Value: connectedDevices });
    rows.push({ Metric: "Offline Devices", Value: offlineDevices });
    rows.push({ Metric: "Classifications", Value: "" });
    Object.entries(byClassification).forEach(([k, v]) =>
      rows.push({ Metric: `classification:${k}`, Value: v })
    );
    rows.push({ Metric: "Categories", Value: "" });
    Object.entries(byCategory).forEach(([k, v]) =>
      rows.push({ Metric: `category:${k}`, Value: v })
    );
    rows.push({ Metric: "Manufacturers", Value: "" });
    Object.entries(byManufacturer).forEach(([k, v]) =>
      rows.push({ Metric: `manufacturer:${k}`, Value: v })
    );
    rows.push({ Metric: "OS Versions", Value: "" });
    Object.entries(byOsVersion).forEach(([k, v]) =>
      rows.push({ Metric: `os:${k}`, Value: v })
    );

    const header = ["Metric", "Value"];
    const csv = [
      header.join(","),
      ...rows.map((r) =>
        header.map((h) => String(r[h]).replace(/,/g, ";")).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "reports-summary.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportDevices = () => {
    if (!devices) return;
    const rows = devices.map((d) => ({
      name: d.name,
      entity: d.entity,
      serialNumber: d.serialNumber,
      manufacturer: d.manufacturer,
      model: d.model,
      category: d.category,
      classification: d.classification,
      ipAddress: (d as any).ipAddress || "",
      osVersion: (d as any).osVersion || "",
      onNetwork: d.deviceOnNetwork ? "yes" : "no",
      hasPHI: d.hasPHI ? "yes" : "no",
    }));

    const header = Object.keys(
      rows[0] || {
        name: "",
        entity: "",
        serialNumber: "",
        manufacturer: "",
        model: "",
        category: "",
        classification: "",
        ipAddress: "",
        osVersion: "",
        onNetwork: "",
        hasPHI: "",
      }
    );
    const csv = [
      header.join(","),
      ...rows.map((r) =>
        header.map((h) => String((r as any)[h]).replace(/,/g, ";")).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "devices-all.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = async () => {
    try {
      // @ts-ignore
      const html2canvas = (await import('html2canvas')).default;
      // @ts-ignore
      const jsPDF = (await import('jspdf')).default;

      const element = document.getElementById('reports-content');
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        // ignoreElements: (element: Element) => element.classList.contains('no-print'),
      } as any);

      const imgData = canvas.toDataURL('image/png');
      const orientation = canvas.width > canvas.height ? 'landscape' : 'portrait';
      const pdf = new jsPDF({
        orientation,
        unit: 'px',
        format: [canvas.width, canvas.height]
      });

      // Add the dashboard screenshot below the header
      // pdf.addImage(imgData, 'PNG', 0, 120, canvas.width, canvas.height);
      // pdf.addImage(imgData, 'PNG', 0, 10, canvas.width, canvas.height);
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      
      pdf.save(`reports-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export PDF. Please try again.");
    }
  };

  // Stats calculation
  const stats = (() => {
    if (!devices) return null;
    const totalDevices = devices.length;
    const phiDevices = devices.filter((d) => d.hasPHI).length;
    const connectedDevices = devices.filter((d) => d.deviceOnNetwork).length;
    const offlineDevices = totalDevices - connectedDevices;
    
    const byManufacturer: Record<string, number> = {};
    devices.forEach((d) => {
      const man = d.manufacturer || "Unknown";
      byManufacturer[man] = (byManufacturer[man] || 0) + 1;
    });
    const topManufacturers = Object.entries(byManufacturer)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    const ownerMap: Record<string, { count: number; highRisk: number }> = {};
    devices.forEach((d) => {
      const ownerName = (d as any).ownerName || (d.ownerId ? `Owner ${String(d.ownerId).slice(-6)}` : 'Unassigned');
      const classification = (d.classification || '').toLowerCase();
      const riskScore = (d as any).riskScore || 0;
      const highRisk = riskScore >= 70 || classification.includes('critical') || classification.includes('high') || ((d.cveCount || 0) > 0);
      ownerMap[ownerName] = ownerMap[ownerName] || { count: 0, highRisk: 0 };
      ownerMap[ownerName].count += 1;
      if (highRisk) ownerMap[ownerName].highRisk += 1;
    });
    const ownerStats = Object.entries(ownerMap).sort((a, b) => b[1].count - a[1].count);
    
    return {
      totalDevices,
      phiDevices,
      connectedDevices,
      offlineDevices,
      topManufacturers,
      ownerStats
    };
  })();

  return (
    <div className="space-y-6" id="reports-content">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Manage scheduled reports and export on-demand summaries
          </p>
        </div>
        <div className="flex gap-2 no-print" data-html2canvas-ignore="true">
          <Button variant="outline" onClick={exportSummary} disabled={!devices} className="rounded-md">
            <Download className="h-4 w-4 mr-2" />
            Export Summary CSV
          </Button>
          <Button variant="outline" onClick={exportDevices} disabled={!devices} className="rounded-md">
            <Download className="h-4 w-4 mr-2" />
            Export Devices CSV
          </Button>
          <Button variant="outline" onClick={handleExportPDF} className="rounded-md">
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" onClick={() => window.print()} className="rounded-md">
            <Printer className="h-4 w-4 mr-2" />
            Print View
          </Button>
        </div>
      </div>
      
      {/* On-demand Stats */}
      {stats && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Devices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDevices}</div>
              <p className="text-xs text-muted-foreground">From latest upload</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">PHI Devices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.phiDevices}</div>
              <p className="text-xs text-muted-foreground">Contain patient data</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Connected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.connectedDevices}</div>
              <p className="text-xs text-muted-foreground">On network</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Offline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.offlineDevices}</div>
              <p className="text-xs text-muted-foreground">Not networked</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Top Manufacturers */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm">Top Manufacturers</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                {stats.topManufacturers.map(([m, c]) => (
                    <div key={m} className="flex items-center justify-between p-2 border rounded-lg bg-slate-50">
                    <span className="font-medium truncate mr-2 text-sm" title={m}>{m}</span>
                    <Badge variant="secondary">{c}</Badge>
                    </div>
                ))}
                </div>
            </CardContent>
            </Card>

            <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm">Staff Workload & Risk</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                {stats.ownerStats.map(([owner, data]) => (
                    <div key={owner} className="flex items-center justify-between p-2 border rounded-lg">
                        <div className="flex flex-col overflow-hidden">
                            <span className="font-medium truncate text-sm" title={owner}>{owner}</span>
                            <span className="text-xs text-muted-foreground">
                                {data.highRisk > 0 ? (
                                    <span className="text-red-600 font-medium">{data.highRisk} High Risk</span>
                                ) : (
                                    <span className="text-green-600">Low Risk</span>
                                )}
                            </span>
                        </div>
                        <Badge variant="outline">{data.count}</Badge>
                    </div>
                ))}
                </div>
            </CardContent>
            </Card>
        </div>
      )}

      {/* Scheduled Reports Section */}
      <div className="bg-card rounded-lg border p-6">
        <ScheduledReports />
      </div>
    </div>
  );
}
