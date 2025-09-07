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


export default function AdminPanel() {
  const { user, isLoaded: isClerkLoaded } = useUser()
  const [searchTerm, setSearchTerm] = useState('')
  const [showDebug, setShowDebug] = useState(false)
  
  // Get current user info
  const currentUser = useQuery(api.users.getCurrentUser)
  const updateUserRole = useMutation(api.users.updateUserRole)
  
  // Debug information
  if (isClerkLoaded && currentUser !== undefined) {
    console.log('Clerk User:', user)
    console.log('Convex User:', currentUser)
  }
  
  // Type-safe role checking using shared types
  const userRole = currentUser && '_id' in currentUser ? currentUser.role as UserRole : null
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

  // Handle admin setup
  const handleSetupAdmin = async () => {
    if (currentUser && '_id' in currentUser && currentUser._id) {
      try {
        await updateUserRole({
          userId: currentUser._id,
          newRole: UserRoles.SUPER_ADMIN as UserRole
        })
        window.location.reload()
      } catch (error) {
        console.error("Error updating role:", error)
      }
    }
  }

  // Loading state
  if (!isClerkLoaded || currentUser === undefined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  // If user doesn't have admin role, show setup option
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8">
            <CardHeader>
              <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <CardTitle className="text-center">Admin Access Required</CardTitle>
              <CardDescription className="text-center">
                You need admin privileges to access this panel.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Debug Information Toggle */}
              <div className="text-center">
                <Button 
                  variant="outline" 
                  onClick={() => setShowDebug(!showDebug)}
                  className="mb-4"
                >
                  {showDebug ? 'Hide' : 'Show'} Debug Info
                </Button>
              </div>
              
              {showDebug && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Clerk User ID:</h3>
                    <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">{user?.id}</pre>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Convex User:</h3>
                    <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                      {JSON.stringify(currentUser, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
              
              <div className="text-center space-y-4">
                <p className="text-gray-600">
                  Current role: <Badge variant="secondary">{userRole || 'None'}</Badge>
                </p>
                <p className="text-gray-600">
                  Email: <span className="font-semibold">{currentUser && '_id' in currentUser ? currentUser.email : user?.emailAddresses?.[0]?.emailAddress || 'N/A'}</span>
                </p>
                
                <Button
                  className="w-full max-w-md"
                  onClick={handleSetupAdmin}
                  disabled={userRole === UserRoles.SUPER_ADMIN}
                >
                  {userRole === UserRoles.SUPER_ADMIN
                    ? 'Already Super Admin'
                    : 'Set as Super Admin'}
                </Button>
                
                <p className="text-sm text-gray-500 mt-4">
                  This will promote your account to super admin status, giving you full access to the admin panel.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Not authenticated
  if (!user || !currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="p-8 text-center">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h1>
          <p className="text-gray-600">Please sign in to access the admin panel.</p>
        </Card>
      </div>
    )
  }

  // Not admin
  if (currentUser.role !== 'admin' && currentUser.role !== 'super_admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="p-8 text-center">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don't have permission to access the admin panel.</p>
          <p className="text-sm text-gray-500">Current role: {currentUser.role}</p>
          <Button 
            onClick={() => window.location.href = '/setup'}
            className="mt-4 bg-blue-600 hover:bg-blue-700"
          >
            Create Admin Account
          </Button>
        </Card>
      </div>
    )
  }

  // Error state
  if (organizations === null || systemStats === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="p-8 text-center">
          <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600">There was an error loading the admin panel data.</p>
        </Card>
      </div>
    )
  }

  const filteredOrganizations = organizations?.filter(org => 
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

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* System Stats */}
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

        {/* Main Content */}
        <Tabs defaultValue="organizations" className="space-y-6">
          <TabsList>
            <TabsTrigger value="organizations">Organizations</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="system">System Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="organizations" className="space-y-6">
            {/* Search and Filters */}
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
                  {filteredOrganizations.map((org) => (
                    <div key={org._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
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
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View As
                        </Button>
                        <Button variant="outline" size="sm">
                          <Upload className="h-4 w-4 mr-1" />
                          Import Data
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage users across all organizations</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">User management interface will be implemented here.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>Configure system-wide settings and preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">System settings interface will be implemented here.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}