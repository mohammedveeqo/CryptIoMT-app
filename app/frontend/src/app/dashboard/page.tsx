'use client'

import { useUser } from '@clerk/nextjs'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useOrganization } from '@/contexts/organization-context'
import { QuickStats } from '@/components/dashboard/quick-stats'
import { AdminControlPanel } from '@/components/dashboard/admin-control-panel'
import { DeviceInventory } from '@/components/dashboard/device-inventory'
import { DashboardOverview } from '@/components/dashboard/overview'

export default function Dashboard() {
  const { user } = useUser()
  const currentUser = useQuery(api.users.getCurrentUser)
  const { currentOrganization } = useOrganization()
  
  const userRole = (currentUser && 'role' in currentUser && currentUser.role) ? currentUser.role : "customer"
  const isAdmin = ["super_admin", "admin", "analyst"].includes(userRole)

  return (
    <div className="space-y-6">
      {/* Admin Controls */}
      {isAdmin && <AdminControlPanel userRole={userRole} />}

      {/* Quick Stats */}
      <QuickStats />

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-white/60 backdrop-blur-sm">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="devices">Device Inventory</TabsTrigger>
          <TabsTrigger value="risk">Risk Assessment</TabsTrigger>
          <TabsTrigger value="network">Network Topology</TabsTrigger>
          <TabsTrigger value="alerts">Alerts & Threats</TabsTrigger>
          {isAdmin && <TabsTrigger value="import">Data Import</TabsTrigger>}
          {isAdmin && <TabsTrigger value="customers">Customer Management</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview">
          <DashboardOverview />
        </TabsContent>

        <TabsContent value="devices">
          <DeviceInventory  />
        </TabsContent>

        <TabsContent value="risk">
          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-8 text-center">
            <h3 className="text-lg font-semibold mb-2">Risk Assessment</h3>
            <p className="text-gray-600">Risk assessment functionality coming soon...</p>
          </div>
        </TabsContent>

        <TabsContent value="network">
          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-8 text-center">
            <h3 className="text-lg font-semibold mb-2">Network Topology</h3>
            <p className="text-gray-600">Network topology visualization coming soon...</p>
          </div>
        </TabsContent>

        <TabsContent value="alerts">
          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-8 text-center">
            <h3 className="text-lg font-semibold mb-2">Alerts & Threats</h3>
            <p className="text-gray-600">Security alerts and threat monitoring coming soon...</p>
          </div>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="import">
            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-8 text-center">
              <h3 className="text-lg font-semibold mb-2">Data Import Center</h3>
              <p className="text-gray-600">Data import functionality coming soon...</p>
            </div>
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="customers">
            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-8 text-center">
              <h3 className="text-lg font-semibold mb-2">Customer Management</h3>
              <p className="text-gray-600">Customer management interface coming soon...</p>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}