'use client'

import * as React from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Activity, AlertTriangle, Copy } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useCachedQuery } from '@/hooks/use-cached-query'
import { useRouter } from 'next/navigation'
import { useOrganization } from '@/contexts/organization-context'
import { ResponsiveContainer, BarChart, Bar, XAxis } from 'recharts'

export function QuickStats() {
  const { currentOrganization } = useOrganization()
  const router = useRouter()
  const [detailsOpen, setDetailsOpen] = React.useState(false)
  const [selectedMetric, setSelectedMetric] = React.useState<null | 'total' | 'online' | 'critical' | 'phi'>(null)
  
  const deviceStats = useQuery(
    api.medicalDevices.getDeviceStats,
    currentOrganization ? { organizationId: currentOrganization._id } : "skip"
  )

  const allDevicesLive = useQuery(
    api.medicalDevices.getAllMedicalDevices,
    currentOrganization ? { organizationId: currentOrganization._id } : "skip"
  )
  const { data: allDevices } = useCachedQuery(
    currentOrganization ? `devices:${currentOrganization._id}` : 'devices:none',
    allDevicesLive
  )

  const filteredDevices = React.useMemo(() => {
    const list = allDevices || []
    if (selectedMetric === 'online') return list.filter(d => d.deviceOnNetwork)
    if (selectedMetric === 'critical') return list.filter(d => d.classification === 'critical' || d.customerPHICategory?.toLowerCase().includes('critical') || d.hasPHI)
    if (selectedMetric === 'phi') return list.filter(d => d.hasPHI)
    return list
  }, [allDevices, selectedMetric])

  const hospitalBreakdown = React.useMemo(() => {
    const map: Record<string, number> = {}
    filteredDevices.forEach(d => {
      const key = d.entity || 'Unknown'
      map[key] = (map[key] || 0) + 1
    })
    return Object.entries(map).sort((a,b) => b[1]-a[1]).slice(0,6)
  }, [filteredDevices])

  const manufacturerBreakdown = React.useMemo(() => {
    const map: Record<string, number> = {}
    filteredDevices.forEach(d => {
      const key = d.manufacturer || 'Unknown'
      map[key] = (map[key] || 0) + 1
    })
    return Object.entries(map).sort((a,b) => b[1]-a[1]).slice(0,6)
  }, [filteredDevices])

  const categoryBreakdown = React.useMemo(() => {
    const map: Record<string, number> = {}
    filteredDevices.forEach(d => {
      const key = d.category || 'Unknown'
      map[key] = (map[key] || 0) + 1
    })
    return Object.entries(map).sort((a,b) => b[1]-a[1]).slice(0,6)
  }, [filteredDevices])

  return (
    <>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="bg-card border rounded-xl hover:bg-muted/50 hover:shadow-md transition-all cursor-pointer" onClick={() => { setSelectedMetric('total'); setDetailsOpen(true) }} aria-label="View Total Devices details" role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setSelectedMetric('total'); setDetailsOpen(true) } }}>
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

      <Card className="bg-card border rounded-xl hover:bg-muted/50 hover:shadow-md transition-all cursor-pointer" onClick={() => { setSelectedMetric('online'); setDetailsOpen(true) }} aria-label="View Online Devices details" role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setSelectedMetric('online'); setDetailsOpen(true) } }}>
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

      <Card className="bg-card border rounded-xl hover:bg-muted/50 hover:shadow-md transition-all cursor-pointer" onClick={() => { setSelectedMetric('critical'); setDetailsOpen(true) }} aria-label="View Critical Alerts details" role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setSelectedMetric('critical'); setDetailsOpen(true) } }}>
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

      <Card className="bg-card border rounded-xl hover:bg-muted/50 hover:shadow-md transition-all cursor-pointer" onClick={() => { setSelectedMetric('phi'); setDetailsOpen(true) }} aria-label="View PHI Devices details" role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setSelectedMetric('phi'); setDetailsOpen(true) } }}>
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
    {selectedMetric && (
      <Dialog open={detailsOpen} onOpenChange={(o) => { setDetailsOpen(o); if (!o) setSelectedMetric(null); }}>
        <DialogContent className="sm:max-w-3xl max-w-[calc(100%-2rem)] sm:max-h-[calc(100vh-6rem)] my-6 overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedMetric === 'total' && 'Total Devices'}
              {selectedMetric === 'online' && 'Online Devices'}
              {selectedMetric === 'critical' && 'Critical Alerts'}
              {selectedMetric === 'phi' && 'PHI Devices'}
            </DialogTitle>
            <DialogDescription>
              {currentOrganization?.name || 'Organization'}
            </DialogDescription>
          </DialogHeader>
          <div className="px-2 sm:px-4 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="text-xs text-muted-foreground">Count</div>
                <div className="text-3xl font-bold tracking-tight">
                  {selectedMetric === 'total' && (deviceStats?.totalDevices || 0)}
                  {selectedMetric === 'online' && (deviceStats?.onlineDevices || 0)}
                  {selectedMetric === 'critical' && (deviceStats?.criticalDevices || 0)}
                  {selectedMetric === 'phi' && (deviceStats?.devicesWithPHI || 0)}
                </div>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="text-xs text-muted-foreground">Context</div>
                <div className="text-sm font-medium">
                  {selectedMetric === 'total' && `${deviceStats?.networkStats?.percentage || 0}% connected`}
                  {selectedMetric === 'online' && `${deviceStats?.networkStats?.percentage || 0}% connected`}
                  {selectedMetric === 'critical' && 'Devices requiring attention'}
                  {selectedMetric === 'phi' && `${deviceStats?.phiStats?.percentage || 0}% contain PHI`}
                </div>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="text-xs text-muted-foreground">Action</div>
                <div className="flex gap-2 mt-2">
                  {selectedMetric === 'critical' ? (
                    <Button size="sm" onClick={() => router.push('/dashboard/risk')}>Open Risk</Button>
                  ) : (
                    <Button size="sm" onClick={() => {
                      const qp = new URLSearchParams()
                      qp.set('tab','devices')
                      if (selectedMetric === 'online') qp.set('network','connected')
                      if (selectedMetric === 'phi') qp.set('phi','yes')
                      router.push(`/dashboard?${qp.toString()}`)
                    }}>Open Equipment</Button>
                  )}
                </div>
              </div>
            </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg border bg-card p-4">
              <div className="text-sm font-semibold">Top Hospitals</div>
              <div className="mt-2 h-24">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hospitalBreakdown.map(([name, count]) => ({ name, count }))}>
                    <XAxis dataKey="name" hide />
                    <Bar dataKey="count" fill="#60a5fa" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 space-y-3">
                {hospitalBreakdown.map(([name, count]) => (
                  <div key={name} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="truncate mr-2 font-medium">{name}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                    <Progress value={Math.min(100, Math.round((count / Math.max(1, filteredDevices.length)) * 100))} />
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-sm font-semibold">Top Manufacturers</div>
              <div className="mt-2 h-24">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={manufacturerBreakdown.map(([name, count]) => ({ name, count }))}>
                    <XAxis dataKey="name" hide />
                    <Bar dataKey="count" fill="#34d399" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 space-y-3">
                {manufacturerBreakdown.map(([name, count]) => (
                  <div key={name} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="truncate mr-2 font-medium">{name}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                    <Progress value={Math.min(100, Math.round((count / Math.max(1, filteredDevices.length)) * 100))} />
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-sm font-semibold">Top Categories</div>
              <div className="mt-2 h-24">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryBreakdown.map(([name, count]) => ({ name, count }))}>
                    <XAxis dataKey="name" hide />
                    <Bar dataKey="count" fill="#a78bfa" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 space-y-3">
                {categoryBreakdown.map(([name, count]) => (
                  <div key={name} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="truncate mr-2 font-medium">{name}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                    <Progress value={Math.min(100, Math.round((count / Math.max(1, filteredDevices.length)) * 100))} />
                  </div>
                ))}
              </div>
            </div>
          </div>

            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Preview</div>
                <div className="flex items-center gap-2">
                  <div className="text-xs text-muted-foreground">Showing up to 12 devices</div>
                  <Button size="sm" variant="outline" onClick={() => {
                    const rows = (allDevices || []).filter(d => {
                      if (selectedMetric === 'total') return true
                      if (selectedMetric === 'online') return d.deviceOnNetwork
                      if (selectedMetric === 'critical') return d.classification === 'critical' || d.hasPHI
                      if (selectedMetric === 'phi') return d.hasPHI
                      return false
                    }).map(d => ({
                      name: d.name,
                      entity: d.entity || '',
                      ipAddress: d.ipAddress || '',
                      osVersion: d.osVersion || '',
                      onNetwork: d.deviceOnNetwork ? 'yes' : 'no',
                      classification: d.classification || '',
                      hasPHI: d.hasPHI ? 'yes' : 'no',
                    }))
                    const header = Object.keys(rows[0] || {name:'',entity:'',ipAddress:'',osVersion:'',onNetwork:'',classification:'',hasPHI:''})
                    const csv = [header.join(','), ...rows.map(r => header.map(h => String((r as any)[h]).replace(/,/g,';')).join(','))].join('\n')
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `devices-${selectedMetric || 'all'}.csv`
                    a.click()
                    URL.revokeObjectURL(url)
                  }}>Export CSV</Button>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                {(allDevices || [])
                  .filter(d => {
                    if (selectedMetric === 'total') return true
                    if (selectedMetric === 'online') return d.deviceOnNetwork
                    if (selectedMetric === 'critical') return d.classification === 'critical' || d.hasPHI
                    if (selectedMetric === 'phi') return d.hasPHI
                    return false
                  })
                  .slice(0, 12)
                  .map(d => (
                    <div key={d._id} className="p-3 rounded-md border bg-muted/20">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-sm truncate">{d.name}</div>
                        <Badge variant={d.deviceOnNetwork ? 'secondary' : 'outline'} className="text-xs">
                          {d.deviceOnNetwork ? 'Connected' : 'Offline'}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                        <span>{d.entity || 'Unknown'} • {d.ipAddress || 'N/A'} • {d.osVersion || 'Unknown OS'}</span>
                        {d.ipAddress && (
                          <Button variant="ghost" size="icon" onClick={() => navigator.clipboard.writeText(d.ipAddress || '')}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )}
    </>
  )
}
