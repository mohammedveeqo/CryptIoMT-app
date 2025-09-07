'use client'

import { useUser, UserButton } from '@clerk/nextjs'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Upload, Users, Shield, Activity, Network, AlertTriangle, Download, FileSpreadsheet, User, Crown, Settings } from 'lucide-react'

export default function Dashboard() {
  const { user } = useUser()
  const currentUser = useQuery(api.users.getCurrentUser)
  
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

      {/* Customer Notice */}
      {!isAdmin && (
        <Card className="bg-blue-50/80 backdrop-blur-sm border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-lg font-semibold text-blue-900">
                  Welcome to Your Security Dashboard
                </p>
                <p className="text-sm text-blue-700">
                  Your dashboard data is managed and updated weekly by our security team. 
                  This is a read-only view of your cybersecurity posture.
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Last update: January 15, 2024 | Next update: January 22, 2024
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white/60 backdrop-blur-sm border-blue-200 hover:shadow-lg transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
            <Shield className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">1,247</div>
            <p className="text-xs text-gray-600">+12% from last week</p>
          </CardContent>
        </Card>

        <Card className="bg-white/60 backdrop-blur-sm border-green-200 hover:shadow-lg transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online Devices</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">1,189</div>
            <p className="text-xs text-gray-600">95.3% uptime</p>
          </CardContent>
        </Card>

        <Card className="bg-white/60 backdrop-blur-sm border-red-200 hover:shadow-lg transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">23</div>
            <p className="text-xs text-gray-600">Requires attention</p>
          </CardContent>
        </Card>

        <Card className="bg-white/60 backdrop-blur-sm border-purple-200 hover:shadow-lg transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Score</CardTitle>
            <Network className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700">7.2/10</div>
            <p className="text-xs text-gray-600">Medium risk level</p>
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
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm">Device health check completed</span>
                    <Badge variant="secondary">2 min ago</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-sm">Security scan passed</span>
                    <Badge variant="secondary">15 min ago</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <span className="text-sm">Firmware update available</span>
                    <Badge variant="secondary">1 hour ago</Badge>
                  </div>
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
              <div className="h-64 flex items-center justify-center text-gray-500">
                📋 Device inventory table will appear here
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}