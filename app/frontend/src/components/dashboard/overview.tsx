"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useMemo, memo, useEffect, useState } from "react";
import {
  Server,
  Users,
  User,
  UserMinus,
  AlertTriangle,
  Shield,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Building2,
  Network,
  Activity,
  Database,
  Wifi,
  WifiOff
} from "lucide-react";
import { useOrganization } from "@/contexts/organization-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
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
import { useRouter } from "next/navigation";
import { Copy } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DeviceDistribution } from './charts/device-distribution';
import { Responsive, WidthProvider, type Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { useCachedQuery } from '@/hooks/use-cached-query';

// Define proper types for the data
interface TechnicianData {
  name: string;
  avgScore: number;
}

interface HospitalData {
  name: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
  networkOnly: number;
  total: number;
}

interface OSData {
  name: string;
  count: number;
  type: string;
}

function useCustomersForAdmin(isAdmin: boolean) {
  // Implementation here
  return [];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C'];

export function DashboardOverview() {
  const { currentOrganization } = useOrganization();
  const router = useRouter();
  const ResponsiveGridLayout = WidthProvider(Responsive);
  const [isEditMode, setIsEditMode] = useState(false);
  const getSectionMin = (i: string) => {
    switch (i) {
      case 'phi':
      case 'network':
        return { minW: 6, minH: 8 };
      case 'tech':
      case 'os':
      case 'ownership':
        return { minW: 6, minH: 10 };
      case 'criticality':
      case 'distribution':
        return { minW: 12, minH: 12 };
      default:
        return { minW: 6, minH: 8 };
    }
  };
  const normalizeSectionLayouts = (all: { [key: string]: Layout[] }) => {
    const result: { [key: string]: Layout[] } = {};
    Object.entries(all || {}).forEach(([bp, arr]) => {
      result[bp] = (arr || []).map(l => {
        const { minW, minH } = getSectionMin(l.i);
        return { ...l, minW, minH, w: Math.max(l.w || minW, minW), h: Math.max(l.h || minH, minH) } as Layout;
      });
    });
    return result;
  };
  const normalizeStatLayouts = (all: { [key: string]: Layout[] }) => {
    const result: { [key: string]: Layout[] } = {};
    Object.entries(all || {}).forEach(([bp, arr]) => {
      result[bp] = (arr || []).map(l => {
        const minW = 3;
        const minH = 2;
        return { ...l, minW, minH, w: Math.max(l.w || minW, minW), h: Math.max(l.h || minH, minH) } as Layout;
      });
    });
    return result;
  };
  const initialLayouts = (() => {
    const key = currentOrganization ? `overview-layout:${currentOrganization._id}` : 'overview-layout:none';
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
      if (raw) return normalizeSectionLayouts(JSON.parse(raw) as { [key: string]: Layout[] });
    } catch {}
    return {
      lg: [
        { i: 'phi', x: 0, y: 0, w: 6, h: 8, minW: 6, minH: 8 },
        { i: 'network', x: 6, y: 0, w: 6, h: 8, minW: 6, minH: 8 },
        { i: 'tech', x: 0, y: 8, w: 6, h: 10, minW: 6, minH: 10 },
        { i: 'os', x: 6, y: 8, w: 6, h: 10, minW: 6, minH: 10 },
        { i: 'ownership', x: 0, y: 18, w: 6, h: 10, minW: 6, minH: 10 },
        { i: 'criticality', x: 0, y: 28, w: 12, h: 12, minW: 12, minH: 12 },
        { i: 'distribution', x: 0, y: 40, w: 12, h: 12, minW: 12, minH: 12 },
      ],
    } as { [key: string]: Layout[] };
  })();
  const [layouts, setLayouts] = useState<{ [key: string]: Layout[] }>(initialLayouts);
  const saveLayouts = () => {
    const key = currentOrganization ? `overview-layout:${currentOrganization._id}` : 'overview-layout:none';
    try {
      if (typeof window !== 'undefined') localStorage.setItem(key, JSON.stringify(layouts));
    } catch {}
    setIsEditMode(false);
  };

  useEffect(() => {
    const key = currentOrganization ? `overview-layout:${currentOrganization._id}` : 'overview-layout:none';
    try {
      if (typeof window !== 'undefined') localStorage.setItem(key, JSON.stringify(layouts));
    } catch {}
  }, [layouts, currentOrganization]);

  // Separate queries for each data type
  const analyticsLive = useQuery(
    api.medicalDevices.getDashboardAnalytics,
    currentOrganization ? { organizationId: currentOrganization._id } : "skip"
  );
  const { data: analytics } = useCachedQuery(
    currentOrganization ? `analytics:${currentOrganization._id}` : 'analytics:none',
    analyticsLive
  );
  
  const technicianPerformanceLive = useQuery(
    api.medicalDevices.getTechnicianPerformance,
    currentOrganization ? { organizationId: currentOrganization._id } : "skip"
  );
  const { data: technicianPerformance } = useCachedQuery(
    currentOrganization ? `tech:${currentOrganization._id}` : 'tech:none',
    technicianPerformanceLive
  );
  
  const equipmentCriticalityLive = useQuery(
    api.medicalDevices.getEquipmentCriticalityByHospital,
    currentOrganization ? { organizationId: currentOrganization._id } : "skip"
  );
  const { data: equipmentCriticality } = useCachedQuery(
    currentOrganization ? `criticality:${currentOrganization._id}` : 'criticality:none',
    equipmentCriticalityLive
  );
  
  const osDistributionLive = useQuery(
    api.medicalDevices.getOperatingSystemDistribution,
    currentOrganization ? { organizationId: currentOrganization._id } : "skip"
  );
  const { data: osDistribution } = useCachedQuery(
    currentOrganization ? `os:${currentOrganization._id}` : 'os:none',
    osDistributionLive
  );

  const allDevicesLive = useQuery(
    api.medicalDevices.getAllMedicalDevices,
    currentOrganization ? { organizationId: currentOrganization._id } : "skip"
  );
  const { data: allDevices } = useCachedQuery(
    currentOrganization ? `devices:${currentOrganization._id}` : 'devices:none',
    allDevicesLive
  );

  const isLoading = currentOrganization && (analytics === undefined || technicianPerformance === undefined || equipmentCriticality === undefined || osDistribution === undefined);

  // Enhanced stats with proper null checking
  const stats = useMemo(() => [
    {
      name: "Total Devices",
      value: analytics?.totalDevices ?? 0,
      icon: Server,
      change: "Real-time",
      changeType: "neutral" as const,
      visible: true,
    },
    {
      name: "Hospitals",
      value: analytics?.totalHospitals ?? 0,
      icon: Building2,
      change: "Active entities",
      changeType: "neutral" as const,
      visible: true,
    },
    {
      name: "Technicians",
      value: analytics?.totalTechnicians ?? 0,
      icon: Users,
      change: `Avg Score: ${analytics?.avgTechnicianScore ?? 0}%`,
      changeType: "neutral" as const,
      visible: true,
    },
    {
      name: "Network Connected",
      value: `${analytics?.networkConnectedPercentage ?? 0}%`,
      icon: Network,
      change: `${analytics?.networkConnectedDevices ?? 0} of ${analytics?.totalDevices ?? 0} devices`,
      changeType: "neutral" as const,
      visible: true,
    },
    {
      name: "Critical Alerts",
      value: analytics?.criticalAlerts ?? 0,
      icon: AlertTriangle,
      change: "Live monitoring",
      changeType: "neutral" as const,
      visible: true,
    },
    {
      name: "PHI Devices",
      value: analytics?.phiDevices ?? 0,
      icon: Shield,
      change: `${Math.round(((analytics?.phiDevices ?? 0) / (analytics?.totalDevices || 1)) * 100)}% of total`,
      changeType: "neutral" as const,
      visible: true,
    },
    {
      name: "Legacy OS Devices",
      value: analytics?.legacyOSDevices ?? 0,
      icon: Activity,
      change: "Security risk",
      changeType: "neutral" as const,
      visible: true,
    },
    {
      name: "Data Quality Score",
      value: `${analytics?.dataCollectionScore ?? 0}%`,
      icon: BarChart3,
      change: (analytics?.dataCollectionScore ?? 0) >= 80 ? "Excellent" : "Improving",
      changeType: "neutral" as const,
      visible: true,
    },
  ], [analytics]);

  // Memoized chart data with proper null checking
  const technicianChartData = useMemo(() => {
    return technicianPerformance?.slice(0, 5).map((tech: any) => ({
      name: tech.name,
      score: tech.avgScore
    })) ?? [];
  }, [technicianPerformance]);

  const criticalityChartData = useMemo(() => {
    return equipmentCriticality?.slice(0, 5).map((hospital: any) => ({
      name: hospital.name,
      Critical: hospital.critical,
      High: hospital.high,
      Medium: hospital.medium,
      Low: hospital.low,
      'Network Only': hospital.networkOnly,
      Total: hospital.total
    })) ?? [];
  }, [equipmentCriticality]);

  const osChartData = useMemo(() => {
    return osDistribution?.filter((os: any) => os.type === 'manufacturer').slice(0, 8).map((os: any) => ({
      name: os.name,
      count: os.count
    })) ?? [];
  }, [osDistribution]);

  // Category risk filters
  const [catFilters, setCatFilters] = useState({
    category: 'all',
    manufacturer: 'all',
    classification: 'all',
    network: 'all',
    phi: 'all',
    search: ''
  });
  const catOptions = useMemo(() => {
    const devices = allDevices || [];
    return {
      categories: Array.from(new Set(devices.map((d: any) => d.category).filter(Boolean))).sort(),
      manufacturers: Array.from(new Set(devices.map((d: any) => d.manufacturer).filter(Boolean))).sort(),
      classifications: Array.from(new Set(devices.map((d: any) => d.classification).filter(Boolean))).sort(),
    };
  }, [allDevices]);
  const filteredDevicesForCat = useMemo(() => {
    const devices = (allDevices || []) as any[];
    return devices.filter(d => {
      if (catFilters.search) {
        const s = catFilters.search.toLowerCase();
        const matches = [d.name, d.entity, d.manufacturer, d.model, d.category, d.ipAddress].filter(Boolean).some((v: string) => v.toLowerCase().includes(s));
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
    const map: Record<string, { Critical: number; High: number; Medium: number; Low: number; 'Network Only': number; total: number }> = {};
    filteredDevicesForCat.forEach(d => {
      const key = d.category || 'Unknown';
      if (!map[key]) map[key] = { Critical: 0, High: 0, Medium: 0, Low: 0, 'Network Only': 0, total: 0 };
      const cat = (d.customerPHICategory || d.classification || '').toLowerCase();
      if (cat.includes('critical')) map[key].Critical++;
      else if (cat.includes('high')) map[key].High++;
      else if (cat.includes('medium')) map[key].Medium++;
      else if (cat.includes('low')) map[key].Low++;
      else if (d.deviceOnNetwork && !d.hasPHI) map[key]['Network Only']++;
      else map[key].Low++;
      map[key].total++;
    });
    return Object.entries(map).map(([name, v]) => ({ name, Critical: v.Critical, High: v.High, Medium: v.Medium, Low: v.Low, 'Network Only': v['Network Only'] }));
  }, [filteredDevicesForCat]);

  // PHI Risk Distribution Chart Data with null checking
  const phiRiskData = useMemo(() => {
    if (!analytics?.phiRiskDistribution) return [];
    return [
      { name: "Critical", value: analytics.phiRiskDistribution.critical ?? 0, color: "#DC2626" },
      { name: "High", value: analytics.phiRiskDistribution.high ?? 0, color: "#EA580C" },
      { name: "Medium", value: analytics.phiRiskDistribution.medium ?? 0, color: "#D97706" },
      { name: "Low", value: analytics.phiRiskDistribution.low ?? 0, color: "#65A30D" }
    ].filter(item => item.value > 0);
  }, [analytics?.phiRiskDistribution]);

  // Add the missing data transformations with correct structure
  const hospitalChartData = useMemo(() => {
    return equipmentCriticality?.map((hospital: any, index: number) => ({
      name: hospital.name,
      count: (hospital.Critical || 0) + (hospital.High || 0) + (hospital.Medium || 0) + (hospital.Low || 0) + (hospital['Network Only'] || 0),
      color: COLORS[index % COLORS.length]
    })) ?? [];
  }, [equipmentCriticality]);

  const deviceTypesData = useMemo(() => {
    // Mock data for device types with correct structure
    return [
      { type: 'Medical Devices', count: analytics?.totalDevices ? Math.floor(analytics.totalDevices * 0.4) : 0, risk: 'high' as const },
      { type: 'Network Equipment', count: analytics?.totalDevices ? Math.floor(analytics.totalDevices * 0.3) : 0, risk: 'medium' as const },
      { type: 'Workstations', count: analytics?.totalDevices ? Math.floor(analytics.totalDevices * 0.2) : 0, risk: 'low' as const },
      { type: 'Mobile Devices', count: analytics?.totalDevices ? Math.floor(analytics.totalDevices * 0.1) : 0, risk: 'low' as const }
    ];
  }, [analytics?.totalDevices]);

  const osVersionsData = useMemo(() => {
    return osDistribution?.filter((os: any) => os.type === 'version').slice(0, 10).map((os: any) => ({
      version: os.name,
      count: os.count,
      supported: true // You can add logic to determine if the OS version is supported
    })) ?? [];
  }, [osDistribution]);

  const ownershipStats = useMemo(() => {
    const stats = new Map<string, { name: string; count: number; highRisk: number; inactive: boolean; id: string }>();
    let unassigned = 0;

    allDevices?.forEach((d: any) => {
      if (!d.ownerId) {
        unassigned++;
        return;
      }
      
      if (!stats.has(d.ownerId)) {
        stats.set(d.ownerId, {
          id: d.ownerId,
          name: d.ownerName || 'Unknown',
          count: 0,
          highRisk: 0,
          inactive: false 
        });
      }
      
      const entry = stats.get(d.ownerId)!;
      entry.count++;
      
      const risk = (d.riskScore || 0);
      const classification = (d.classification || '').toLowerCase();
      if (risk >= 70 || classification.includes('critical') || classification.includes('high')) {
        entry.highRisk++;
      }
      
      if (d.owner?.lastLogin) {
         const threeWeeksAgo = Date.now() - (21 * 24 * 60 * 60 * 1000);
         if (d.owner.lastLogin < threeWeeksAgo) {
             entry.inactive = true;
         }
      }
    });

    return {
      owners: Array.from(stats.values()).sort((a, b) => b.count - a.count),
      unassigned
    };
  }, [allDevices]);

  const [visibleStatNames, setVisibleStatNames] = useState<string[]>([]);
  const [visibleSections, setVisibleSections] = useState({
    phiRisk: true,
    network: true,
    tech: true,
    os: true,
    ownership: true,
    criticality: false,
    distribution: false,
  });

  useEffect(() => {
    const savedStats = typeof window !== "undefined" ? localStorage.getItem("dashboard:visibleStats") : null;
    const savedSections = typeof window !== "undefined" ? localStorage.getItem("dashboard:visibleSections") : null;
    if (savedStats) setVisibleStatNames(JSON.parse(savedStats));
    if (savedSections) setVisibleSections(JSON.parse(savedSections));
  }, []);

  useEffect(() => {
    if (!visibleStatNames.length) setVisibleStatNames(stats.map(s => s.name));
  }, [stats]);

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("dashboard:visibleStats", JSON.stringify(visibleStatNames));
  }, [visibleStatNames]);

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("dashboard:visibleSections", JSON.stringify(visibleSections));
  }, [visibleSections]);

  const visibleStats = useMemo(() => stats.filter(stat => visibleStatNames.includes(stat.name)), [stats, visibleStatNames]);
  const initialStatsLayouts = (() => {
    const key = currentOrganization ? `overview-stats-layout:${currentOrganization._id}` : 'overview-stats-layout:none';
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
      if (raw) return normalizeStatLayouts(JSON.parse(raw) as { [key: string]: Layout[] });
    } catch {}
    const lg = [
      { i: 'stat:Total Devices', x: 0, y: 0, w: 3, h: 3, minW: 3, minH: 3 },
      { i: 'stat:Hospitals', x: 3, y: 0, w: 3, h: 3, minW: 3, minH: 3 },
      { i: 'stat:Technicians', x: 6, y: 0, w: 3, h: 3, minW: 3, minH: 3 },
      { i: 'stat:Network Connected', x: 9, y: 0, w: 3, h: 3, minW: 3, minH: 3 },
      { i: 'stat:Critical Alerts', x: 0, y: 3, w: 3, h: 3, minW: 3, minH: 3 },
      { i: 'stat:PHI Devices', x: 3, y: 3, w: 3, h: 3, minW: 3, minH: 3 },
      { i: 'stat:Legacy OS Devices', x: 6, y: 3, w: 3, h: 3, minW: 3, minH: 3 },
      { i: 'stat:Data Quality Score', x: 9, y: 3, w: 3, h: 3, minW: 3, minH: 3 },
    ];
    const copy = (arr: Layout[]) => arr.map(l => ({ ...l }));
    return {
      lg,
      md: copy(lg),
      sm: copy(lg),
      xs: copy(lg),
      xxs: copy(lg),
    } as { [key: string]: Layout[] };
  })();
  const [statsLayouts, setStatsLayouts] = useState<{ [key: string]: Layout[] }>(initialStatsLayouts);
  useEffect(() => {
    const key = currentOrganization ? `overview-stats-layout:${currentOrganization._id}` : 'overview-stats-layout:none';
    try {
      if (typeof window !== 'undefined') localStorage.setItem(key, JSON.stringify(statsLayouts));
    } catch {}
  }, [statsLayouts, currentOrganization]);

  const [statSheetOpen, setStatSheetOpen] = useState(false);
  const [selectedStat, setSelectedStat] = useState<any | null>(null);

  // Fix: Show empty state when no organization is selected
  if (!currentOrganization) {
    return (
      <div className="space-y-6">
        <div className="bg-card overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6 text-center">
            <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">
              No Organization Selected
            </h3>
            <p className="text-sm text-gray-500">
              Please select an organization to view dashboard analytics and device information.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-80 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Overview</h2>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Customize</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Cards</DropdownMenuLabel>
            {stats.map(s => (
              <DropdownMenuCheckboxItem
                key={s.name}
                checked={visibleStatNames.includes(s.name)}
                onCheckedChange={(checked) => {
                  setVisibleStatNames(prev => checked ? Array.from(new Set([...prev, s.name])) : prev.filter(n => n !== s.name));
                }}
              >
                {s.name}
              </DropdownMenuCheckboxItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Sections</DropdownMenuLabel>
            <DropdownMenuCheckboxItem
              checked={visibleSections.phiRisk}
              onCheckedChange={(c) => setVisibleSections(v => ({ ...v, phiRisk: !!c }))}
            >
              PHI Risk
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleSections.network}
              onCheckedChange={(c) => setVisibleSections(v => ({ ...v, network: !!c }))}
            >
              Network Connectivity
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleSections.tech}
              onCheckedChange={(c) => setVisibleSections(v => ({ ...v, tech: !!c }))}
            >
              Technician Performance
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleSections.os}
              onCheckedChange={(c) => setVisibleSections(v => ({ ...v, os: !!c }))}
            >
              OS Distribution
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleSections.ownership}
              onCheckedChange={(c) => setVisibleSections(v => ({ ...v, ownership: !!c }))}
            >
              Device Ownership
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleSections.criticality}
              onCheckedChange={(c) => setVisibleSections(v => ({ ...v, criticality: !!c }))}
            >
              Criticality Heatmap
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={visibleSections.distribution}
              onCheckedChange={(c) => setVisibleSections(v => ({ ...v, distribution: !!c }))}
            >
              Device Distribution
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {visibleStats.map((stat) => (
          <StatsCard key={`stat:${stat.name}`} stat={stat} onClick={() => {
            const qp = new URLSearchParams();
            if (stat.name === 'Network Connected') { qp.set('tab','devices'); qp.set('network','connected'); }
            else if (stat.name === 'PHI Devices') { qp.set('tab','risk'); }
            else if (stat.name === 'Critical Alerts') { qp.set('tab','alerts'); }
            else if (stat.name === 'Legacy OS Devices') { qp.set('tab','risk'); }
            else if (stat.name === 'Total Devices') { qp.set('tab','devices'); }
            else if (stat.name === 'Hospitals') { qp.set('tab','risk'); }
            else { qp.set('tab','overview'); }
            router.push(`/dashboard?${qp.toString()}`);
          }} />
        ))}
      </div>

      

      {/* Rigid layout: editing controls removed */}

      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        onLayoutChange={(layout, all) => setLayouts(normalizeSectionLayouts(all))}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={48}
        compactType="vertical"
        preventCollision={true}
        isBounded
        containerPadding={[16, 16]}
        isDraggable={false}
        isResizable={false}
        margin={[16, 16]}
        useCSSTransforms={false}
      >
        {visibleSections.phiRisk && (
          <div key="phi" className="h-full">
            <PHIRiskDistributionChart data={phiRiskData} />
          </div>
        )}
        {visibleSections.network && (
          <div key="network" className="h-full">
            <NetworkConnectivityChart 
              connected={analytics?.networkConnectedDevices ?? 0}
              total={analytics?.totalDevices ?? 0}
              percentage={analytics?.networkConnectedPercentage ?? 0}
            />
          </div>
        )}
        {visibleSections.tech && (
          <div key="tech" className="h-full">
            <TechnicianPerformanceChart data={technicianChartData} />
          </div>
        )}
        {visibleSections.os && (
          <div key="os" className="h-full">
            <OSDistributionChart data={osChartData} colors={COLORS} />
          </div>
        )}
        {visibleSections.ownership && (
          <div key="ownership" className="h-full">
            <DeviceOwnershipCard data={ownershipStats} />
          </div>
        )}
        {visibleSections.criticality && (
          <div key="criticality" className="h-full">
            <CriticalityChart data={criticalityChartData} />
          </div>
        )}
        {visibleSections.distribution && (
          <div key="distribution" className="h-full">
            <DeviceDistribution 
              hospitalData={hospitalChartData}
              deviceTypes={deviceTypesData}
              osVersions={osVersionsData}
            />
          </div>
        )}
      </ResponsiveGridLayout>

      
    </div>
  );
}

