"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, Database } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RiskData {
  deviceId: string;
  deviceName: string;
  phiCategory: 'high' | 'medium' | 'low' | 'none';
  networkStatus: 'secure' | 'unsecure' | 'unknown';
  riskScore: number;
  hospital: string;
}

interface RiskHeatmapProps {
  riskData: RiskData[];
}

export function RiskHeatmap({ riskData }: RiskHeatmapProps) {
  const getRiskColor = (score: number) => {
    if (score >= 80) return 'bg-red-500';
    if (score >= 60) return 'bg-orange-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPHIBadgeVariant = (category: string) => {
    switch (category) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'default';
    }
  };

  const groupedByHospital = riskData.reduce((acc, device) => {
    if (!acc[device.hospital]) acc[device.hospital] = [];
    acc[device.hospital].push(device);
    return acc;
  }, {} as Record<string, RiskData[]>);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5" />
          <span>Risk Assessment Heat Map</span>
        </CardTitle>
        <CardDescription>PHI category vs Network security status</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Object.entries(groupedByHospital).map(([hospital, devices]) => (
            <div key={hospital} className="space-y-3">
              <h3 className="font-semibold text-lg">{hospital}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {devices.map((device) => (
                  <div
                    key={device.deviceId}
                    className={cn(
                      "p-3 rounded-xl border bg-card/50 shadow-sm transition-all hover:shadow-md hover:-translate-y-[1px]",
                      device.networkStatus === 'secure' ? 'border-green-200' : 'border-red-200'
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm truncate">{device.deviceName}</span>
                      <div className={cn("w-2.5 h-2.5 rounded-full", getRiskColor(device.riskScore))}></div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge variant={getPHIBadgeVariant(device.phiCategory)} className="text-xs">
                        PHI: {device.phiCategory}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{device.riskScore}%</span>
                    </div>
                    <div className="flex items-center mt-2">
                      {device.networkStatus === 'secure' ? (
                        <Shield className="h-3 w-3 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-3 w-3 text-red-600" />
                      )}
                      <span className="text-xs ml-1 capitalize text-muted-foreground">{device.networkStatus}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
