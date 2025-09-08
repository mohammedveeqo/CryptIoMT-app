"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Server,
  Users,
  AlertTriangle,
  Shield,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useOrganization } from "@/contexts/organization-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Custom hook to conditionally fetch customers
function useCustomersForAdmin(isAdmin: boolean) {
  const customers = useQuery(
    api.users.getAllCustomers,
    isAdmin ? {} : "skip"
  );
  return isAdmin ? customers : [];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C'];

export function DashboardOverview() {
  const currentUser = useQuery(api.users.getCurrentUser);
  const { currentOrganization } = useOrganization();
  
  // Fetch analytics data
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
  
  const userRole = (currentUser && 'role' in currentUser && currentUser.role) ? currentUser.role : "customer";
  const isAdmin = ["super_admin", "admin", "analyst"].includes(userRole);
  
  // Use custom hook that properly handles conditional queries
  const customers = useCustomersForAdmin(isAdmin);

  // Loading state for the entire dashboard
  if (dashboardAnalytics === undefined || technicianPerformance === undefined || 
      equipmentCriticality === undefined || osDistribution === undefined) {
    return (
      <div className="space-y-6">
        {/* Stats Grid Loading */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Loading */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <div className="h-80 flex items-center justify-center">
                <Skeleton className="h-64 w-full" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-28" />
            </CardHeader>
            <CardContent>
              <div className="h-80 flex items-center justify-center">
                <Skeleton className="h-64 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-4 w-36" />
          </CardHeader>
          <CardContent>
            <div className="h-96 flex items-center justify-center">
              <Skeleton className="h-80 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const stats = [
    {
      name: "Total Devices",
      value: dashboardAnalytics?.totalDevices || 0,
      icon: Server,
      change: "+12%",
      changeType: "increase" as const,
      visible: true,
    },
    {
      name: "Critical Alerts",
      value: dashboardAnalytics?.criticalAlerts || 0,
      icon: AlertTriangle,
      change: "-8%",
      changeType: "decrease" as const,
      visible: true,
    },
    {
      name: "PHI Devices",
      value: dashboardAnalytics?.phiDevices || 0,
      icon: Shield,
      change: "+3%",
      changeType: "increase" as const,
      visible: true,
    },
    {
      name: "Data Collection Score",
      value: `${dashboardAnalytics?.dataCollectionScore || 0}%`,
      icon: BarChart3,
      change: "+5%",
      changeType: "increase" as const,
      visible: true,
    },
  ];

  const visibleStats = stats.filter(stat => stat.visible);

  // Prepare chart data
  const technicianChartData = technicianPerformance?.slice(0, 5).map(tech => ({
    name: tech.name,
    score: tech.avgScore
  })) || [];

  const criticalityChartData = equipmentCriticality?.slice(0, 5).map(hospital => ({
    name: hospital.name,
    Critical: hospital.critical,
    High: hospital.high,
    Medium: hospital.medium,
    Low: hospital.low,
    'Network Only': hospital.networkOnly,
    Total: hospital.total
  })) || [];

  const osChartData = osDistribution?.filter(os => os.type === 'manufacturer').slice(0, 8).map(os => ({
    name: os.name,
    count: os.count
  })) || [];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Welcome back, {currentUser?.identity?.name || "User"}!
          </h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>
              {isAdmin 
                ? "Monitor cybersecurity posture and manage risk assessments across all organizations."
                : "View your equipment inventory and security risk assessments."}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {visibleStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Icon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {stat.name}
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          {stat.value}
                        </div>
                        <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                          stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {stat.changeType === 'increase' ? (
                            <TrendingUp className="self-center flex-shrink-0 h-4 w-4 text-green-500" />
                          ) : (
                            <TrendingDown className="self-center flex-shrink-0 h-4 w-4 text-red-500" />
                          )}
                          <span className="ml-1">{stat.change}</span>
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Technician Performance Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Data Collection Avg Score
            </CardTitle>
            <CardDescription>
              Performance metrics by technician
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={technicianChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value) => [`${value}%`, 'Score']} />
                  <Bar dataKey="score" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Operating System Distribution */}
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
                    data={osChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {osChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Equipment Criticality by Hospital */}
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
              <BarChart data={criticalityChartData} layout="horizontal">
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

      {/* Recent Activity */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Recent Activity
          </h3>
          <div className="flow-root">
            <ul className="-mb-8">
              <li className="relative pb-8">
                <div className="relative flex space-x-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500">
                    <Shield className="h-4 w-4 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-gray-500">
                      <span className="font-medium text-gray-900">Risk assessment completed</span>
                      <span className="whitespace-nowrap"> 2 hours ago</span>
                    </div>
                  </div>
                </div>
              </li>
              <li className="relative pb-8">
                <div className="relative flex space-x-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500">
                    <Server className="h-4 w-4 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-gray-500">
                      <span className="font-medium text-gray-900">New equipment data imported</span>
                      <span className="whitespace-nowrap"> 4 hours ago</span>
                    </div>
                  </div>
                </div>
              </li>
              <li className="relative">
                <div className="relative flex space-x-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-500">
                    <AlertTriangle className="h-4 w-4 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-gray-500">
                      <span className="font-medium text-gray-900">Critical alert resolved</span>
                      <span className="whitespace-nowrap"> 6 hours ago</span>
                    </div>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}