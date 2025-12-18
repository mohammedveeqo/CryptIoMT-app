"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useOrganization } from "@/contexts/organization-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, ShieldAlert, CheckCircle, AlertTriangle, ShieldCheck } from "lucide-react";
import { VulnerabilityDetails } from "./vulnerability-details";

export default function VulnerabilitiesPage() {
  const { currentOrganization } = useOrganization();
  const cves = useQuery(api.cves.getOrganizationCVEs, 
        currentOrganization ? { organizationId: currentOrganization._id } : "skip"
    );
  
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCve, setSelectedCve] = useState<any>(null);

  // Stats
  const stats = {
     total: cves?.length || 0,
     active: cves?.reduce((acc, c) => acc + (c.activeCount || 0), 0) || 0,
     mitigated: cves?.reduce((acc, c) => acc + (c.mitigatedCount || 0), 0) || 0,
     patched: cves?.reduce((acc, c) => acc + (c.patchedCount || 0), 0) || 0,
     accepted: cves?.reduce((acc, c) => acc + (c.acceptedCount || 0), 0) || 0,
  };

  const remediationProgress = stats.total > 0 
    ? Math.round(((stats.mitigated + stats.patched + stats.accepted) / (stats.active + stats.mitigated + stats.patched + stats.accepted)) * 100)
    : 0;

  // Filter Logic
  const filteredCves = cves?.filter(cve => {
    const matchesSearch = 
        cve.cveId.toLowerCase().includes(search.toLowerCase()) || 
        cve.description.toLowerCase().includes(search.toLowerCase());
    
    const matchesSeverity = severityFilter === "all" || (cve.severity?.toLowerCase() === severityFilter);
    
    // Status filter is tricky because a CVE can have mixed status across devices.
    // Let's filter if it has ANY devices with that status.
    let matchesStatus = true;
    if (statusFilter === "active") matchesStatus = cve.activeCount > 0;
    if (statusFilter === "mitigated") matchesStatus = cve.mitigatedCount > 0;
    if (statusFilter === "patched") matchesStatus = cve.patchedCount > 0;
    
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const getSeverityColor = (severity: string) => {
      switch (severity?.toUpperCase()) {
          case 'CRITICAL': return 'destructive';
          case 'HIGH': return 'orange'; // destructive variant usually red
          case 'MEDIUM': return 'secondary';
          default: return 'outline';
      }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vulnerabilities</CardTitle>
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Across all devices
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Risks</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              Instances requiring action
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remediation Progress</CardTitle>
            <ShieldCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{remediationProgress}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.mitigated + stats.patched} resolved / {stats.active} remaining
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Patched / Mitigated</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.patched + stats.mitigated}</div>
            <p className="text-xs text-muted-foreground">
              Successfully handled
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                placeholder="Search CVE ID or description..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />
        </div>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
            </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="mitigated">Mitigated</SelectItem>
                <SelectItem value="patched">Patched</SelectItem>
            </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg bg-card">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Severity</TableHead>
                    <TableHead>CVE ID</TableHead>
                    <TableHead className="w-[400px]">Description</TableHead>
                    <TableHead>Affected Devices</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {filteredCves?.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No vulnerabilities found matching your filters.
                        </TableCell>
                    </TableRow>
                )}
                {filteredCves?.map((cve: any) => (
                    <TableRow key={cve.cveId}>
                        <TableCell>
                            <Badge variant={getSeverityColor(cve.severity) as any}>
                                {cve.severity?.toUpperCase()}
                            </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{cve.cveId}</TableCell>
                        <TableCell>
                            <div className="line-clamp-2 text-sm text-muted-foreground" title={cve.description}>
                                {cve.description}
                            </div>
                        </TableCell>
                        <TableCell>{cve.affectedDevices}</TableCell>
                        <TableCell>
                            <div className="flex gap-2 text-xs">
                                {cve.activeCount > 0 && <span className="text-red-500 font-medium">{cve.activeCount} Active</span>}
                                {cve.patchedCount > 0 && <span className="text-green-500">{cve.patchedCount} Patched</span>}
                                {cve.mitigatedCount > 0 && <span className="text-blue-500">{cve.mitigatedCount} Mitigated</span>}
                            </div>
                        </TableCell>
                        <TableCell className="text-right">
                            <Button variant="outline" size="sm" onClick={() => setSelectedCve(cve)}>
                                Manage
                            </Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
      </div>

      {/* Details Sheet */}
      <Sheet open={!!selectedCve} onOpenChange={(open) => !open && setSelectedCve(null)}>
        <SheetContent className="w-[800px] sm:w-[540px] overflow-y-auto">
            <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                    {selectedCve?.cveId}
                    {selectedCve && (
                        <Badge variant={getSeverityColor(selectedCve.severity) as any}>
                            {selectedCve.severity?.toUpperCase()}
                        </Badge>
                    )}
                </SheetTitle>
                <SheetDescription>
                    Manage affected devices and track remediation progress.
                </SheetDescription>
            </SheetHeader>
            <div className="mt-6">
                {selectedCve && currentOrganization && (
                    <VulnerabilityDetails cve={selectedCve} organizationId={currentOrganization._id} />
                )}
            </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
