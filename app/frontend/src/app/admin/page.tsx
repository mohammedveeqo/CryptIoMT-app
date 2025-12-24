'use client'

import { useRouter } from 'next/navigation'

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
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
  AlertTriangle,
  Server,
  Lock,
  Globe,
  Database,
  CreditCard,
  FileText
} from 'lucide-react'
import { useState } from 'react'
import * as XLSX from "xlsx"
import { Id, Doc } from '../../../convex/_generated/dataModel'
import { DeviceImportDialog } from './_components/device-import-dialog'
import { impersonateUser } from './actions';

export default function AdminPanel() {
  const router = useRouter()
  const { user, isLoaded: isClerkLoaded } = useUser()
  const [searchTerm, setSearchTerm] = useState('')
  const [showDebug, setShowDebug] = useState(false)
  const [editRoleDialogOpen, setEditRoleDialogOpen] = useState(false)
  const [userToEdit, setUserToEdit] = useState<Doc<"users"> | null>(null)
  const [newRole, setNewRole] = useState<UserRole>("customer")
  
  // Mock State for Admin Features
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [globalMfa, setGlobalMfa] = useState(false)
  const [registrationEnabled, setRegistrationEnabled] = useState(true)
  
  // Get current user info
  const currentUser = useQuery(api.users.getCurrentUser)
  const updateUserRole = useMutation(api.users.updateUserRole)
  
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

  const handleUpdateUserRole = async () => {
    if (!userToEdit) return
    try {
      await updateUserRole({
        userId: userToEdit._id,
        newRole: newRole
      })
      setEditRoleDialogOpen(false)
      setUserToEdit(null)
    } catch (error) {
      console.error('Failed to update user role:', error)
      alert('Failed to update user role')
    }
  }

  // Update the handleImpersonateUser function
  const handleImpersonateUser = async (userId: string) => {
    if (!userId) {
      alert('Cannot impersonate user: No User ID found. The user may not have completed registration.');
      return;
    }

    try {
      console.log('Starting impersonation for user:', userId);
      
      const result = await impersonateUser(userId);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      if (result.impersonationUrl) {
        window.location.href = result.impersonationUrl;
      }
    } catch (error) {
      console.error('Impersonation failed:', error);
      alert('Failed to impersonate user: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

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
              <Button 
                variant="outline" 
                onClick={() => router.push('/dashboard')}
                className="border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                Back to Dashboard
              </Button>
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
          <TabsList className="sticky top-16 z-20 bg-white/80 backdrop-blur-sm border-b border-gray-200/50 flex-wrap h-auto p-2">
            <TabsTrigger value="organizations" className="gap-2"><Building2 className="h-4 w-4" /> Organizations</TabsTrigger>
            <TabsTrigger value="users" className="gap-2"><Users className="h-4 w-4" /> Users</TabsTrigger>
            <TabsTrigger value="security" className="gap-2"><Shield className="h-4 w-4" /> Security</TabsTrigger>
            <TabsTrigger value="billing" className="gap-2"><CreditCard className="h-4 w-4" /> Billing</TabsTrigger>
            <TabsTrigger value="logs" className="gap-2"><FileText className="h-4 w-4" /> Audit Logs</TabsTrigger>
            <TabsTrigger value="system" className="gap-2"><Settings className="h-4 w-4" /> System</TabsTrigger>
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
              <DeviceImportDialog organizationId={org._id} />
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
                            onClick={() => handleImpersonateUser(convexUser.clerkId)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View As
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setUserToEdit(convexUser)
                              setNewRole(convexUser.role as UserRole)
                              setEditRoleDialogOpen(true)
                            }}
                          >
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

          <TabsContent value="security" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Global Security Policies
                  </CardTitle>
                  <CardDescription>
                    Enforce security standards across all organizations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h4 className="font-medium">Enforce Global MFA</h4>
                      <p className="text-sm text-gray-500">Require 2FA for all users platform-wide</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={globalMfa}
                      onChange={(e) => setGlobalMfa(e.target.checked)}
                      className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h4 className="font-medium">Admin Approval for New Orgs</h4>
                      <p className="text-sm text-gray-500">Manually approve new organization signups</p>
                    </div>
                    <input type="checkbox" defaultChecked className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Session Timeout (Minutes)</h4>
                    <Input type="number" defaultValue={60} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    IP & Geo-Blocking
                  </CardTitle>
                  <CardDescription>
                    Restrict access based on location and IP
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Blocked Countries</h4>
                    <div className="flex gap-2 flex-wrap">
                      {['North Korea', 'Iran', 'Russia'].map(country => (
                        <Badge key={country} variant="destructive" className="flex items-center gap-1">
                          {country} <Trash2 className="h-3 w-3 cursor-pointer" />
                        </Badge>
                      ))}
                      <Button variant="outline" size="sm" className="h-6 text-xs">+ Add</Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Whitelisted IPs (Admin Access)</h4>
                    <Input placeholder="e.g., 192.168.1.0/24" />
                    <p className="text-xs text-gray-500">Only allow admin login from these subnets</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Monthly Recurring Revenue</CardTitle>
                  <CreditCard className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$42,500</div>
                  <p className="text-xs text-green-600">+12% from last month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                  <Users className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">156</div>
                  <p className="text-xs text-gray-500">8 Enterprise, 42 Pro, 106 Basic</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
                  <Activity className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">2.4%</div>
                  <p className="text-xs text-gray-500">Last 30 days</p>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                 <div className="space-y-4">
                  {[
                    { org: 'City General Hospital', plan: 'Enterprise', amount: '$2,500', date: 'Today', status: 'Succeeded' },
                    { org: 'Westside Clinic', plan: 'Pro', amount: '$499', date: 'Yesterday', status: 'Succeeded' },
                    { org: 'Neuro Research Inst.', plan: 'Basic', amount: '$99', date: 'Oct 24', status: 'Failed' },
                  ].map((tx, i) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{tx.org}</p>
                        <p className="text-xs text-gray-500">{tx.plan} Plan • {tx.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{tx.amount}</p>
                        <span className={`text-xs ${tx.status === 'Succeeded' ? 'text-green-600' : 'text-red-600'}`}>{tx.status}</span>
                      </div>
                    </div>
                  ))}
                 </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>System Audit Logs</CardTitle>
                    <CardDescription>Track all administrative actions across the platform</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">Export CSV</Button>
                    <Button variant="outline" size="sm">Filter</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-0">
                  {[
                    { action: 'User Banned', actor: 'Admin (You)', target: 'john.doe@malicious.com', time: '10 mins ago', type: 'security' },
                    { action: 'Org Created', actor: 'System', target: 'Northside Cardio', time: '1 hour ago', type: 'system' },
                    { action: 'Schema Update', actor: 'Developer', target: 'medicalDevices', time: '3 hours ago', type: 'tech' },
                    { action: 'Failed Login', actor: 'Unknown', target: 'Admin Portal', time: 'Yesterday', type: 'alert' },
                  ].map((log, i) => (
                    <div key={i} className="flex items-center justify-between py-3 border-b last:border-0">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          log.type === 'security' ? 'bg-red-500' : 
                          log.type === 'alert' ? 'bg-orange-500' : 
                          log.type === 'system' ? 'bg-blue-500' : 'bg-gray-500'
                        }`} />
                        <div>
                          <p className="font-medium text-sm">{log.action}</p>
                          <p className="text-xs text-gray-500">by {log.actor}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-mono">{log.target}</p>
                        <p className="text-xs text-gray-500">{log.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>Configure platform-wide settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg bg-red-50 border-red-100">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                    <div>
                      <h4 className="font-semibold text-red-900">Maintenance Mode</h4>
                      <p className="text-sm text-red-700">Disable access for all non-admin users</p>
                    </div>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={maintenanceMode} 
                    onChange={(e) => setMaintenanceMode(e.target.checked)}
                    className="h-6 w-6 rounded border-red-300 text-red-600 focus:ring-red-500" 
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-medium">General Settings</h3>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Allow New Registrations</label>
                      <input 
                        type="checkbox" 
                        checked={registrationEnabled} 
                        onChange={(e) => setRegistrationEnabled(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600" 
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Public API Access</label>
                      <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-blue-600" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Platform Name</label>
                      <Input defaultValue="CryptIoMT Platform" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium">Email & Notifications</h3>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Support Email</label>
                      <Input defaultValue="support@cryptiomt.com" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">System From Name</label>
                      <Input defaultValue="CryptIoMT Security Team" />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t">
                  <h3 className="font-medium mb-4">Database & Storage</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-gray-50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Database className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">Database Usage</span>
                        </div>
                        <div className="text-2xl font-bold">1.2 GB</div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                          <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '15%' }}></div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-gray-50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Server className="h-4 w-4 text-green-600" />
                          <span className="font-medium">API Latency</span>
                        </div>
                        <div className="text-2xl font-bold">45ms</div>
                        <p className="text-xs text-green-600">Healthy</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-gray-50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Globe className="h-4 w-4 text-purple-600" />
                          <span className="font-medium">CDN Bandwidth</span>
                        </div>
                        <div className="text-2xl font-bold">450 GB</div>
                        <p className="text-xs text-gray-500">This month</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={editRoleDialogOpen} onOpenChange={setEditRoleDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User Role</DialogTitle>
              <DialogDescription>
                Change the role for {userToEdit?.name || userToEdit?.email}.
                This will affect their permissions across the platform.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">
                  Role
                </Label>
                <Select
                  value={newRole}
                  onValueChange={(value) => setNewRole(value as UserRole)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="analyst">Analyst</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditRoleDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateUserRole}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