// PHI Risk Distribution Chart
const PHIRiskDistributionChart = memo(({ data }: { data: Array<{ name: string, value: number, color: string }> }) => {
  const router = useRouter();
  return (
  <Card className="h-full overflow-hidden cursor-pointer" onClick={() => router.push('/dashboard?tab=risk')}>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Shield className="h-5 w-5" />
        PHI Risk Distribution
      </CardTitle>
      <CardDescription>
        Patient data security risk levels
      </CardDescription>
    </CardHeader>
    <CardContent className="h-full">
      <div className="h-full">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsPieChart>
            <defs>
              <linearGradient id="phi-critical" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#DC2626" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#DC2626" stopOpacity={0.6} />
              </linearGradient>
              <linearGradient id="phi-high" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#EA580C" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#EA580C" stopOpacity={0.6} />
              </linearGradient>
              <linearGradient id="phi-medium" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#D97706" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#D97706" stopOpacity={0.6} />
              </linearGradient>
              <linearGradient id="phi-low" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#65A30D" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#65A30D" stopOpacity={0.6} />
              </linearGradient>
            </defs>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
              innerRadius={50}
              outerRadius={92}
              paddingAngle={3}
              stroke="var(--card)"
              strokeWidth={2}
              isAnimationActive={false}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.name === 'Critical' ? 'url(#phi-critical)' : entry.name === 'High' ? 'url(#phi-high)' : entry.name === 'Medium' ? 'url(#phi-medium)' : 'url(#phi-low)'} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: 'var(--popover)', borderColor: 'var(--border)', color: 'var(--popover-foreground)', borderRadius: 12 }} cursor={{ fill: 'transparent' }} />
            <Legend wrapperStyle={{ color: 'var(--muted-foreground)' }} iconType="circle" />
          </RechartsPieChart>
        </ResponsiveContainer>
      </div>
    </CardContent>
  </Card>
)});
PHIRiskDistributionChart.displayName = 'PHIRiskDistributionChart';

