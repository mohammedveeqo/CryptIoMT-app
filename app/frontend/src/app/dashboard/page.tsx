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

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Main Dashboard Tabs */}
      <div className="animate-in slide-in-from-bottom-4 duration-700">
        <Tabs value={tab} onValueChange={(v) => router.replace(`/dashboard?tab=${v}`)} className="space-y-4 sm:space-y-6 lg:space-y-8">
          {/* Mobile: Dropdown Tabs */}
          <div className="sm:hidden sticky top-16 z-30 bg-white/80 backdrop-blur-sm border-b border-gray-200/50 py-2">
            <Select value={tab} onValueChange={(v) => router.replace(`/dashboard?tab=${v}`)}>
              <SelectTrigger className="w/full bg-white/80 backdrop-blur-sm shadow-lg border border-gray-200/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overview">Overview</SelectItem>
                <SelectItem value="devices">Device Inventory</SelectItem>
                <SelectItem value="risk">Risk Assessment</SelectItem>
                <SelectItem value="network">Network Topology</SelectItem>
                <SelectItem value="alerts">Alerts & Threats</SelectItem>
                
              </SelectContent>
            </Select>
          </div>

          {/* Desktop: Horizontal Tabs */}
          <div className="hidden sm:flex justify-center sticky top-16 z-30 bg-white/80 backdrop-blur-sm border-b border-gray-200/50 py-2">
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
              
            </TabsList>
          </div>

          <TabsContent value="overview" className="animate-in fade-in-50 duration-500 space-y-6">
            <MemoizedDashboardOverview />
            <QuickStats />
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
                <div className="text-gray-500">Please select an organization to view alerts</div>
              </div>
            )}
          </TabsContent>

          
        </Tabs>
      </div>
    </div>
  )
}
