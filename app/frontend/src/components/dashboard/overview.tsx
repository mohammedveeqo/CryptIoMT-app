"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useMemo, memo, lazy, Suspense } from "react";
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
} from "lucide-react";
import { useOrganization } from "@/contexts/organization-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
  const customers = useCustomersForAdmin(true);

  const dashboardAnalytics = useQuery(
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

  // Fix: Only show loading when organization exists but data is still loading
  const isLoading = currentOrganization && (dashboardAnalytics === undefined || technicianPerformance === undefined || equipmentCriticality === undefined || osDistribution === undefined);

  // Memoized chart data with proper typing
  const technicianChartData = useMemo(() => {
    return (technicianPerformance as TechnicianData[] | undefined)?.slice(0, 5).map((tech: TechnicianData) => ({
      name: tech.name,
      score: tech.avgScore
    })) || [];
  }, [technicianPerformance]);

  const criticalityChartData = useMemo(() => {
    return (equipmentCriticality as HospitalData[] | undefined)?.slice(0, 5).map((hospital: HospitalData) => ({
      name: hospital.name,
      Critical: hospital.critical,
      High: hospital.high,
      Medium: hospital.medium,
      Low: hospital.low,
      'Network Only': hospital.networkOnly,
      Total: hospital.total
    })) || [];
  }, [equipmentCriticality]);

  const osChartData = useMemo(() => {
    return (osDistribution as OSData[] | undefined)?.filter((os: OSData) => os.type === 'manufacturer').slice(0, 8).map((os: OSData) => ({
      name: os.name,
      count: os.count
    })) || [];
  }, [osDistribution]);

  // Simplified stats without previousPeriod comparison
  const stats = useMemo(() => [
    {
      name: "Total Devices",
      value: dashboardAnalytics?.totalDevices || 0,
      icon: Server,
      change: "Real-time",
      changeType: "neutral" as const,
      visible: true,
    },
    {
      name: "Critical Alerts",
      value: dashboardAnalytics?.criticalAlerts || 0,
      icon: AlertTriangle,
      change: "Live data",
      changeType: "neutral" as const,
      visible: true,
    },
    {
      name: "PHI Devices",
      value: dashboardAnalytics?.phiDevices || 0,
      icon: Shield,
      change: "Current",
      changeType: "neutral" as const,
      visible: true,
    },
    {
      name: "Data Collection Score",
      value: `${dashboardAnalytics?.dataCollectionScore || 0}%`,
      icon: BarChart3,
      change: "Active",
      changeType: "neutral" as const,
      visible: true,
    },
  ], [dashboardAnalytics]);

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
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-80 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Welcome Section */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Welcome to {currentOrganization?.name || 'Your Organization'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Monitor your medical device security and compliance status.
          </p>
        </div>
      </div>
  
      {/* Stats Grid - Mobile Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {visibleStats.map((stat, index) => (
          <StatsCard key={index} stat={stat} />
        ))}
      </div>
  
      {/* Charts Grid - Mobile Responsive */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="order-1">
          <TechnicianPerformanceChart data={technicianChartData} />
        </div>
        <div className="order-2">
          <OSDistributionChart data={osChartData} colors={COLORS} />
        </div>
      </div>
  
      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        <CriticalityChart data={criticalityChartData} />
      </div>
    </div>
  );
}

// Chart Components with proper typing
// Update chart components for mobile
const TechnicianPerformanceChart = memo(({ data }: { data: Array<{name: string, score: number}> }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
        <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
        <span className="hidden sm:inline">Data Collection Avg Score</span>
        <span className="sm:hidden">Avg Score</span>
      </CardTitle>
      <CardDescription className="text-sm">
        Performance metrics by technician
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
            <Tooltip formatter={(value) => [`${value}%`, 'Score']} />
            <Bar dataKey="score" fill="#3B82F6" />
          </BarChart>
        </ResponsiveContainer>
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

const CriticalityChart = memo(({ data }: { data: Array<{name: string, Critical: number, High: number, Medium: number, Low: number, 'Network Only': number}> }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5" />
        Equipment Criticality by Hospital
      </CardTitle>
      <CardDescription>
        Risk distribution across healthcare entities
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={100} />
            <Tooltip />
            <Legend />
            <Bar dataKey="Critical" stackId="a" fill="#DC2626" />
            <Bar dataKey="High" stackId="a" fill="#EA580C" />
            <Bar dataKey="Medium" stackId="a" fill="#D97706" />
            <Bar dataKey="Low" stackId="a" fill="#65A30D" />
            <Bar dataKey="Network Only" stackId="a" fill="#0891B2" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </CardContent>
  </Card>
));
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