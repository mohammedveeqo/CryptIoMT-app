"use client";

import React, { useMemo, Suspense } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Shield, Activity, TrendingUp } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

interface AlertsAndThreatsProps {
  organizationId: Id<"organizations">;
}

// Memoized loading component
const LoadingSpinner = React.memo(() => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
));

// Memoized chart components
const MemoizedPieChart = React.memo(({ data }: { data: any[] }) => (
  <ResponsiveContainer width="100%" height={200}>
    <PieChart>
      <Pie
        data={data}
        cx="50%"
        cy="50%"
        innerRadius={40}
        outerRadius={80}
        paddingAngle={5}
        dataKey="value"
      >
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={entry.color} />
        ))}
      </Pie>
      <Tooltip />
    </PieChart>
  </ResponsiveContainer>
));

const MemoizedBarChart = React.memo(({ data }: { data: any[] }) => (
  <ResponsiveContainer width="100%" height={200}>
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Bar dataKey="score" fill="#ef4444" />
    </BarChart>
  </ResponsiveContainer>
));

function AlertsAndThreats({ organizationId }: AlertsAndThreatsProps) {
  // Simplified useQuery call - Convex handles caching automatically
  const alertsData = useQuery(
    api.alerts.getAlertsAndThreats,
    organizationId ? { organizationId } : "skip"
  );

  // Memoize processed data to prevent recalculation
  const processedData = useMemo(() => {
    if (!alertsData) return null;

    const { alerts, threatScores, summary } = alertsData;
    
    // Ensure threatScores.globalScore is a number
    const globalScore = typeof threatScores.globalScore === 'number' 
      ? threatScores.globalScore 
      : Number(threatScores.globalScore) || 0;

    // Ensure deviceScores is an array
    const deviceScoresArray = Array.isArray(threatScores.deviceScores) 
      ? threatScores.deviceScores 
      : [];

    // Filter alerts by severity with memoization
    const criticalAlerts = alerts?.filter(alert => alert.severity === "Critical") || [];
    const highAlerts = alerts?.filter(alert => alert.severity === "High") || [];
    const mediumAlerts = alerts?.filter(alert => alert.severity === "Medium") || [];
    const lowAlerts = alerts?.filter(alert => alert.severity === "Low") || [];

    // Prepare chart data
    const severityData = [
      { name: "Critical", value: criticalAlerts.length, color: "#dc2626" },
      { name: "High", value: highAlerts.length, color: "#ea580c" },
      { name: "Medium", value: mediumAlerts.length, color: "#d97706" },
      { name: "Low", value: lowAlerts.length, color: "#65a30d" }
    ].filter(item => item.value > 0);

    // Fix: Use only deviceId since deviceName doesn't exist in the data structure
    const topDevicesData = deviceScoresArray
      .slice(0, 5)
      .map(device => ({
        name: device.deviceId || 'Unknown Device',
        score: device.score || 0
      }));

    return {
      alerts,
      globalScore,
      deviceScoresArray,
      criticalAlerts,
      highAlerts,
      mediumAlerts,
      lowAlerts,
      severityData,
      topDevicesData,
      summary
    };
  }, [alertsData]);

  // Show loading only if no data exists
  if (!processedData) {
    return <LoadingSpinner />;
  }

  const {
    alerts,
    globalScore,
    deviceScoresArray,
    criticalAlerts,
    severityData,
    topDevicesData,
    summary
  } = processedData;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Global Threat Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{globalScore.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              {globalScore > 70 ? "High Risk" : globalScore > 40 ? "Medium Risk" : "Low Risk"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{criticalAlerts.length}</div>
            <p className="text-xs text-muted-foreground">Require immediate attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Active security alerts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Devices at Risk</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deviceScoresArray.length}</div>
            <p className="text-xs text-muted-foreground">Monitored devices</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Alert Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className="h-[200px] flex items-center justify-center">Loading chart...</div>}>
              <MemoizedPieChart data={severityData} />
            </Suspense>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Highest Risk Devices</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className="h-[200px] flex items-center justify-center">Loading chart...</div>}>
              <MemoizedBarChart data={topDevicesData} />
            </Suspense>
          </CardContent>
        </Card>
      </div>

      {/* Recent Alerts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {alerts && alerts.length > 0 ? (
              alerts.slice(0, 10).map((alert, index) => (
                <div key={`${alert.deviceId}-${alert.type}-${index}`} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <AlertTriangle className={`h-5 w-5 ${
                      alert.severity === "Critical" ? "text-red-600" :
                      alert.severity === "High" ? "text-orange-600" :
                      alert.severity === "Medium" ? "text-yellow-600" :
                      "text-green-600"
                    }`} />
                    <div>
                      <p className="font-medium">{alert.type}</p>
                      <p className="text-sm text-muted-foreground">{alert.description}</p>
                      <p className="text-xs text-muted-foreground">Device: {alert.deviceId}</p>
                    </div>
                  </div>
                  <Badge variant={alert.severity === "Critical" ? "destructive" : "secondary"}>
                    {alert.severity}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">No alerts found</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default React.memo(AlertsAndThreats);