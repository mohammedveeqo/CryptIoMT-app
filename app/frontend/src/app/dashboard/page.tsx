'use client'

import { useUser, UserButton } from '@clerk/nextjs'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Upload, Users, Shield, Activity, Network, AlertTriangle, Download, FileSpreadsheet, User, Crown, Settings } from 'lucide-react'
import { useOrganization } from '@/contexts/organization-context'

export default function Dashboard() {
  const { user } = useUser()
  const currentUser = useQuery(api.users.getCurrentUser)
  const { currentOrganization } = useOrganization()
  
  // Get device statistics using currentOrganization
  const deviceStats = useQuery(
    api.medicalDevices.getDeviceStats,
    currentOrganization ? { organizationId: currentOrganization._id } : "skip"
  );
  
  const devicesByCategory = useQuery(
    api.medicalDevices.getDevicesByCategory,
    currentOrganization ? { organizationId: currentOrganization._id } : "skip"
  );
  
  const recentActivities = useQuery(
    api.medicalDevices.getRecentDeviceActivities,
    currentOrganization ? { organizationId: currentOrganization._id } : "skip"
  );
  
  const userRole = (currentUser && 'role' in currentUser && currentUser.role) ? currentUser.role : "customer"
  const isAdmin = ["super_admin", "admin", "analyst"].includes(userRole)

  // Define roleConfig based on user role
  const getRoleConfig = () => {
    switch(userRole) {
      case 'super_admin':
        return { color: 'bg-red-600 text-white', label: 'SUPER ADMIN' }
      case 'admin':
        return { color: 'bg-orange-600 text-white', label: 'ADMIN' }
      case 'analyst':
        return { color: 'bg-blue-600 text-white', label: 'ANALYST' }
      default:
        return { color: 'bg-gray-600 text-white', label: 'CUSTOMER' }
    }
  }

  const roleConfig = getRoleConfig()

  return (
    <div className="space-y-6">
      {/* Admin Controls */}
      {isAdmin && (
        <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center">
                  <Crown className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-orange-900">
                    Admin Control Panel
                  </p>
                  <p className="text-sm text-orange-700">
                    You have {userRole.replace('_', ' ')} access to manage organizations, import data, and oversee system operations.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button className="bg-orange-600 hover:bg-orange-700">
                  <Upload className="h-4 w-4 mr-2" />
                  Bulk Data Import
                </Button>
                <Button variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-50">
                  <Settings className="h-4 w-4 mr-2" />
                  System Settings
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

   
      {/* Quick Stats */}
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
              {deviceStats?.networkStats.percentage || 0}% connected
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
              {deviceStats?.phiStats.percentage || 0}% contain PHI
            </p>
          </CardContent>
        </Card>
      </div>

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

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white/60 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Device Status Overview</CardTitle>
                <CardDescription>
                  {isAdmin ? `System-wide device status (${userRole} view)` : 'Your device status overview'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  📊 Device status charts will appear here
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/60 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  {isAdmin ? `Latest system activities (${userRole} access)` : 'Your recent device activities'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivities && recentActivities.length > 0 ? (
                    recentActivities.slice(0, 3).map((activity, index) => (
                      <div key={activity.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <span className="text-sm">{activity.message}</span>
                        <Badge variant="secondary">
                          {new Date(activity.timestamp).toLocaleTimeString()}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-500">No recent activities</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Admin-only Customer Management Tab */}
        {isAdmin && (
          <TabsContent value="customers" className="space-y-6">
            <Card className="bg-white/60 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-orange-600" />
                  Customer Management Portal
                  <Badge className={roleConfig.color}>{roleConfig.label}</Badge>
                </CardTitle>
                <CardDescription>
                  Manage customer accounts, assign data, and control access permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  👥 Customer management interface will appear here
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Admin-only Import Tab */}
        {isAdmin && (
          <TabsContent value="import" className="space-y-6">
            <Card className="bg-white/60 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-blue-600" />
                  Data Import Center
                  <Badge className={roleConfig.color}>{roleConfig.label} ACCESS</Badge>
                </CardTitle>
                <CardDescription>
                  Upload Excel files to update customer data weekly (Admin/Analyst only)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Import Templates</h3>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start">
                        <Download className="h-4 w-4 mr-2" />
                        Device Inventory Template
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Download className="h-4 w-4 mr-2" />
                        Risk Assessment Template
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Download className="h-4 w-4 mr-2" />
                        Network Data Template
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Download className="h-4 w-4 mr-2" />
                        Alerts Template
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-semibold">Upload Data</h3>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-sm text-gray-600 mb-4">
                        Drag and drop Excel files here, or click to browse
                      </p>
                      <Button>Select Files</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Other tabs with role-based content */}
        <TabsContent value="devices">
          <Card className="bg-white/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Device Inventory
                <Badge variant="outline">{isAdmin ? 'ADMIN VIEW' : 'READ-ONLY'}</Badge>
              </CardTitle>
              <CardDescription>
                {isAdmin ? `All system devices (${userRole} access)` : 'Your registered devices'}
                {!isAdmin && ' (Read-only view - updated weekly by admin)'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {devicesByCategory && Object.values(devicesByCategory).length > 0 ? (
                  Object.values(devicesByCategory)
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 5)
                    .map((category) => (
                      <div key={category.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <span className="text-sm font-medium">{category.name}</span>
                          <p className="text-xs text-gray-500">{category.count} devices</p>
                        </div>
                        <Badge variant="outline">{category.count}</Badge>
                      </div>
                    ))
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    📋 Device inventory table will appear here
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}