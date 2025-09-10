"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  Shield,
  Activity,
  Users,
  Building2,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Filter
} from "lucide-react";
import { Alert, AlertSeverity, AlertType } from "@/lib/alert-types";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Id } from "../../../convex/_generated/dataModel";

interface AlertsAndThreatsProps {
  organizationId: Id<"organizations"> | string;
}

const SEVERITY_COLORS = {
  critical: "#dc2626",
  high: "#ea580c",
  medium: "#d97706",
  low: "#65a30d"
};

const SEVERITY_BADGES = {
  critical: "bg-red-100 text-red-800 border-red-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  low: "bg-green-100 text-green-800 border-green-200"
};

export function AlertsAndThreats({ organizationId }: AlertsAndThreatsProps) {
  const [selectedSeverity, setSelectedSeverity] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const alertsData = useQuery(
    api.alerts.getAlertsAndThreats,
    organizationId && organizationId !== '' ? { organizationId: organizationId as Id<"organizations"> } : "skip"
  );

  if (!alertsData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const { alerts, summary, threatScores } = alertsData;

  // Ensure threatScores.globalScore is a number
  const globalScore = Number(threatScores.globalScore) || 0;
  
  // Ensure deviceScores is properly typed
  const deviceScoresArray = Array.isArray(threatScores.deviceScores) 
    ? threatScores.deviceScores 
    : Array.from(threatScores.deviceScores || []);

  // Filter alerts based on selected filters
  const filteredAlerts = alerts.filter((alert: Alert) => {
    const severityMatch = selectedSeverity === "all" || alert.severity === selectedSeverity;
    const statusMatch = selectedStatus === "all" || 
      (selectedStatus === "resolved" && alert.isResolved) ||
      (selectedStatus === "unresolved" && !alert.isResolved);
    return severityMatch && statusMatch;
  });

  // Prepare chart data
  const severityData = [
    { name: "Critical", value: summary.criticalAlerts, color: SEVERITY_COLORS.critical },
    { name: "High", value: summary.highAlerts, color: SEVERITY_COLORS.high },
    { name: "Medium", value: summary.mediumAlerts, color: SEVERITY_COLORS.medium },
    { name: "Low", value: summary.lowAlerts, color: SEVERITY_COLORS.low }
  ].filter(item => item.value > 0);

  const trendData = summary.trendData || [];

  const formatAlertType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatTimestamp = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalAlerts}</div>
            <p className="text-xs text-gray-600">
              {summary.newAlertsToday} new today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summary.criticalAlerts}</div>
            <p className="text-xs text-gray-600">
              Require immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Devices Affected</CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.devicesAffected}</div>
            <p className="text-xs text-gray-600">
              Across {summary.hospitalsAffected} locations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolution Time</CardTitle>
            <Clock className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.averageResolutionTime}h</div>
            <p className="text-xs text-gray-600">
              Average resolution time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="alerts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="alerts">Active Alerts</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="threats">Threat Scores</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            
            <select 
              value={selectedSeverity} 
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <select 
              value={selectedStatus} 
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Status</option>
              <option value="unresolved">Unresolved</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          {/* Alerts Table */}
          <Card>
            <CardHeader>
              <CardTitle>Security Alerts ({filteredAlerts.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Severity</TableHead>
                    <TableHead>Alert Type</TableHead>
                    <TableHead>Device</TableHead>
                    <TableHead>Technician</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAlerts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        No alerts found matching the selected filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAlerts.map((alert: Alert) => (
                      <TableRow key={alert.id}>
                        <TableCell>
                          <Badge className={SEVERITY_BADGES[alert.severity as keyof typeof SEVERITY_BADGES]}>
                            {alert.severity.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatAlertType(alert.type)}
                        </TableCell>
                        <TableCell>{alert.deviceName || 'Unknown Device'}</TableCell>
                        <TableCell>{alert.technician || 'Unassigned'}</TableCell>
                        <TableCell>{formatTimestamp(alert.timestamp)}</TableCell>
                        <TableCell>
                          {alert.isResolved ? (
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Resolved
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800 border-red-200">
                              <XCircle className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline">
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Severity Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Alert Severity Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={severityData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {severityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Alert Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Alert Trends (Last 7 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="threats" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Global Threat Score */}
            <Card>
              <CardHeader>
                <CardTitle>Global Threat Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold text-red-600 mb-2">
                    {globalScore}
                  </div>
                  <p className="text-sm text-gray-600">Organization Risk Level</p>
                  <Badge className="mt-2 bg-red-100 text-red-800 border-red-200">
                    {globalScore > 100 ? 'Critical' : 
                     globalScore > 50 ? 'High' : 
                     globalScore > 20 ? 'Medium' : 'Low'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Top Threat Devices */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Highest Risk Devices</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {deviceScoresArray
                    .sort((a: any, b: any) => (Number(b.score) || 0) - (Number(a.score) || 0))
                    .slice(0, 5)
                    .map((device: any, index: number) => (
                      <div key={device.deviceId || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{device.deviceId || 'Unknown Device'}</p>
                          <p className="text-sm text-gray-600">Device ID</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-red-600">{Number(device.score) || 0}</p>
                          <p className="text-xs text-gray-500">Threat Score</p>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}