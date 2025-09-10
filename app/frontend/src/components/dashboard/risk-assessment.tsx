"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useMemo, memo } from "react";
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

const RISK_COLORS = {
  critical: '#DC2626',
  high: '#EA580C',
  medium: '#D97706',
  low: '#65A30D'
};

const PHI_COLORS = ['#DC2626', '#EA580C', '#D97706', '#65A30D'];

export function RiskAssessment() {
  const { currentOrganization } = useOrganization();
  const riskData = useQuery(
    api.medicalDevices.getRiskAssessmentData,
    currentOrganization ? { organizationId: currentOrganization._id } : "skip"
  );
  const legacyDevices = useQuery(
    api.medicalDevices.getLegacyOSDevices,
    currentOrganization ? { organizationId: currentOrganization._id } : "skip"
  );

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
                  <div className="text-xs font-medium text-gray-600 p-2 text-center">Critical</div>
                  <div className="text-xs font-medium text-gray-600 p-2 text-center">High</div>
                  <div className="text-xs font-medium text-gray-600 p-2 text-center">Medium</div>
                  <div className="text-xs font-medium text-gray-600 p-2 text-center">Low</div>
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

      {/* Device Category Risk Scoring */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Device Category Risk Scoring
          </CardTitle>
          <CardDescription>
            Risk assessment by medical device categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {riskData?.deviceCategoryRisk?.map((category, index) => (
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