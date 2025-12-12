"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Shield, AlertTriangle } from 'lucide-react';

interface NetworkSecurityProps {
  ipConfiguration: Array<{ type: 'DHCP' | 'Static'; count: number; secure: boolean }>;
  subnetDistribution: Array<{ subnet: string; deviceCount: number; isolated: boolean }>;
  connectionStatus: { online: number; offline: number; unknown: number };
}

export function NetworkSecurity({ ipConfiguration, subnetDistribution, connectionStatus }: NetworkSecurityProps) {
  const connectionData = [
    { name: 'Online', value: connectionStatus.online, color: 'var(--chart-1)' },
    { name: 'Offline', value: connectionStatus.offline, color: 'var(--destructive)' },
    { name: 'Unknown', value: connectionStatus.unknown, color: 'var(--muted-foreground)' }
  ];

  // Transform IP configuration data to include colors
  const ipConfigWithColors = ipConfiguration.map(config => ({
    ...config,
    fill: config.secure ? '#10b981' : '#f59e0b'
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>IP Configuration</span>
          </CardTitle>
          <CardDescription>DHCP vs Static IP distribution</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={ipConfigWithColors}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="type" tick={{ fill: 'var(--muted-foreground)' }} />
              <YAxis tick={{ fill: 'var(--muted-foreground)' }} />
              <Tooltip contentStyle={{ backgroundColor: 'var(--popover)', borderColor: 'var(--border)', color: 'var(--popover-foreground)', borderRadius: 12 }} />
              <Legend wrapperStyle={{ color: 'var(--muted-foreground)' }} />
              <defs>
                <linearGradient id="ip-secure" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.6} />
                </linearGradient>
                <linearGradient id="ip-unsecure" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <Bar dataKey="count" radius={[10, 10, 10, 10]} barSize={26}>
                {ipConfigWithColors.map((d, i) => (
                  <Cell key={`ip-${i}`} fill={d.secure ? 'url(#ip-secure)' : 'url(#ip-unsecure)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Network Segmentation</CardTitle>
          <CardDescription>Device distribution by subnet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {subnetDistribution.map((subnet, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-sm">{subnet.subnet}</span>
                  {subnet.isolated ? (
                    <Badge variant="default">Isolated</Badge>
                  ) : (
                    <Badge variant="destructive">Not Isolated</Badge>
                  )}
                </div>
                <span className="text-sm font-medium text-muted-foreground">{subnet.deviceCount} devices</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Wifi className="h-5 w-5" />
            <span>Connection Status</span>
          </CardTitle>
          <CardDescription>Real-time device connectivity</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <defs>
                <linearGradient id="conn-online" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.6} />
                </linearGradient>
                <linearGradient id="conn-offline" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--destructive)" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="var(--destructive)" stopOpacity={0.6} />
                </linearGradient>
                <linearGradient id="conn-unknown" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--muted-foreground)" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="var(--muted-foreground)" stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <Pie
                data={connectionData}
                cx="50%"
                cy="50%"
                innerRadius={46}
                outerRadius={86}
                paddingAngle={4}
                dataKey="value"
                isAnimationActive
                animationDuration={600}
              >
                {connectionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? 'url(#conn-online)' : index === 1 ? 'url(#conn-offline)' : 'url(#conn-unknown)'} />
                ))}
              </Pie>
              <Legend wrapperStyle={{ color: 'var(--muted-foreground)' }} iconType="circle" />
              <Tooltip contentStyle={{ backgroundColor: 'var(--popover)', borderColor: 'var(--border)', color: 'var(--popover-foreground)', borderRadius: 12 }} cursor={{ fill: 'transparent' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center space-x-4 mt-4">
            {connectionData.map((item, index) => (
              <div key={index} className="flex items-center space-x-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-sm">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
