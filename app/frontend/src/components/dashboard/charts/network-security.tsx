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
    { name: 'Online', value: connectionStatus.online, color: '#10b981' },
    { name: 'Offline', value: connectionStatus.offline, color: '#ef4444' },
    { name: 'Unknown', value: connectionStatus.unknown, color: '#6b7280' }
  ];

  // Transform IP configuration data to include colors
  const ipConfigWithColors = ipConfiguration.map(config => ({
    ...config,
    fill: config.secure ? '#10b981' : '#f59e0b'
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {/* IP Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>IP Configuration</span>
          </CardTitle>
          <CardDescription>DHCP vs Static IP distribution</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={ipConfigWithColors}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="fill" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Network Segmentation */}
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
                <span className="text-sm font-medium">{subnet.deviceCount} devices</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Wifi className="h-5 w-5" />
            <span>Connection Status</span>
          </CardTitle>
          <CardDescription>Real-time device connectivity</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={connectionData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {connectionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
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