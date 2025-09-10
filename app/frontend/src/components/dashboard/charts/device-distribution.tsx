"use client";

import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface DeviceDistributionProps {
  hospitalData: Array<{ name: string; count: number; color: string }>;
  deviceTypes: Array<{ type: string; count: number; risk: 'low' | 'medium' | 'high' }>;
  osVersions: Array<{ version: string; count: number; supported: boolean }>;
}

export function DeviceDistribution({ hospitalData, deviceTypes, osVersions }: DeviceDistributionProps) {
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  // Transform device types data to include colors
  const deviceTypesWithColors = deviceTypes.map(device => ({
    ...device,
    fill: device.risk === 'high' ? '#ef4444' : device.risk === 'medium' ? '#f59e0b' : '#10b981'
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Hospital Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Device Distribution by Hospital</CardTitle>
          <CardDescription>Total devices across facilities</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={hospitalData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {hospitalData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Device Types */}
      <Card>
        <CardHeader>
          <CardTitle>Device Models/Types</CardTitle>
          <CardDescription>Distribution by device category</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={deviceTypesWithColors}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="fill" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* OS Versions */}
      <Card>
        <CardHeader>
          <CardTitle>OS Version Distribution</CardTitle>
          <CardDescription>Security patch compliance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {osVersions.map((os, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{os.version}</span>
                  <Badge variant={os.supported ? 'default' : 'destructive'}>
                    {os.supported ? 'Supported' : 'EOL'}
                  </Badge>
                </div>
                <span className="text-sm text-gray-600">{os.count} devices</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}