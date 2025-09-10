"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useMemo, memo } from "react";
import {
  Server,
  Users,
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
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
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
import { DeviceDistribution } from './charts/device-distribution';
import { CustomizableDashboard } from './customizable-dashboard';

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

  // Separate queries for each data type
  const analytics = useQuery(
    api.medicalDevices.getDashboardAnalytics,
    currentOrganization ? { organizationId: currentOrganization._id } : "skip"
  );
  
  const technicianPerformance = useQuery(
    api.medicalDevices.getTechnicianPerformance,
    currentOrganization ? { organizationId: currentOrganization._id } : "skip"
  );
  
  const equipmentCriticality = useQuery(
    api.medicalDevices.getEquipmentCriticalityByHospital,
    currentOrganization ? { organizationId: currentOrganization._id } : "skip"
  );
  
  const osDistribution = useQuery(
    api.medicalDevices.getOperatingSystemDistribution,
    currentOrganization ? { organizationId: currentOrganization._id } : "skip"
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

  const visibleStats = useMemo(() => stats.filter(stat => stat.visible), [stats]);

  // Fix: Show empty state when no organization is selected
  if (!currentOrganization) {
    return (
      <div className="space-y-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
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
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {visibleStats.map((stat, index) => (
          <StatsCard key={index} stat={stat} />
        ))}
      </div>

      {/* PHI Risk and Network Connectivity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <PHIRiskDistributionChart data={phiRiskData} />
        <NetworkConnectivityChart 
          connected={analytics?.networkConnectedDevices ?? 0}
          total={analytics?.totalDevices ?? 0}
          percentage={analytics?.networkConnectedPercentage ?? 0}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <TechnicianPerformanceChart data={technicianChartData} />
        <OSDistributionChart data={osChartData} colors={COLORS} />
      </div>

      {/* Full Width Charts */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        <CriticalityChart data={criticalityChartData} />
        <DeviceDistribution 
          hospitalData={hospitalChartData}
          deviceTypes={deviceTypesData}
          osVersions={osVersionsData}
        />
      </div>
    </div>
  );
}

// PHI Risk Distribution Chart
const PHIRiskDistributionChart = memo(({ data }: { data: Array<{name: string, value: number, color: string}> }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Shield className="h-5 w-5" />
        PHI Risk Distribution
      </CardTitle>
      <CardDescription>
        Patient data security risk levels
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
PHIRiskDistributionChart.displayName = 'PHIRiskDistributionChart';

// Network Connectivity Chart
const NetworkConnectivityChart = memo(({ connected, total, percentage }: { connected: number, total: number, percentage: number }) => (
  <Card>
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
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <Wifi className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-900">{connected}</p>
            <p className="text-sm text-green-600">Connected</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <WifiOff className="h-8 w-8 text-gray-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{total - connected}</p>
            <p className="text-sm text-gray-600">Offline</p>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
));
NetworkConnectivityChart.displayName = 'NetworkConnectivityChart';

// Enhanced Technician Performance Chart with more detailed metrics
const TechnicianPerformanceChart = memo(({ data }: { data: Array<{name: string, score: number, workload?: number, compliance?: number, riskMitigation?: number}> }) => (
  <Card>
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
    <CardContent>
      <div className="h-64 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              fontSize={12}
              tick={{ fontSize: 12 }}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis domain={[0, 100]} fontSize={12} />
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
            />
            <Legend />
            <Bar dataKey="score" fill="#3B82F6" name="Overall Score" />
            <Bar dataKey="workload" fill="#10B981" name="Workload" />
            <Bar dataKey="compliance" fill="#F59E0B" name="Compliance" />
            <Bar dataKey="riskMitigation" fill="#EF4444" name="Risk Mitigation" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="text-center p-2 bg-blue-50 rounded-lg">
          <p className="text-sm font-medium text-blue-900">Avg Overall</p>
          <p className="text-lg font-bold text-blue-600">
            {data.length > 0 ? Math.round(data.reduce((sum, d) => sum + d.score, 0) / data.length) : 0}%
          </p>
        </div>
        <div className="text-center p-2 bg-green-50 rounded-lg">
          <p className="text-sm font-medium text-green-900">Avg Workload</p>
          <p className="text-lg font-bold text-green-600">
            {data.length > 0 ? Math.round(data.reduce((sum, d) => sum + (d.workload || 0), 0) / data.length) : 0}%
          </p>
        </div>
        <div className="text-center p-2 bg-yellow-50 rounded-lg">
          <p className="text-sm font-medium text-yellow-900">Avg Compliance</p>
          <p className="text-lg font-bold text-yellow-600">
            {data.length > 0 ? Math.round(data.reduce((sum, d) => sum + (d.compliance || 0), 0) / data.length) : 0}%
          </p>
        </div>
        <div className="text-center p-2 bg-red-50 rounded-lg">
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
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <PieChart className="h-5 w-5" />
        Operating System Distribution
      </CardTitle>
      <CardDescription>
        Device count by OS manufacturer
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
              dataKey="count"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Equipment Criticality Heatmap
        </CardTitle>
        <CardDescription>
          Risk distribution across healthcare entities
        </CardDescription>
      </CardHeader>
      <CardContent>
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

const StatsCard = memo(({ stat }: { stat: any }) => {
  const Icon = stat.icon;
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{stat.name}</p>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Icon className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="mt-4 flex items-center">
          <span className="text-sm text-gray-500">{stat.change}</span>
        </div>
      </CardContent>
    </Card>
  );
});
StatsCard.displayName = 'StatsCard';