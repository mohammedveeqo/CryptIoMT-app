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
  const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];

  // Transform device types data to include colors
  const deviceTypesWithColors = deviceTypes.map(device => ({
    ...device,
    fill: device.risk === 'high' ? '#ef4444' : device.risk === 'medium' ? '#f59e0b' : '#10b981'
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Device Distribution by Hospital</CardTitle>
          <CardDescription>Total devices across facilities</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <defs>
                <linearGradient id="pie-0" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.6} />
                </linearGradient>
                <linearGradient id="pie-1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0.6} />
                </linearGradient>
                <linearGradient id="pie-2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-3)" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="var(--chart-3)" stopOpacity={0.6} />
                </linearGradient>
                <linearGradient id="pie-3" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-4)" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="var(--chart-4)" stopOpacity={0.6} />
                </linearGradient>
                <linearGradient id="pie-4" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-5)" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="var(--chart-5)" stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <Pie
                data={hospitalData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                innerRadius={50}
                outerRadius={92}
                paddingAngle={3}
                stroke="var(--card)"
                strokeWidth={2}
                isAnimationActive
                animationDuration={600}
                dataKey="count"
              >
                {hospitalData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={`url(#pie-${index % 5})`} />
                ))}
              </Pie>
              <Legend wrapperStyle={{ color: 'var(--muted-foreground)' }} iconType="circle" />
              <Tooltip contentStyle={{ backgroundColor: 'var(--popover)', borderColor: 'var(--border)', color: 'var(--popover-foreground)', borderRadius: 12 }} cursor={{ fill: 'transparent' }} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Device Models/Types</CardTitle>
          <CardDescription>Distribution by device category</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={deviceTypesWithColors}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="type" angle={-45} textAnchor="end" height={80} tick={{ fill: 'var(--muted-foreground)' }} />
              <YAxis tick={{ fill: 'var(--muted-foreground)' }} />
              <Tooltip contentStyle={{ backgroundColor: 'var(--popover)', borderColor: 'var(--border)', color: 'var(--popover-foreground)', borderRadius: 12 }} />
              <Legend wrapperStyle={{ color: 'var(--muted-foreground)' }} />
              <defs>
                <linearGradient id="bar-high" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0.6} />
                </linearGradient>
                <linearGradient id="bar-medium" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.6} />
                </linearGradient>
                <linearGradient id="bar-low" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <Bar dataKey="count" radius={[10, 10, 10, 10]} barSize={26}>
                {deviceTypesWithColors.map((d, i) => (
                  <Cell key={`bar-${i}`} fill={d.risk === 'high' ? 'url(#bar-high)' : d.risk === 'medium' ? 'url(#bar-medium)' : 'url(#bar-low)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

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
                <span className="text-sm text-muted-foreground">{os.count} devices</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