// Network Connectivity Chart
const NetworkConnectivityChart = memo(({ connected, total, percentage }: { connected: number, total: number, percentage: number }) => {
  const router = useRouter();
  return (
  <Card className="h-full overflow-hidden cursor-pointer" onClick={() => {
    const qp = new URLSearchParams();
    qp.set('tab','devices');
    qp.set('network','connected');
    router.push(`/dashboard?${qp.toString()}`);
  }}>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Network className="h-5 w-5" />
        Network Connectivity
      </CardTitle>
      <CardDescription>
        Device network connection status
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Connected Devices</span>
          <span className="text-2xl font-bold">{percentage}%</span>
        </div>
        <Progress value={percentage} className="w-full" />
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="text-center p-4 rounded-xl border bg-card/60">
            <Wifi className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{connected}</p>
            <p className="text-sm text-muted-foreground">Connected</p>
          </div>
          <div className="text-center p-4 rounded-xl border bg-card/60">
            <WifiOff className="h-8 w-8 text-gray-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{total - connected}</p>
            <p className="text-sm text-muted-foreground">Offline</p>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
)});
NetworkConnectivityChart.displayName = 'NetworkConnectivityChart';

// Enhanced Technician Performance Chart with more detailed metrics
const TechnicianPerformanceChart = memo(({ data }: { data: Array<{name: string, score: number, workload?: number, compliance?: number, riskMitigation?: number}> }) => (
  <Card className="h-full overflow-hidden">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
        <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
        <span className="hidden sm:inline">Enhanced Data Collection Performance</span>
        <span className="sm:hidden">Performance</span>
      </CardTitle>
      <CardDescription className="text-sm">
        Comprehensive technician performance metrics with detailed breakdown
      </CardDescription>
    </CardHeader>
    <CardContent className="h-full">
      <div className="h-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis 
              dataKey="name" 
              fontSize={12}
              tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis domain={[0, 100]} fontSize={12} tick={{ fill: 'var(--muted-foreground)' }} />
            <Tooltip 
              formatter={(value, name) => {
                const labels = {
                  score: 'Overall Score',
                  workload: 'Workload Score',
                  compliance: 'Compliance Score',
                  riskMitigation: 'Risk Mitigation'
                };
                return [`${value}%`, labels[name as keyof typeof labels] || name];
              }}
              contentStyle={{ backgroundColor: 'var(--popover)', borderColor: 'var(--border)', color: 'var(--popover-foreground)', borderRadius: 12 }}
            />
            <Legend wrapperStyle={{ color: 'var(--muted-foreground)' }} />
            <defs>
              <linearGradient id="perf-overall" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.6} />
              </linearGradient>
              <linearGradient id="perf-workload" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#10B981" stopOpacity={0.6} />
              </linearGradient>
              <linearGradient id="perf-compliance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity={0.6} />
              </linearGradient>
              <linearGradient id="perf-risk" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#EF4444" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#EF4444" stopOpacity={0.6} />
              </linearGradient>
            </defs>
            <Bar dataKey="score" name="Overall Score" isAnimationActive={false} fill="url(#perf-overall)" radius={[10, 10, 10, 10]} barSize={26} />
            <Bar dataKey="workload" name="Workload" isAnimationActive={false} fill="url(#perf-workload)" radius={[10, 10, 10, 10]} barSize={26} />
            <Bar dataKey="compliance" name="Compliance" isAnimationActive={false} fill="url(#perf-compliance)" radius={[10, 10, 10, 10]} barSize={26} />
            <Bar dataKey="riskMitigation" name="Risk Mitigation" isAnimationActive={false} fill="url(#perf-risk)" radius={[10, 10, 10, 10]} barSize={26} />
          </BarChart>
        </ResponsiveContainer>
      </div>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="text-center p-2 rounded-lg border bg-card/50">
          <p className="text-sm font-medium text-blue-900">Avg Overall</p>
          <p className="text-lg font-bold text-blue-600">
            {data.length > 0 ? Math.round(data.reduce((sum, d) => sum + d.score, 0) / data.length) : 0}%
          </p>
        </div>
        <div className="text-center p-2 rounded-lg border bg-card/50">
          <p className="text-sm font-medium text-green-900">Avg Workload</p>
          <p className="text-lg font-bold text-green-600">
            {data.length > 0 ? Math.round(data.reduce((sum, d) => sum + (d.workload || 0), 0) / data.length) : 0}%
          </p>
        </div>
        <div className="text-center p-2 rounded-lg border bg-card/50">
          <p className="text-sm font-medium text-yellow-900">Avg Compliance</p>
          <p className="text-lg font-bold text-yellow-600">
            {data.length > 0 ? Math.round(data.reduce((sum, d) => sum + (d.compliance || 0), 0) / data.length) : 0}%
          </p>
        </div>
        <div className="text-center p-2 rounded-lg border bg-card/50">
          <p className="text-sm font-medium text-red-900">Risk Mitigation</p>
          <p className="text-lg font-bold text-red-600">
            {data.length > 0 ? Math.round(data.reduce((sum, d) => sum + (d.riskMitigation || 0), 0) / data.length) : 0}%
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
));
TechnicianPerformanceChart.displayName = 'TechnicianPerformanceChart';

