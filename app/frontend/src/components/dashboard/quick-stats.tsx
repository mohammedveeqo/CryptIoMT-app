'use client'

import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Activity, AlertTriangle } from 'lucide-react'
import { useOrganization } from '@/contexts/organization-context'

export function QuickStats() {
  const { currentOrganization } = useOrganization()
  
  const deviceStats = useQuery(
    api.medicalDevices.getDeviceStats,
    currentOrganization ? { organizationId: currentOrganization._id } : "skip"
  )

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      <Card className="bg-white/60 backdrop-blur-sm border-blue-200 hover:shadow-lg transition-all">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
          <Shield className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{deviceStats?.totalDevices || 0}</div>
          <p className="text-xs text-muted-foreground">
            {deviceStats?.totalDevices ? '+12% from last week' : 'No devices found'}
          </p>
        </CardContent>
      </Card>

      <Card className="bg-white/60 backdrop-blur-sm border-green-200 hover:shadow-lg transition-all">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Online Devices</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{deviceStats?.onlineDevices || 0}</div>
          <p className="text-xs text-muted-foreground">
            {deviceStats?.networkStats?.percentage || 0}% connected
          </p>
        </CardContent>
      </Card>

      <Card className="bg-white/60 backdrop-blur-sm border-orange-200 hover:shadow-lg transition-all">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{deviceStats?.criticalDevices || 0}</div>
          <p className="text-xs text-muted-foreground">
            Devices requiring attention
          </p>
        </CardContent>
      </Card>

      <Card className="bg-white/60 backdrop-blur-sm border-purple-200 hover:shadow-lg transition-all">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">PHI Devices</CardTitle>
          <Shield className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">{deviceStats?.devicesWithPHI || 0}</div>
          <p className="text-xs text-muted-foreground">
            {deviceStats?.phiStats?.percentage || 0}% contain PHI
          </p>
        </CardContent>
      </Card>
    </div>
  )
}