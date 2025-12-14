"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useMemo, memo, useState } from "react";
import {
  Shield,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Activity,
  Database,
  Wifi,
  Monitor,
  Server
} from "lucide-react";
import { useOrganization } from "@/contexts/organization-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip as UITooltip, TooltipTrigger as UITooltipTrigger, TooltipContent as UITooltipContent } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useCachedQuery } from "@/hooks/use-cached-query";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer
} from "recharts";

const RISK_COLORS = {
  critical: '#DC2626',
  high: '#EA580C',
  medium: '#D97706',
  low: '#65A30D'
};

const PHI_COLORS = ['#DC2626', '#EA580C', '#D97706', '#65A30D'];

export function RiskAssessment() {
  const { currentOrganization } = useOrganization();
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<"critical"|"high"|"medium"|"low"|null>(null);
  const riskDataLive = useQuery(
    api.medicalDevices.getRiskAssessmentData,
    currentOrganization ? { organizationId: currentOrganization._id } : "skip"
  );
  const { data: riskData, invalidate: invalidateRisk } = useCachedQuery(
    currentOrganization ? `risk:${currentOrganization._id}` : "risk:none",
    riskDataLive
  );
  const legacyDevicesLive = useQuery(
    api.medicalDevices.getLegacyOSDevices,
    currentOrganization ? { organizationId: currentOrganization._id } : "skip"
  );
  const { data: legacyDevices, invalidate: invalidateLegacy } = useCachedQuery(
    currentOrganization ? `legacy:${currentOrganization._id}` : "legacy:none",
    legacyDevicesLive
  );

  const allDevicesLive = useQuery(
    api.medicalDevices.getAllMedicalDevices,
    currentOrganization ? { organizationId: currentOrganization._id } : "skip"
  );
  const { data: allDevices } = useCachedQuery(
    currentOrganization ? `devices:${currentOrganization._id}` : "devices:none",
    allDevicesLive
  );

  type RiskLevel = "low" | "medium" | "high" | "critical";
  interface HospitalDeviceItem {
    id: string;
    name: string;
    entity?: string;
    manufacturer?: string;
    model?: string;
    osVersion: string;
    hasPHI: boolean;
    deviceOnNetwork: boolean;
    riskLevel: RiskLevel;
    reasons: string[];
    remediation: string[];
  }

  const hospitalDetails = useMemo((): { hospital: string | null; items: HospitalDeviceItem[]; summary: Record<RiskLevel, number> } | undefined => {
    if (!selectedHospital || !allDevices) return undefined as any;
    const devices = (allDevices || []).filter((d: any) => (d.entity || "Unknown") === selectedHospital);
    const items: HospitalDeviceItem[] = devices.map((d: any) => {
      const osLower = (d.osVersion || "").toLowerCase();
      const phiCat = (d.customerPHICategory || "").toLowerCase();
      const hasLegacyOS = osLower.includes("xp") || osLower.includes("2000") || osLower.includes("vista") || osLower.includes("windows 7") || osLower.includes("windows 8");
      const hasCriticalPHI = !!d.hasPHI && phiCat.includes("critical");
      const hasHighPHI = !!d.hasPHI && phiCat.includes("high");
      const isNetworkExposed = !!d.deviceOnNetwork && !!d.hasPHI;

      let riskLevel: RiskLevel = "low";
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

    const summary = items.reduce((acc: Record<RiskLevel, number>, it: HospitalDeviceItem) => {
      acc[it.riskLevel] = (acc[it.riskLevel] || 0) + 1;
      return acc;
    }, { low: 0, medium: 0, high: 0, critical: 0 });

    return { hospital: selectedHospital, items, summary };
  }, [selectedHospital, allDevices]);

  // Filters for Device Category Risk Scoring
  const [catFilters, setCatFilters] = useState({
    category: 'all',
    manufacturer: 'all',
    classification: 'all',
    network: 'all',
    phi: 'all',
    search: ''
  });
  const catOptions = useMemo(() => {
    const devices = (allDevices || []) as any[];
    return {
      categories: (() => {
        const preferred = ['Workstations', 'Digital Radiography', 'Mammographic'];
        const discovered = Array.from(new Set(devices.map(d => d.category).filter(Boolean))).sort();
        return [...preferred, ...discovered.filter(c => !preferred.includes(c))];
      })(),
      manufacturers: Array.from(new Set(devices.map(d => d.manufacturer).filter(Boolean))).sort(),
      classifications: Array.from(new Set(devices.map(d => d.classification).filter(Boolean))).sort(),
    };
  }, [allDevices]);
  const filteredDevicesForCat = useMemo(() => {
    const devices = (allDevices || []) as any[];
    return devices.filter(d => {
      if (catFilters.search) {
        const s = catFilters.search.toLowerCase();
        const matches = [d.name, d.entity, d.manufacturer, d.model, d.category, d.ipAddress].filter(Boolean).some((v: string) => (v as string).toLowerCase().includes(s));
        if (!matches) return false;
      }
      if (catFilters.category !== 'all' && d.category !== catFilters.category) return false;
      if (catFilters.manufacturer !== 'all' && d.manufacturer !== catFilters.manufacturer) return false;
      if (catFilters.classification !== 'all' && d.classification !== catFilters.classification) return false;
      if (catFilters.network !== 'all') {
        if (catFilters.network === 'connected' && !d.deviceOnNetwork) return false;
        if (catFilters.network === 'offline' && d.deviceOnNetwork) return false;
      }
      if (catFilters.phi !== 'all') {
        if (catFilters.phi === 'yes' && !d.hasPHI) return false;
        if (catFilters.phi === 'no' && d.hasPHI) return false;
      }
      return true;
    });
  }, [allDevices, catFilters]);
  const categoryRiskData = useMemo(() => {
    const map: Record<string, { total: number; critical: number; high: number; medium: number; low: number; phi: number; network: number; legacy: number }> = {};
    filteredDevicesForCat.forEach(d => {
      const key = d.category || 'Unknown';
      if (!map[key]) map[key] = { total: 0, critical: 0, high: 0, medium: 0, low: 0, phi: 0, network: 0, legacy: 0 };
      const cat = (d.customerPHICategory || d.classification || '').toLowerCase();
      if (cat.includes('critical')) map[key].critical++;
      else if (cat.includes('high')) map[key].high++;
      else if (cat.includes('medium')) map[key].medium++;
      else map[key].low++;
      if (d.hasPHI) map[key].phi++;
      if (d.deviceOnNetwork) map[key].network++;
      const osLower = (d.osVersion || '').toLowerCase();
      const isLegacy = osLower.includes('xp') || osLower.includes('2000') || osLower.includes('vista') || osLower.includes('windows 7') || osLower.includes('windows 8');
      if (isLegacy) map[key].legacy++;
      map[key].total++;
    });
    return Object.entries(map).map(([category, v]) => {
      const score = v.total > 0 ? Math.round(((v.critical*100) + (v.high*75) + (v.medium*50) + (v.low*25)) / v.total) : 0;
      return {
        category,
        avgRiskScore: score,
        count: v.total,
        phiPercentage: v.total > 0 ? Math.round((v.phi / v.total) * 100) : 0,
        networkPercentage: v.total > 0 ? Math.round((v.network / v.total) * 100) : 0,
        legacyPercentage: v.total > 0 ? Math.round((v.legacy / v.total) * 100) : 0,
      };
    }).sort((a, b) => b.avgRiskScore - a.avgRiskScore);
  }, [filteredDevicesForCat]);

  const phiChartData = useMemo(() => {
    if (!riskData?.phiRiskOverview) return [];
    const { critical, high, medium, low } = riskData.phiRiskOverview;
    return [
      { name: 'Critical', value: critical, color: RISK_COLORS.critical },
      { name: 'High', value: high, color: RISK_COLORS.high },
      { name: 'Medium', value: medium, color: RISK_COLORS.medium },
      { name: 'Low', value: low, color: RISK_COLORS.low }
    ].filter(item => item.value > 0);
  }, [riskData?.phiRiskOverview]);

  if (!currentOrganization) {
    return (
      <div className="bg-gradient-to-br from-white to-gray-50 backdrop-blur-sm rounded-2xl p-12 text-center shadow-lg border border-gray-200/50">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Shield className="h-8 w-8 text-orange-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Select Organization</h3>
          <p className="text-gray-600 leading-relaxed">Please select an organization to view risk assessment data.</p>
        </div>
      </div>
    );
  }

  if (riskData === undefined || legacyDevices === undefined) {
    return (
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => { invalidateRisk(); invalidateLegacy(); }}>
            Refresh Data
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Risk Levels Explained
          </CardTitle>
          <CardDescription>What Critical, High, Medium, Low mean and how we calculate them</CardDescription>
        </CardHeader>
        <CardContent className="text-sm grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="destructive">Critical</Badge>
              <span>Immediate action: legacy OS, PHI on network, or device marked critical by category</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">High</Badge>
              <span>High sensitivity or exposure: PHI present, high PHI category, key clinical categories</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge>Medium</Badge>
              <span>Some exposure: PHI or network presence without high/critical markers</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Low</Badge>
              <span>Minimal exposure: non-networked, no PHI, or routine categories</span>
            </div>
          </div>
          <div className="space-y-2 text-muted-foreground">
            <div>Derived from device fields like `customerPHICategory`, `hasPHI`, `deviceOnNetwork`, and OS version.</div>
            <div>Examples: Windows XP devices are flagged critical; networked PHI devices are high/critical depending on category.</div>
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-end">
        <Button variant="outline" onClick={() => { invalidateRisk(); invalidateLegacy(); }}>
          Refresh Data
        </Button>
      </div>
      {/* Risk Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Risk Score</CardTitle>
            <Shield className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{riskData?.totalRiskScore || 0}</div>
            <div className="flex items-center space-x-2 mt-2">
              <Progress value={riskData?.totalRiskScore || 0} className="flex-1" />
              <Badge variant={riskData?.totalRiskScore > 70 ? "destructive" : riskData?.totalRiskScore > 40 ? "secondary" : "default"}>
                {riskData?.totalRiskScore > 70 ? "High" : riskData?.totalRiskScore > 40 ? "Medium" : "Low"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Legacy OS Devices</CardTitle>
            <Monitor className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{legacyDevices?.length || 0}</div>
            <p className="text-xs text-red-600 mt-1">
              Critical security risk
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">PHI Devices</CardTitle>
            <Database className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.values(riskData?.phiRiskOverview || {}).reduce((a, b) => a + b, 0)}
            </div>
            <p className="text-xs text-purple-600 mt-1">
              Patient data at risk
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk Hospitals</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {riskData?.hospitalRiskHeatmap?.filter(h => h.riskScore > 70).length || 0}
            </div>
            <p className="text-xs text-orange-600 mt-1">
              Require immediate attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Hospital Risk Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Hospital Risk Heatmap
          </CardTitle>
          <CardDescription>
            Critical device distribution across healthcare entities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Heatmap Grid */}
            <div className="overflow-x-auto">
              <div className="min-w-full">
                {/* Header Row */}
                <div className="grid grid-cols-5 gap-1 mb-2">
                  <div className="text-xs font-medium text-gray-600 p-2">Hospital</div>
                  <UITooltip>
                    <UITooltipTrigger className="text-xs font-medium text-gray-600 p-2 text-center">Critical</UITooltipTrigger>
                    <UITooltipContent>Legacy OS, PHI on network, or life-critical categories</UITooltipContent>
                  </UITooltip>
                  <UITooltip>
                    <UITooltipTrigger className="text-xs font-medium text-gray-600 p-2 text-center">High</UITooltipTrigger>
                    <UITooltipContent>High PHI category, PHI present, imaging/monitoring devices</UITooltipContent>
                  </UITooltip>
                  <UITooltip>
                    <UITooltipTrigger className="text-xs font-medium text-gray-600 p-2 text-center">Medium</UITooltipTrigger>
                    <UITooltipContent>PHI or network presence without high/critical markers</UITooltipContent>
                  </UITooltip>
                  <UITooltip>
                    <UITooltipTrigger className="text-xs font-medium text-gray-600 p-2 text-center">Low</UITooltipTrigger>
                    <UITooltipContent>Minimal exposure, non-networked and no PHI</UITooltipContent>
                  </UITooltip>
                </div>
                
                {/* Heatmap Rows */}
                {riskData?.hospitalRiskHeatmap?.map((hospital, index) => {
                  const total = hospital.critical + hospital.high + hospital.medium + hospital.low;
                  const criticalIntensity = total > 0 ? (hospital.critical / total) * 100 : 0;
                  const highIntensity = total > 0 ? (hospital.high / total) * 100 : 0;
                  const mediumIntensity = total > 0 ? (hospital.medium / total) * 100 : 0;
                  const lowIntensity = total > 0 ? (hospital.low / total) * 100 : 0;
                  
                  return (
                    <div key={index} className="grid grid-cols-5 gap-1 mb-1">
                      <div className="text-xs font-medium p-2 bg-gray-50 rounded flex items-center">
                        {hospital.hospital}
                      </div>
                      
                      {/* Critical Cell */}
                      <div 
                        className="p-2 rounded text-center text-xs font-medium text-white relative overflow-hidden"
                        style={{
                          backgroundColor: `rgba(220, 38, 38, ${Math.max(0.1, criticalIntensity / 100)})`,
                          color: criticalIntensity > 50 ? 'white' : '#DC2626'
                        }}
                        onClick={() => { setSelectedHospital(hospital.hospital); setSelectedLevel("critical"); setDetailOpen(true); }}
                      >
                        {hospital.critical}
                      </div>
                      
                      {/* High Cell */}
                      <div 
                        className="p-2 rounded text-center text-xs font-medium relative overflow-hidden"
                        style={{
                          backgroundColor: `rgba(234, 88, 12, ${Math.max(0.1, highIntensity / 100)})`,
                          color: highIntensity > 50 ? 'white' : '#EA580C'
                        }}
                        onClick={() => { setSelectedHospital(hospital.hospital); setSelectedLevel("high"); setDetailOpen(true); }}
                      >
                        {hospital.high}
                      </div>
                      
                      {/* Medium Cell */}
                      <div 
                        className="p-2 rounded text-center text-xs font-medium relative overflow-hidden"
                        style={{
                          backgroundColor: `rgba(217, 119, 6, ${Math.max(0.1, mediumIntensity / 100)})`,
                          color: mediumIntensity > 50 ? 'white' : '#D97706'
                        }}
                        onClick={() => { setSelectedHospital(hospital.hospital); setSelectedLevel("medium"); setDetailOpen(true); }}
                      >
                        {hospital.medium}
                      </div>
                      
                      {/* Low Cell */}
                      <div 
                        className="p-2 rounded text-center text-xs font-medium relative overflow-hidden"
                        style={{
                          backgroundColor: `rgba(101, 163, 13, ${Math.max(0.1, lowIntensity / 100)})`,
                          color: lowIntensity > 50 ? 'white' : '#65A30D'
                        }}
                        onClick={() => { setSelectedHospital(hospital.hospital); setSelectedLevel("low"); setDetailOpen(true); }}
                      >
                        {hospital.low}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Legend */}
            <div className="flex items-center justify-center space-x-6 pt-4 border-t">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: RISK_COLORS.critical }}></div>
                <span className="text-xs text-gray-600">Critical</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: RISK_COLORS.high }}></div>
                <span className="text-xs text-gray-600">High</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: RISK_COLORS.medium }}></div>
                <span className="text-xs text-gray-600">Medium</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: RISK_COLORS.low }}></div>
                <span className="text-xs text-gray-600">Low</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PHI Risk Overview and OS Risk Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PHIRiskChart data={phiChartData} />
        <OSRiskProfileChart data={riskData?.osRiskProfile || []} />
      </div>

      {/* Device Category Risk Scoring with filters and export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Device Category Risk Scoring
          </CardTitle>
          <CardDescription>
            Risk assessment by medical device categories with filters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative">
                <Input placeholder="Search devices..." value={catFilters.search} onChange={(e) => setCatFilters(f => ({ ...f, search: e.target.value }))} className="w-56" />
              </div>
              <Select value={catFilters.category} onValueChange={(v) => setCatFilters(f => ({ ...f, category: v }))}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Device Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Device Types</SelectItem>
                  {catOptions.categories.map(c => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                </SelectContent>
              </Select>
              <Select value={catFilters.manufacturer} onValueChange={(v) => setCatFilters(f => ({ ...f, manufacturer: v }))}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Brand" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Brands</SelectItem>
                  {catOptions.manufacturers.map(m => (<SelectItem key={m} value={m}>{m}</SelectItem>))}
                </SelectContent>
              </Select>
              <Select value={catFilters.classification} onValueChange={(v) => setCatFilters(f => ({ ...f, classification: v }))}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Risk Level" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Risk Levels</SelectItem>
                  {catOptions.classifications.map(c => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                </SelectContent>
              </Select>
              <Select value={catFilters.network} onValueChange={(v) => setCatFilters(f => ({ ...f, network: v }))}>
                <SelectTrigger className="w-32"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Status</SelectItem>
                  <SelectItem value="connected">Connected</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                </SelectContent>
              </Select>
              <Select value={catFilters.phi} onValueChange={(v) => setCatFilters(f => ({ ...f, phi: v }))}>
                <SelectTrigger className="w-32"><SelectValue placeholder="PHI" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any PHI</SelectItem>
                  <SelectItem value="yes">Has PHI</SelectItem>
                  <SelectItem value="no">No PHI</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={() => setCatFilters({ category: 'all', manufacturer: 'all', classification: 'all', network: 'all', phi: 'all', search: '' })}>Clear</Button>
              <Button size="sm" variant="outline" onClick={() => {
                const rows = filteredDevicesForCat.map(d => ({
                  name: d.name,
                  entity: d.entity || '',
                  manufacturer: d.manufacturer || '',
                  model: d.model || '',
                  category: d.category || '',
                  classification: d.classification || '',
                  ipAddress: d.ipAddress || '',
                  onNetwork: d.deviceOnNetwork ? 'yes' : 'no',
                  hasPHI: d.hasPHI ? 'yes' : 'no',
                }));
                const header = Object.keys(rows[0] || {name:'',entity:'',manufacturer:'',model:'',category:'',classification:'',ipAddress:'',onNetwork:'',hasPHI:''});
                const csv = [header.join(','), ...rows.map(r => header.map(h => String((r as any)[h]).replace(/,/g,';')).join(','))].join('\n');
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `devices-filtered.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}>Export CSV</Button>
            </div>
            {categoryRiskData.map((category, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{category.category}</h4>
                  <Badge variant={category.avgRiskScore > 70 ? "destructive" : category.avgRiskScore > 40 ? "secondary" : "default"}>
                    Risk Score: {category.avgRiskScore}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Total Devices:</span>
                    <span className="font-medium ml-2">{category.count}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">PHI Devices:</span>
                    <span className="font-medium ml-2">{category.phiPercentage}%</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Network Connected:</span>
                    <span className="font-medium ml-2">{category.networkPercentage}%</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Legacy OS:</span>
                    <span className="font-medium ml-2 text-red-600">{category.legacyPercentage}%</span>
                  </div>
                </div>
                <Progress value={category.avgRiskScore} className="mt-3" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Legacy OS Devices Table */}
      {legacyDevices && legacyDevices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Legacy Operating Systems - Immediate Action Required
            </CardTitle>
            <CardDescription>
              Devices running outdated operating systems with known security vulnerabilities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Device Name</th>
                    <th className="text-left p-2">Hospital</th>
                    <th className="text-left p-2">OS Version</th>
                    <th className="text-left p-2">Manufacturer</th>
                    <th className="text-left p-2">PHI</th>
                    <th className="text-left p-2">Network</th>
                    <th className="text-left p-2">Risk Level</th>
                  </tr>
                </thead>
                <tbody>
                  {legacyDevices.map((device, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-medium">{device.name}</td>
                      <td className="p-2">{device.entity}</td>
                      <td className="p-2">
                        <Badge variant="destructive" className="text-xs">
                          {device.osVersion}
                        </Badge>
                      </td>
                      <td className="p-2">{device.manufacturer}</td>
                      <td className="p-2">
                        {device.hasPHI ? (
                          <Badge variant="secondary" className="text-xs">Yes</Badge>
                        ) : (
                          <span className="text-gray-400">No</span>
                        )}
                      </td>
                      <td className="p-2">
                        {device.deviceOnNetwork ? (
                          <Badge variant="secondary" className="text-xs">Connected</Badge>
                        ) : (
                          <span className="text-gray-400">Offline</span>
                        )}
                      </td>
                      <td className="p-2">
                        <Badge variant={device.riskLevel === "critical" ? "destructive" : "secondary"}>
                          {device.riskLevel.toUpperCase()}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedHospital && (
        <Dialog open={detailOpen} onOpenChange={(o) => { setDetailOpen(o); if (!o) { setSelectedHospital(null); setSelectedLevel(null); } }}>
        <DialogContent className="sm:max-w-3xl max-w-[calc(100%-2rem)] sm:max-h-[calc(100vh-6rem)] my-6 overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedHospital}</DialogTitle>
              <DialogDescription>
                {selectedLevel ? `Showing ${selectedLevel.toUpperCase()} devices` : "Device risk details"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <div className="text-muted-foreground">Critical</div>
                  <div className="font-medium">{hospitalDetails?.summary?.critical ?? 0}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">High</div>
                  <div className="font-medium">{hospitalDetails?.summary?.high ?? 0}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Medium</div>
                  <div className="font-medium">{hospitalDetails?.summary?.medium ?? 0}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Low</div>
                  <div className="font-medium">{hospitalDetails?.summary?.low ?? 0}</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Devices</div>
                <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                  {(hospitalDetails?.items || [])
                    .filter((it: HospitalDeviceItem) => !selectedLevel || it.riskLevel === selectedLevel)
                    .map((it: HospitalDeviceItem) => (
                      <div key={it.id} className="p-3 rounded-lg border bg-white/60">
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-medium text-sm truncate">{it.name}</div>
                          <div className="flex items-center gap-2">
                            <Badge variant={it.riskLevel === "critical" ? "destructive" : it.riskLevel === "high" ? "secondary" : it.riskLevel === "medium" ? "default" : "outline"} className="text-xs">
                              {it.riskLevel.toUpperCase()}
                            </Badge>
                            {it.hasPHI ? (
                              <Badge variant="secondary" className="text-xs">PHI</Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">No PHI</span>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-gray-600 mt-1">{it.manufacturer || "Unknown"} • {it.model || "Unknown"} • {it.osVersion}</div>
                        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div>
                            <div className="text-xs font-medium">Why flagged</div>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {it.reasons.map((r: string, idx: number) => (
                                <Badge key={idx} variant="outline" className="text-xs">{r}</Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-medium">Recommended actions</div>
                            <ul className="text-xs text-gray-700 list-disc pl-5 mt-1">
                              {it.remediation.map((r: string, idx: number) => (
                                <li key={idx}>{r}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// PHI Risk Chart Component
const PHIRiskChart = memo(({ data }: { data: Array<{name: string, value: number, color: string}> }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Shield className="h-5 w-5" />
        PHI Risk Overview
      </CardTitle>
      <CardDescription>
        Patient Health Information risk distribution
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsPieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </RechartsPieChart>
        </ResponsiveContainer>
      </div>
    </CardContent>
  </Card>
));
PHIRiskChart.displayName = 'PHIRiskChart';

// OS Risk Profile Component
const OSRiskProfileChart = memo(({ data }: { data: Array<{os: string, count: number, isLegacy: boolean, riskLevel: string, vulnerabilities: number}> }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Monitor className="h-5 w-5" />
        Operating System Risk Profile
      </CardTitle>
      <CardDescription>
        Security risk assessment by OS version
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {data.map((os, index) => (
          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{os.os}</span>
                {os.isLegacy && (
                  <Badge variant="destructive" className="text-xs">
                    LEGACY
                  </Badge>
                )}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {os.count} devices • {os.vulnerabilities} vulnerabilities
              </div>
            </div>
            <Badge 
              variant={
                os.riskLevel === "critical" ? "destructive" : 
                os.riskLevel === "high" ? "secondary" : 
                "default"
              }
            >
              {os.riskLevel.toUpperCase()}
            </Badge>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
));
OSRiskProfileChart.displayName = 'OSRiskProfileChart';