const OSDistributionChart = memo(({ data, colors }: { data: Array<{name: string, count: number}>, colors: string[] }) => (
  <Card className="h-full overflow-hidden">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <PieChart className="h-5 w-5" />
        Operating System Distribution
      </CardTitle>
      <CardDescription>
        Device count by OS manufacturer
      </CardDescription>
    </CardHeader>
    <CardContent className="h-full">
      <div className="h-full">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsPieChart>
            <defs>
              {colors.slice(0, 5).map((c, i) => (
                <linearGradient key={`os-${i}`} id={`os-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={c} stopOpacity={0.9} />
                  <stop offset="100%" stopColor={c} stopOpacity={0.6} />
                </linearGradient>
              ))}
            </defs>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
              innerRadius={50}
              outerRadius={90}
              stroke="var(--card)"
              strokeWidth={2}
              isAnimationActive={false}
              dataKey="count"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={`url(#os-${index % 5})`} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: 'var(--popover)', borderColor: 'var(--border)', color: 'var(--popover-foreground)', borderRadius: 12 }} cursor={{ fill: 'transparent' }} />
            <Legend wrapperStyle={{ color: 'var(--muted-foreground)' }} iconType="circle" />
          </RechartsPieChart>
        </ResponsiveContainer>
      </div>
    </CardContent>
  </Card>
));
OSDistributionChart.displayName = 'OSDistributionChart';

const CriticalityChart = memo(({ data }: { data: Array<{name: string, Critical: number, High: number, Medium: number, Low: number, 'Network Only': number}> }) => {
  // Calculate risk percentages for color intensity
  const processedData = data.map(hospital => {
    const total = hospital.Critical + hospital.High + hospital.Medium + hospital.Low + hospital['Network Only'];
    return {
      name: hospital.name,
      Critical: { count: hospital.Critical, percentage: total > 0 ? (hospital.Critical / total) * 100 : 0 },
      High: { count: hospital.High, percentage: total > 0 ? (hospital.High / total) * 100 : 0 },
      Medium: { count: hospital.Medium, percentage: total > 0 ? (hospital.Medium / total) * 100 : 0 },
      Low: { count: hospital.Low, percentage: total > 0 ? (hospital.Low / total) * 100 : 0 },
      'Network Only': { count: hospital['Network Only'], percentage: total > 0 ? (hospital['Network Only'] / total) * 100 : 0 },
      total
    };
  });

  const getRiskColor = (level: string, percentage: number) => {
    const intensity = Math.min(percentage / 50, 1); // Normalize to 0-1, with 50% being full intensity
    
    switch (level) {
      case 'Critical':
        return `rgba(220, 38, 38, ${0.2 + intensity * 0.8})`; // Red with varying opacity
      case 'High':
        return `rgba(234, 88, 12, ${0.2 + intensity * 0.8})`; // Orange
      case 'Medium':
        return `rgba(217, 119, 6, ${0.2 + intensity * 0.8})`; // Amber
      case 'Low':
        return `rgba(101, 163, 13, ${0.2 + intensity * 0.8})`; // Green
      case 'Network Only':
        return `rgba(8, 145, 178, ${0.2 + intensity * 0.8})`; // Blue
      default:
        return 'rgba(156, 163, 175, 0.2)';
    }
  };

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Equipment Criticality Heatmap
        </CardTitle>
        <CardDescription>
          Risk distribution across healthcare entities
        </CardDescription>
      </CardHeader>
      <CardContent className="h-full">
        <div className="space-y-4">
          {/* Heatmap Grid */}
          <div className="overflow-x-auto">
            <div className="min-w-full">
              {/* Header Row */}
              <div className="grid grid-cols-6 gap-1 mb-2">
                <div className="text-xs font-medium text-gray-600 p-2">Hospital</div>
                <div className="text-xs font-medium text-gray-600 p-2 text-center">Critical</div>
                <div className="text-xs font-medium text-gray-600 p-2 text-center">High</div>
                <div className="text-xs font-medium text-gray-600 p-2 text-center">Medium</div>
                <div className="text-xs font-medium text-gray-600 p-2 text-center">Low</div>
                <div className="text-xs font-medium text-gray-600 p-2 text-center">Network Only</div>
              </div>
              
              {/* Heatmap Rows */}
              {processedData.map((hospital, index) => {
                const riskLevels = ['Critical', 'High', 'Medium', 'Low', 'Network Only'] as const;
                
                return (
                  <div key={index} className="grid grid-cols-6 gap-1 mb-1">
                    {/* Hospital Name */}
                    <div className="text-xs font-medium p-2 bg-gray-50 rounded flex items-center">
                      <span className="truncate" title={hospital.name}>{hospital.name}</span>
                    </div>
                    
                    {/* Risk Level Cells */}
                    {riskLevels.map((level) => {
                      const data = hospital[level];
                      return (
                        <div
                          key={level}
                          className="p-2 rounded text-center border transition-all duration-200 hover:scale-105 cursor-pointer"
                          style={{
                            backgroundColor: getRiskColor(level, data.percentage),
                            borderColor: data.count > 0 ? getRiskColor(level, 100).replace('0.2 + intensity * 0.8', '0.8') : '#e5e7eb'
                          }}
                          title={`${level}: ${data.count} devices (${data.percentage.toFixed(1)}%)`}
                        >
                          <div className="text-xs font-bold text-gray-900">{data.count}</div>
                          <div className="text-xs text-gray-600">{data.percentage.toFixed(0)}%</div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Color Legend */}
          <div className="flex flex-wrap items-center gap-4 pt-4 border-t">
            <span className="text-xs font-medium text-gray-600">Risk Levels:</span>
            {[
              { name: 'Critical', color: '#DC2626' },
              { name: 'High', color: '#EA580C' },
              { name: 'Medium', color: '#D97706' },
              { name: 'Low', color: '#65A30D' },
              { name: 'Network Only', color: '#0891B2' }
            ].map((item) => (
              <div key={item.name} className="flex items-center gap-1">
                <div 
                  className="w-3 h-3 rounded" 
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="text-xs text-gray-600">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
CriticalityChart.displayName = 'CriticalityChart';

const StatsCard = memo(({ stat, onClick }: { stat: any, onClick?: () => void }) => {
  const Icon = stat.icon;
  return (
    <Card 
      className="h-full overflow-hidden cursor-pointer hover:shadow-md hover:bg-muted/50 border rounded-xl"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick && onClick(); }}
      aria-label={`View details for ${stat.name}`}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{stat.name}</p>
            <p className="text-2xl font-bold">{stat.value}</p>
          </div>
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Icon className="h-6 w-6 text-primary" />
            </div>
          </div>
        </div>
        <div className="mt-4">
          <span className="text-sm text-muted-foreground">{stat.change}</span>
        </div>
      </CardContent>
    </Card>
  );
});
StatsCard.displayName = 'StatsCard';

// Device Ownership Card
const DeviceOwnershipCard = memo(({ data }: { data: { owners: Array<{ name: string; count: number; highRisk: number; inactive: boolean; id: string }>; unassigned: number } }) => {
  const router = useRouter();
  
  return (
    <Card className="h-full overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Device Ownership
        </CardTitle>
        <CardDescription>
          Staff workload and risk distribution
        </CardDescription>
      </CardHeader>
      <CardContent className="h-full overflow-y-auto pr-2">
        <div className="space-y-4">
          {data.owners.slice(0, 5).map((owner) => (
            <div key={owner.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="font-medium text-sm">{owner.name}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <span>{owner.count} devices</span>
                    {owner.highRisk > 0 && (
                      <span className="text-orange-500 font-medium flex items-center gap-1">
                        · {owner.highRisk} high-risk
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {owner.inactive && (
                 <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-600 bg-yellow-50">
                    Inactive
                 </Badge>
              )}
            </div>
          ))}
          
          <div 
             className="flex items-center justify-between p-2 rounded-lg bg-red-50 border border-red-100 cursor-pointer hover:bg-red-100 transition-colors"
             onClick={() => router.push('/dashboard?tab=devices&owner=unassigned')}
          >
            <div className="flex items-center gap-3">
              <div className="bg-red-100 p-2 rounded-full">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <div className="font-medium text-sm text-red-900">Unassigned Devices</div>
                <div className="text-xs text-red-700">{data.unassigned} devices require attention</div>
              </div>
            </div>
             <Button size="sm" variant="ghost" className="h-7 text-red-700 hover:text-red-800 hover:bg-red-200">
                Review
             </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
DeviceOwnershipCard.displayName = 'DeviceOwnershipCard';
