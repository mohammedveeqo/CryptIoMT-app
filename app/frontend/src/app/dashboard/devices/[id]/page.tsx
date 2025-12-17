"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Server, Activity, Shield, Calendar, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DeviceCVEDetails } from "@/components/dashboard/device-cve-details";
import { DeviceHistory } from "@/components/dashboard/device-history";

export default function DeviceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const deviceId = params.id as Id<"medicalDevices">;

  const device = useQuery(api.medicalDevices.getDevice, { id: deviceId });

  if (device === undefined) {
    return <div className="p-8">Loading device details...</div>;
  }

  if (device === null) {
    return (
      <div className="p-8 flex flex-col items-center gap-4">
        <h1 className="text-2xl font-bold">Device Not Found</h1>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{device.name}</h1>
          <p className="text-muted-foreground">
            {device.manufacturer} {device.model} • {device.serialNumber}
          </p>
        </div>
        <div className="ml-auto flex gap-2">
            <Badge variant={device.status === 'active' ? 'default' : 'secondary'}>
                {device.status || 'Unknown'}
            </Badge>
            <Badge variant="outline">
                {device.category}
            </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Network Details</CardTitle>
                <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-2 pt-4">
                <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">IP Address</span>
                    <span className="font-mono text-sm">{device.ipAddress || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">MAC Address</span>
                    <span className="font-mono text-sm">{device.macAddress || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Classification</span>
                    <span className="font-mono text-sm">{device.classification || "N/A"}</span>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Software & OS</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-2 pt-4">
                <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">OS Manufacturer</span>
                    <span className="text-sm font-medium">{device.osManufacturer || "Unknown"}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">OS Version</span>
                    <span className="text-sm">{device.osVersion || "N/A"}</span>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Security Status</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-2 pt-4">
                <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Active CVEs</span>
                    <span className="text-sm font-bold text-orange-500">{device.cveCount ?? 0}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Last Service</span>
                    <span className="text-sm">{device.lastServiceDate ? new Date(device.lastServiceDate).toLocaleDateString() : "Never"}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Compliance</span>
                    <Badge variant="outline" className="text-xs">HIPAA</Badge>
                </div>
            </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
             <Card>
                <CardHeader>
                    <CardTitle>Vulnerabilities</CardTitle>
                </CardHeader>
                <CardContent>
                    <DeviceCVEDetails deviceId={deviceId} />
                </CardContent>
             </Card>
        </div>
        <div className="space-y-6">
             <Card>
                <CardHeader>
                    <CardTitle>Activity History</CardTitle>
                </CardHeader>
                <CardContent>
                    <DeviceHistory deviceId={deviceId} />
                </CardContent>
             </Card>
             
             <Card>
                <CardHeader>
                    <CardTitle>Metadata</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Added: {new Date(device.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Updated: {new Date(device.updatedAt).toLocaleDateString()}</span>
                    </div>
                </CardContent>
             </Card>
        </div>
      </div>
    </div>
  );
}
