'use client'

import React, { useState, useMemo } from 'react';
import { useUser } from '@clerk/nextjs'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useOrganization } from '@/contexts/organization-context'
import { DeviceInventory } from '@/components/dashboard/device-inventory'
import { DashboardOverview } from '@/components/dashboard/overview'
import { QuickStats } from '@/components/dashboard/quick-stats'
import { Shield } from 'lucide-react'
import { useSearchParams, useRouter } from 'next/navigation'
import { NetworkTopology } from '@/components/dashboard/network-topology'
import { RiskAssessment } from '@/components/dashboard/risk-assessment';
import AlertsAndThreats from "@/components/dashboard/alerts-and-threats";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Download, Printer } from 'lucide-react'

// Memoize heavy components to prevent unnecessary re-renders
const MemoizedNetworkTopology = React.memo(NetworkTopology);
const MemoizedDeviceInventory = React.memo(DeviceInventory);
const MemoizedDashboardOverview = React.memo(DashboardOverview);
// Memoize the AlertsAndThreats component to prevent unnecessary re-renders
const MemoizedAlertsAndThreats = React.memo(AlertsAndThreats);

export default function Dashboard() {
  const { user } = useUser();
  const { currentOrganization } = useOrganization();
  const [activeTab, setActiveTab] = useState("overview");
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = searchParams.get('tab') || 'overview';

  // Memoize organization ID to prevent unnecessary re-renders
  const organizationId = useMemo(() => currentOrganization?._id, [currentOrganization?._id]);

  const currentUser = useQuery(api.users.getCurrentUser)
  
  const userRole = (currentUser && 'role' in currentUser && currentUser.role) ? currentUser.role : "customer"
  const isAdmin = ["super_admin", "admin", "analyst"].includes(userRole)
  const devices = useQuery(
    api.medicalDevices.getAllMedicalDevices,
    currentOrganization ? { organizationId: currentOrganization._id } : 'skip'
  )

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Main Dashboard Tabs */}
      <div className="animate-in slide-in-from-bottom-4 duration-700">
        <Tabs value={tab} onValueChange={(v) => router.replace(`/dashboard?tab=${v}`)} className="space-y-4 sm:space-y-6 lg:space-y-8">
          {/* Mobile: Dropdown Tabs */}
          <div className="sm:hidden sticky top-16 z-30 bg-card/80 backdrop-blur-sm border-b border-border py-2">
            <Select value={tab} onValueChange={(v) => router.replace(`/dashboard?tab=${v}`)}>
            <SelectTrigger className="w/full bg-card/80 backdrop-blur-sm shadow-lg border border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overview">Overview</SelectItem>
                <SelectItem value="devices">Device Inventory</SelectItem>
                <SelectItem value="risk">Risk Assessment</SelectItem>
                <SelectItem value="network">Network Topology</SelectItem>
                <SelectItem value="alerts">Alerts & Threats</SelectItem>
                <SelectItem value="reports">Reports</SelectItem>
                
              </SelectContent>
            </Select>
          </div>

          {/* Desktop: Horizontal Tabs */}
          <div className="hidden sm:flex justify-center sticky top-16 z-30 bg-card/80 backdrop-blur-sm border-b border-border py-2">
            <TabsList className="bg-card/80 backdrop-blur-sm shadow-lg border border-border p-1.5 rounded-xl flex-wrap gap-1">
              <TabsTrigger 
                value="overview" 
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 rounded-lg px-3 sm:px-4 lg:px-6 py-2.5 font-medium text-sm"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="devices"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 rounded-lg px-3 sm:px-4 lg:px-6 py-2.5 font-medium text-sm"
              >
                <span className="hidden sm:inline">Device Inventory</span>
                <span className="sm:hidden">Devices</span>
              </TabsTrigger>
              <TabsTrigger 
                value="risk"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 rounded-lg px-3 sm:px-4 lg:px-6 py-2.5 font-medium text-sm"
              >
                <span className="hidden sm:inline">Risk Assessment</span>
                <span className="sm:hidden">Risk</span>
              </TabsTrigger>
              <TabsTrigger 
                value="network"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 rounded-lg px-3 sm:px-4 lg:px-6 py-2.5 font-medium text-sm"
              >
                <span className="hidden sm:inline">Network Topology</span>
                <span className="sm:hidden">Network</span>
              </TabsTrigger>
              <TabsTrigger 
                value="alerts"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 rounded-lg px-3 sm:px-4 lg:px-6 py-2.5 font-medium text-sm"
              >
                <span className="hidden sm:inline">Alerts & Threats</span>
                <span className="sm:hidden">Alerts</span>
              </TabsTrigger>
              <TabsTrigger 
                value="reports"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 rounded-lg px-3 sm:px-4 lg:px-6 py-2.5 font-medium text-sm"
              >
                Reports
              </TabsTrigger>
              
            </TabsList>
          </div>

          <TabsContent value="overview" className="animate-in fade-in-50 duration-500 space-y-6">
            <MemoizedDashboardOverview />
          </TabsContent>

          <TabsContent value="devices" className="animate-in fade-in-50 duration-500">
            <MemoizedDeviceInventory isAdmin={isAdmin} userRole={userRole} />
          </TabsContent>

          <TabsContent value="risk" className="animate-in fade-in-50 duration-500">
            <RiskAssessment />
          </TabsContent>

          <TabsContent value="network" className="animate-in fade-in-50 duration-500">
            <MemoizedNetworkTopology />
          </TabsContent>

          <TabsContent value="alerts" className="animate-in fade-in-50 duration-500">
            {currentOrganization?._id ? (
              <React.Suspense fallback={
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2">Loading alerts...</span>
                </div>
              }>
                <MemoizedAlertsAndThreats organizationId={currentOrganization._id} />
              </React.Suspense>
            ) : (
              <div className="flex items-center justify-center h-64">
                <div className="text-muted-foreground">Please select an organization to view alerts</div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="reports" className="animate-in fade-in-50 duration-500 space-y-6">
            {currentOrganization?._id ? (
              devices ? (
                (() => {
                  const totalDevices = devices.length
                  const phiDevices = devices.filter(d => d.hasPHI).length
                  const connectedDevices = devices.filter(d => d.deviceOnNetwork).length
                  const offlineDevices = totalDevices - connectedDevices
                  const byClassification: Record<string, number> = {}
                  const byCategory: Record<string, number> = {}
                  const byManufacturer: Record<string, number> = {}
                  const byOsVersion: Record<string, number> = {}
                  devices.forEach(d => {
                    const cls = d.classification || 'Unknown'
                    const cat = d.category || 'Unknown'
                    const man = d.manufacturer || 'Unknown'
                    const osv = (d as any).osVersion || 'Unknown'
                    byClassification[cls] = (byClassification[cls] || 0) + 1
                    byCategory[cat] = (byCategory[cat] || 0) + 1
                    byManufacturer[man] = (byManufacturer[man] || 0) + 1
                    byOsVersion[osv] = (byOsVersion[osv] || 0) + 1
                  })
                  const topManufacturers = Object.entries(byManufacturer).sort((a,b) => b[1]-a[1]).slice(0,5)
                  const exportSummary = () => {
                    const rows: { [k: string]: string | number }[] = []
                    rows.push({ Metric: 'Total Devices', Value: totalDevices })
                    rows.push({ Metric: 'PHI Devices', Value: phiDevices })
                    rows.push({ Metric: 'Connected Devices', Value: connectedDevices })
                    rows.push({ Metric: 'Offline Devices', Value: offlineDevices })
                    rows.push({ Metric: 'Classifications', Value: '' })
                    Object.entries(byClassification).forEach(([k,v]) => rows.push({ Metric: `classification:${k}`, Value: v }))
                    rows.push({ Metric: 'Categories', Value: '' })
                    Object.entries(byCategory).forEach(([k,v]) => rows.push({ Metric: `category:${k}`, Value: v }))
                    rows.push({ Metric: 'Manufacturers', Value: '' })
                    Object.entries(byManufacturer).forEach(([k,v]) => rows.push({ Metric: `manufacturer:${k}`, Value: v }))
                    rows.push({ Metric: 'OS Versions', Value: '' })
                    Object.entries(byOsVersion).forEach(([k,v]) => rows.push({ Metric: `os:${k}`, Value: v }))
                    const header = ['Metric','Value']
                    const csv = [header.join(','), ...rows.map(r => header.map(h => String(r[h]).replace(/,/g,';')).join(','))].join('\n')
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = 'reports-summary.csv'
                    a.click()
                    URL.revokeObjectURL(url)
                  }
                  const exportDevices = () => {
                    const rows = devices.map(d => ({
                      name: d.name,
                      entity: d.entity,
                      serialNumber: d.serialNumber,
                      manufacturer: d.manufacturer,
                      model: d.model,
                      category: d.category,
                      classification: d.classification,
                      ipAddress: (d as any).ipAddress || '',
                      osVersion: (d as any).osVersion || '',
                      onNetwork: d.deviceOnNetwork ? 'yes' : 'no',
                      hasPHI: d.hasPHI ? 'yes' : 'no',
                    }))
                    const header = Object.keys(rows[0] || {name:'',entity:'',serialNumber:'',manufacturer:'',model:'',category:'',classification:'',ipAddress:'',osVersion:'',onNetwork:'',hasPHI:''})
                    const csv = [header.join(','), ...rows.map(r => header.map(h => String((r as any)[h]).replace(/,/g,';')).join(','))].join('\n')
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = 'devices-all.csv'
                    a.click()
                    URL.revokeObjectURL(url)
                  }
                  return (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h1 className="text-2xl font-bold text-foreground">Reports</h1>
                          <p className="text-muted-foreground">Periodic summaries from uploaded CSV data</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" onClick={exportSummary} className="rounded-md">
                            <Download className="h-4 w-4 mr-2" />
                            Export Summary CSV
                          </Button>
                          <Button variant="outline" onClick={exportDevices} className="rounded-md">
                            <Download className="h-4 w-4 mr-2" />
                            Export Devices CSV
                          </Button>
                          <Button variant="outline" onClick={() => window.print()} className="rounded-md">
                            <Printer className="h-4 w-4 mr-2" />
                            Print View
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Total Devices</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{totalDevices}</div>
                            <p className="text-xs text-muted-foreground">From latest upload</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">PHI Devices</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{phiDevices}</div>
                            <p className="text-xs text-muted-foreground">Contain patient data</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Connected</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{connectedDevices}</div>
                            <p className="text-xs text-muted-foreground">On network</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Offline</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{offlineDevices}</div>
                            <p className="text-xs text-muted-foreground">Not networked</p>
                          </CardContent>
                        </Card>
                      </div>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Top Manufacturers</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                            {topManufacturers.map(([m,c]) => (
                              <div key={m} className="flex items-center justify-between p-3 border rounded-lg">
                                <span className="font-medium">{m}</span>
                                <Badge variant="secondary">{c}</Badge>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Classification Breakdown</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {Object.entries(byClassification).map(([k,v]) => (
                              <div key={k} className="flex items-center justify-between p-3 border rounded-lg">
                                <span className="font-medium">{k}</span>
                                <Badge variant="outline">{v}</Badge>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Categories</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {Object.entries(byCategory).map(([k,v]) => (
                              <div key={k} className="flex items-center justify-between p-3 border rounded-lg">
                                <span className="font-medium">{k}</span>
                                <Badge variant="outline">{v}</Badge>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">OS Versions</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {Object.entries(byOsVersion).map(([k,v]) => (
                              <div key={k} className="flex items-center justify-between p-3 border rounded-lg">
                                <span className="font-medium">{k}</span>
                                <Badge variant="outline">{v}</Badge>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )
                })()
              ) : (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2">Loading reports...</span>
                </div>
              )
            ) : (
              <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Please select an organization to view reports</div>
              </div>
            )}
          </TabsContent>
          
        </Tabs>
      </div>
    </div>
  )
}
