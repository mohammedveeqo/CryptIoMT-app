'use client'

import { useUser } from '@clerk/nextjs'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useOrganization } from '@/contexts/organization-context'
import { AdminControlPanel } from '@/components/dashboard/admin-control-panel'
import { DeviceInventory } from '@/components/dashboard/device-inventory'
import { DashboardOverview } from '@/components/dashboard/overview'
import { Shield } from 'lucide-react'
import { NetworkTopology } from '@/components/dashboard/network-topology'
import React from 'react';

// Memoize heavy components to prevent unnecessary re-renders
const MemoizedNetworkTopology = React.memo(NetworkTopology);
const MemoizedDeviceInventory = React.memo(DeviceInventory);
const MemoizedDashboardOverview = React.memo(DashboardOverview);

export default function Dashboard() {
  const { user } = useUser()
  const currentUser = useQuery(api.users.getCurrentUser)
  const { currentOrganization } = useOrganization()
  
  const userRole = (currentUser && 'role' in currentUser && currentUser.role) ? currentUser.role : "customer"
  const isAdmin = ["super_admin", "admin", "analyst"].includes(userRole)

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Admin Controls */}
      {isAdmin && (
        <div className="animate-in slide-in-from-top-4 duration-500">
          <AdminControlPanel userRole={userRole} />
        </div>
      )}

      {/* Main Dashboard Tabs */}
      <div className="animate-in slide-in-from-bottom-4 duration-700">
        <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6 lg:space-y-8">
          {/* Mobile: Dropdown Tabs */}
          <div className="sm:hidden">
            <Select defaultValue="overview">
              <SelectTrigger className="w-full bg-white/80 backdrop-blur-sm shadow-lg border border-gray-200/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overview">Overview</SelectItem>
                <SelectItem value="devices">Device Inventory</SelectItem>
                <SelectItem value="risk">Risk Assessment</SelectItem>
                <SelectItem value="network">Network Topology</SelectItem>
                <SelectItem value="alerts">Alerts & Threats</SelectItem>
                {isAdmin && <SelectItem value="import">Data Import</SelectItem>}
                {isAdmin && <SelectItem value="customers">Customer Management</SelectItem>}
              </SelectContent>
            </Select>
          </div>

          {/* Desktop: Horizontal Tabs */}
          <div className="hidden sm:flex justify-center">
            <TabsList className="bg-white/80 backdrop-blur-sm shadow-lg border border-gray-200/50 p-1.5 rounded-xl flex-wrap gap-1">
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
              {isAdmin && (
                <TabsTrigger 
                  value="import"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 rounded-lg px-3 sm:px-4 lg:px-6 py-2.5 font-medium text-sm"
                >
                  <span className="hidden lg:inline">Data Import</span>
                  <span className="lg:hidden">Import</span>
                </TabsTrigger>
              )}
              {isAdmin && (
                <TabsTrigger 
                  value="customers"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 rounded-lg px-3 sm:px-4 lg:px-6 py-2.5 font-medium text-sm"
                >
                  <span className="hidden lg:inline">Customer Management</span>
                  <span className="lg:hidden">Customers</span>
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          <TabsContent value="overview" className="animate-in fade-in-50 duration-500">
            <MemoizedDashboardOverview />
          </TabsContent>

          <TabsContent value="devices" className="animate-in fade-in-50 duration-500">
            <MemoizedDeviceInventory isAdmin={isAdmin} userRole={userRole} />
          </TabsContent>

          <TabsContent value="risk" className="animate-in fade-in-50 duration-500">
            <div className="bg-gradient-to-br from-white to-gray-50 backdrop-blur-sm rounded-2xl p-12 text-center shadow-lg border border-gray-200/50">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Shield className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Risk Assessment</h3>
                <p className="text-gray-600 leading-relaxed">Advanced risk assessment functionality is coming soon. This will include NIST-aligned evaluations and comprehensive threat analysis.</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="network" className="animate-in fade-in-50 duration-500">
            <MemoizedNetworkTopology />
          </TabsContent>

          <TabsContent value="alerts" className="animate-in fade-in-50 duration-500">
            <div className="bg-gradient-to-br from-white to-gray-50 backdrop-blur-sm rounded-2xl p-12 text-center shadow-lg border border-gray-200/50">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-red-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Shield className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Alerts & Threats</h3>
                <p className="text-gray-600 leading-relaxed">Real-time security alerts and threat monitoring dashboard is being developed to keep your medical devices secure.</p>
              </div>
            </div>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="import" className="animate-in fade-in-50 duration-500">
              <div className="bg-gradient-to-br from-white to-gray-50 backdrop-blur-sm rounded-2xl p-12 text-center shadow-lg border border-gray-200/50">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Shield className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Data Import Center</h3>
                  <p className="text-gray-600 leading-relaxed">Bulk data import functionality for medical device inventories and security assessments is coming soon.</p>
                </div>
              </div>
            </TabsContent>
          )}

          {isAdmin && (
            <TabsContent value="customers" className="animate-in fade-in-50 duration-500">
              <div className="bg-gradient-to-br from-white to-gray-50 backdrop-blur-sm rounded-2xl p-12 text-center shadow-lg border border-gray-200/50">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Shield className="h-8 w-8 text-purple-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Customer Management</h3>
                  <p className="text-gray-600 leading-relaxed">Comprehensive customer management interface for handling multiple healthcare organizations and their security needs.</p>
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  )
}