'use client'

import { useUser } from '@clerk/nextjs'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { UserRoles, UserRole, isAdminRole } from '../../../convex/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { 
  Building2, 
  Users, 
  Settings, 
  Plus, 
  Search, 
  Eye, 
  Upload, 
  Edit,
  Trash2,
  Shield,
  Activity,
  AlertTriangle
} from 'lucide-react'
import { useState } from 'react'
import * as XLSX from "xlsx"
import { Id, Doc } from '../../../convex/_generated/dataModel'

export default function AdminPanel() {
  const { user, isLoaded: isClerkLoaded } = useUser()
  const [searchTerm, setSearchTerm] = useState('')
  const [showDebug, setShowDebug] = useState(false)
  const [uploadingOrg, setUploadingOrg] = useState<string | null>(null)
  const [uploadResults, setUploadResults] = useState<{[key: string]: any}>({})
  
  // Get current user info
  const currentUser = useQuery(api.users.getCurrentUser)
  const updateUserRole = useMutation(api.users.updateUserRole)
  const importDevices = useMutation(api.medicalDevices.importMedicalDevices)
  const clearDevices = useMutation(api.medicalDevices.clearOrganizationDevices)
  
  // Debug information
  if (isClerkLoaded && currentUser !== undefined) {
    console.log('Clerk User:', user)
    console.log('Convex User:', currentUser)
  }
  
  // Type-safe role checking using shared types
  const userRole = currentUser && currentUser.user !== null ? currentUser.role as UserRole : null
  const isAdmin = isAdminRole(userRole)
  
  // Only fetch these if user is admin
  const organizations = useQuery(
    api.organizations.getAllOrganizations,
    isAdmin ? undefined : "skip"
  )
  
  const systemStats = useQuery(
    api.admin.getSystemStats,
    isAdmin ? undefined : "skip"
  )
  
  const allUsers = useQuery(
    api.users.getAllUsers,
    isAdmin ? undefined : "skip"
  )

  // Add the new query
const getOrganizationOwner = (organizationId: Id<"organizations">) => {
  return useQuery(api.organizations.getOrganizationOwner, { organizationId });
};
  // Update the handleImpersonateUser function
  const handleImpersonateUser = async (userId: string) => {
    try {
      console.log('Starting impersonation for user:', userId);
      
      const response = await fetch('/api/impersonate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Impersonation request failed');
      }

      const data = await response.json();
      
      if (data.impersonationUrl) {
        console.log('Redirecting to impersonation URL:', data.impersonationUrl);
        // Redirect to the impersonation URL
        window.location.href = data.impersonationUrl;
      } else {
        throw new Error('No impersonation URL received');
      }
    } catch (error) {
      console.error('Impersonation failed:', error);
      alert('Failed to impersonate user: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleFileUpload = async (orgId: string, file: File) => {
    setUploadingOrg(orgId)
    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: "array" })
      
      const sheetName = "Medical Device"
      if (!workbook.Sheets[sheetName]) {
        throw new Error(`Sheet "${sheetName}" not found`)
      }

      const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName])
      
      await clearDevices({ organizationId: orgId as Id<"organizations"> })
      const result = await importDevices({
        organizationId: orgId as Id<"organizations">,
        devices: jsonData
      })
      
      setUploadResults(prev => ({ ...prev, [orgId]: result }))
    } catch (error) {
      console.error("Upload failed:", error)
      setUploadResults(prev => ({ ...prev, [orgId]: { error: String(error) } }))
    } finally {
      setUploadingOrg(null)
    }
  }

  const handleSetupAdmin = async () => {
    if (!currentUser || currentUser.user === null) return
    
    try {
      await updateUserRole({ 
        userId: currentUser._id, 
        newRole: 'admin' as UserRole 
      })
      window.location.reload()
    } catch (error) {
      console.error('Failed to setup admin:', error)
    }
  }

  if (!isClerkLoaded || currentUser === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-2xl font-bold text-gray-900">Access Denied</CardTitle>
            <CardDescription>
              You don't have admin privileges to access this panel.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Development Mode</p>
                    <p className="text-sm text-yellow-700">Click below to grant yourself admin access</p>
                  </div>
                </div>
              </div>
              <Button 
                onClick={handleSetupAdmin}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                <Shield className="h-4 w-4 mr-2" />
                Grant Admin Access
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Authentication required</p>
        </div>
      </div>
    )
  }

  if (currentUser.role !== 'admin' && currentUser.role !== 'super_admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-2xl font-bold text-gray-900">Access Denied</CardTitle>
            <CardDescription>
              Admin privileges required to access this panel.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (organizations === null || systemStats === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading system data...</p>
        </div>
      </div>
    )
  }

  const filteredOrganizations = organizations?.filter((org: Doc<"organizations">) => 
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.type.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
              <p className="text-gray-600">Manage organizations, users, and system settings</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge className="bg-orange-600 text-white">
                {currentUser?.role?.toUpperCase()}
              </Badge>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                New Organization
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Organizations</CardTitle>
              <Building2 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemStats?.totalOrganizations || 0}</div>
              <p className="text-xs text-gray-600">Active organizations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemStats?.totalUsers || 0}</div>
              <p className="text-xs text-gray-600">Across all organizations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
              <Activity className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemStats?.totalDevices || 0}</div>
              <p className="text-xs text-gray-600">Monitored devices</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemStats?.criticalAlerts || 0}</div>
              <p className="text-xs text-gray-600">System-wide</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="organizations" className="space-y-6">
          <TabsList>
            <TabsTrigger value="organizations">Organizations</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="system">System Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="organizations" className="space-y-6">
            {/* Organizations Management */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Organizations Management</CardTitle>
                    <CardDescription>Manage hospitals, clinics, and companies</CardDescription>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search organizations..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
<CardContent>
  <div className="space-y-4">
    {filteredOrganizations.length > 0 ? (
      filteredOrganizations.map((org) => (
        <div key={org._id} className="space-y-2">
          <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{org.name}</h3>
                <p className="text-sm text-gray-600">{org.type} • {org.contactEmail}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant={org.isActive ? "default" : "secondary"}>
                    {org.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <Badge variant="outline">{org.subscriptionTier}</Badge>
                  <span className="text-xs text-gray-500">
                    {org.memberCount || 0} members
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  console.log('View As button clicked for org creator:', org.createdBy);
                  handleImpersonateUser(org.createdBy);
                }}
              >
                <Eye className="h-4 w-4 mr-1" />
                View As Owner
              </Button>
              <div className="relative">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(org._id, file)
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-1" />
                  Import Devices
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))
    ) : (
      <p className="text-gray-500">No organizations found or loading...</p>
    )}
  </div>
</CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Users Management</CardTitle>
                <CardDescription>Manage system users and their roles</CardDescription>
              </CardHeader>
              <CardContent>
                {allUsers && allUsers.length > 0 ? (
                  <div className="space-y-4">
                    {allUsers.map((convexUser: Doc<"users">) => (
                      <div key={convexUser._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <Users className="h-5 w-5 text-gray-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{convexUser.name || 'Unknown User'}</h3>
                            <p className="text-sm text-gray-600">{convexUser.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={convexUser.role === 'super_admin' ? 'default' : convexUser.role === 'admin' ? 'secondary' : 'outline'}>
                            {convexUser.role || 'customer'}
                          </Badge>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleImpersonateUser(convexUser._id)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View As
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-1" />
                            Edit Role
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No users found or loading...</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>Configure system-wide settings</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">System settings interface coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}