"use client";

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useOrganization } from '../../../contexts/organization-context';
import { useUser } from '@clerk/nextjs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Building2,
  Users,
  Settings,
  Mail,
  Phone,
  MapPin,
  Crown,
  UserPlus,
  Trash2,
  Edit,
  Save,
  X,
  ArrowLeft,
  Shield,
  Link,
  FileText,
  Lock,
  Activity,
  Server,
  Database,
  Smartphone
} from 'lucide-react';
import { Id } from '../../../../convex/_generated/dataModel';

import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ManageOrganizationPage() {
  const router = useRouter();
  const { user } = useUser();
  const { currentOrganization } = useOrganization();
  const [isEditing, setIsEditing] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'member' | 'admin'>('member');
  
  // Security & Integrations State (Mock for UI Demo)
  const [mfaEnabled, setMfaEnabled] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState("30");
  const [passwordPolicy, setPasswordPolicy] = useState("strong");
  const [activeDirectoryStatus, setActiveDirectoryStatus] = useState("disconnected");
  
  // Get current user info
  const currentUser = useQuery(api.users.getCurrentUser);
  
  // Get organization members with stats
  const teamStats = useQuery(
    api.organizations.getTeamStats,
    currentOrganization ? { organizationId: currentOrganization._id } : "skip"
  );
  
  // Mutations
  const inviteUser = useMutation(api.organizations.inviteUserToOrganization);
  const updateOrganization = useMutation(api.organizations.updateOrganization);
  const removeMember = useMutation(api.organizations.removeMember);
  const updateMemberRole = useMutation(api.organizations.updateMemberRole);
  const assignDeviceOwner = useMutation(api.medicalDevices.assignDeviceOwner);
  const reassignAllDevices = useMutation(api.medicalDevices.reassignAllDevices);
  
  const [reassignDialogOpen, setReassignDialogOpen] = useState(false);
  const [reassignFromUser, setReassignFromUser] = useState<{ id: string, name: string } | null>(null);
  const [reassignToUser, setReassignToUser] = useState<string>("");
  const [reassignReason, setReassignReason] = useState("");

  const [editRoleDialogOpen, setEditRoleDialogOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<{ id: string, name: string, role: string } | null>(null);
  const [newRole, setNewRole] = useState<'admin' | 'member'>('member');

  const [orgData, setOrgData] = useState({
    name: currentOrganization?.name || '',
    type: currentOrganization?.type || 'hospital',
    contactEmail: currentOrganization?.contactEmail || '',
    contactPhone: currentOrganization?.contactPhone || '',
    address: currentOrganization?.address || ''
  });
  
  // Check if current user is owner or admin of the organization
  const userMembership = teamStats?.find(
    member => member.user?.email === user?.emailAddresses[0]?.emailAddress
  );
  const canManage = userMembership?.memberRole === 'owner' || userMembership?.memberRole === 'admin' || currentUser?.role === 'admin' || currentUser?.role === 'super_admin';
  
  if (!currentOrganization) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="p-8 text-center">
          <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">No Organization Selected</h1>
          <p className="text-gray-600">Please select an organization to manage.</p>
        </Card>
      </div>
    );
  }
  
  if (!canManage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="p-8 text-center">
          <Settings className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to manage this organization.</p>
        </Card>
      </div>
    );
  }
  
  const handleSaveSettings = async () => {
    try {
      await updateOrganization({
        organizationId: currentOrganization._id,
        name: orgData.name,
        type: orgData.type as any,
        contactEmail: orgData.contactEmail,
        contactPhone: orgData.contactPhone,
        address: orgData.address
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update organization:', error);
    }
  };
  
  const handleInviteUser = async () => {
    if (!inviteEmail.trim()) return;
    
    try {
      await inviteUser({
        organizationId: currentOrganization._id,
        email: inviteEmail,
        role: inviteRole
      });
      setInviteDialogOpen(false);
      setInviteEmail('');
      setInviteRole('member');
    } catch (error) {
      console.error('Failed to invite user:', error);
    }
  };
  
  const handleRemoveMember = async (membershipId: Id<"organizationMembers">) => {
    try {
      await removeMember({ membershipId });
    } catch (error) {
      console.error('Failed to remove member:', error);
    }
  };

  const handleReassign = async () => {
    if (!reassignFromUser || !reassignToUser) return;
    
    try {
      await reassignAllDevices({
        organizationId: currentOrganization!._id,
        fromUserId: reassignFromUser.id as Id<"users">,
        toUserId: reassignToUser === "unassigned" ? undefined : (reassignToUser as Id<"users">),
        reason: reassignReason
      });
      setReassignDialogOpen(false);
      setReassignFromUser(null);
      setReassignToUser("");
      setReassignReason("");
    } catch (error) {
      console.error('Failed to reassign devices:', error);
    }
  };

  const handleUpdateRole = async () => {
    if (!memberToEdit) return;

    try {
      await updateMemberRole({
        membershipId: memberToEdit.id as Id<"organizationMembers">,
        role: newRole
      });
      setEditRoleDialogOpen(false);
      setMemberToEdit(null);
    } catch (error) {
      console.error('Failed to update member role:', error);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <div className="flex items-center gap-2">
          <Badge 
            variant="outline" 
            className="bg-blue-50 text-blue-700 border-blue-200 px-3 py-1"
          >
            {currentOrganization?.type}
          </Badge>
          <Button variant="outline" onClick={() => router.push('/dashboard')}>
             Back to Dashboard
          </Button>
        </div>
      </div>

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList className="h-auto w-fit p-1 bg-muted/50 flex-wrap">
          <TabsTrigger value="settings" className="flex items-center gap-2 px-6 py-2">
            <Settings className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="members" className="flex items-center gap-2 px-6 py-2">
            <Users className="h-4 w-4" />
            Team
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2 px-6 py-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2 px-6 py-2">
            <Link className="h-4 w-4" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2 px-6 py-2">
            <FileText className="h-4 w-4" />
            Audit Logs
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2 px-6 py-2">
            <Building2 className="h-4 w-4" />
            Billing
          </TabsTrigger>
        </TabsList>
          
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Organization Information
                    </CardTitle>
                    <CardDescription>
                      Manage your organization's basic information and contact details
                    </CardDescription>
                  </div>
                  {!isEditing ? (
                    <Button onClick={() => setIsEditing(true)} variant="outline">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button onClick={handleSaveSettings}>
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setIsEditing(false);
                          setOrgData({
                            name: currentOrganization.name,
                            type: currentOrganization.type,
                            contactEmail: currentOrganization.contactEmail || '',
                            contactPhone: currentOrganization.contactPhone || '',
                            address: currentOrganization.address || ''
                          });
                        }}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Organization Name</Label>
                    <Input
                      id="name"
                      value={orgData.name}
                      onChange={(e) => setOrgData({ ...orgData, name: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="type">Organization Type</Label>
                    <Select 
                      value={orgData.type} 
                      onValueChange={(value) => setOrgData({ ...orgData, type: value })}
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hospital">Hospital</SelectItem>
                        <SelectItem value="clinic">Clinic</SelectItem>
                        <SelectItem value="research">Research Institution</SelectItem>
                        <SelectItem value="vendor">Medical Device Vendor</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Contact Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={orgData.contactEmail}
                      onChange={(e) => setOrgData({ ...orgData, contactEmail: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">Contact Phone</Label>
                    <Input
                      id="phone"
                      value={orgData.contactPhone}
                      onChange={(e) => setOrgData({ ...orgData, contactPhone: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={orgData.address}
                    onChange={(e) => setOrgData({ ...orgData, address: e.target.value })}
                    disabled={!isEditing}
                    rows={3}
                  />
                </div>

                <div className="pt-4 border-t">
                  <h3 className="text-sm font-medium mb-3">Organization Preferences</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        id="allowRegistration"
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        disabled={!isEditing}
                        defaultChecked
                      />
                      <Label htmlFor="allowRegistration" className="font-normal">Allow User Registration</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        id="requireApproval"
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        disabled={!isEditing}
                        defaultChecked
                      />
                      <Label htmlFor="requireApproval" className="font-normal">Require Admin Approval</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        id="notifications"
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        disabled={!isEditing}
                        defaultChecked
                      />
                      <Label htmlFor="notifications" className="font-normal">Enable Email Notifications</Label>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="text-sm text-muted-foreground">
                      Advanced actions
                    </div>
                    <div className="flex gap-2">
                      <Button asChild variant="outline">
                        <Link href="/dashboard/settings">Advanced Organization Settings</Link>
                      </Button>
                      {(currentUser?.role === 'admin' || currentUser?.role === 'super_admin') && (
                        <Button asChild>
                          <Link href="/admin">Bulk Device Import (Admin)</Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="members" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Team Management
                    </CardTitle>
                    <CardDescription>
                      Manage staff access and device ownership responsibilities
                    </CardDescription>
                  </div>
                  <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Invite Member
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Invite New Member</DialogTitle>
                        <DialogDescription>
                          Send an invitation to join your organization
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="invite-email">Email Address</Label>
                          <Input
                            id="invite-email"
                            type="email"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            placeholder="Enter email address"
                          />
                        </div>
                        <div>
                          <Label htmlFor="invite-role">Role</Label>
                          <Select value={inviteRole} onValueChange={(value: any) => setInviteRole(value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="member">Member</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button onClick={handleInviteUser} className="w-full">
                          Send Invitation
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Staff Member</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Devices</TableHead>
                      <TableHead>High Risk</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamStats?.map((member) => (
                      <TableRow key={member._id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{member.user?.name || 'Unknown'}</span>
                            <span className="text-xs text-muted-foreground">{member.user?.email}</span>
                            {member.user?.department && (
                                <span className="text-xs text-muted-foreground">{member.user.department}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={member.memberRole === 'owner' ? 'default' : 'secondary'}
                            className={member.memberRole === 'owner' ? 'bg-yellow-600' : ''}
                          >
                            {member.memberRole === 'owner' && <Crown className="h-3 w-3 mr-1" />}
                            {member.memberRole}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={member.memberStatus === 'active' ? 'default' : 'secondary'}
                            className={member.memberStatus === 'active' ? 'bg-green-600' : 'bg-gray-500'}
                          >
                            {member.memberStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>
                            <div className="font-medium">{member.deviceCount || 0}</div>
                        </TableCell>
                        <TableCell>
                            {(member.highRiskCount || 0) > 0 ? (
                                <Badge variant="destructive" className="bg-orange-500 hover:bg-orange-600">
                                    {member.highRiskCount} High Risk
                                </Badge>
                            ) : (
                                <span className="text-muted-foreground text-sm">-</span>
                            )}
                        </TableCell>
                        <TableCell>
                          {member.lastLogin ? new Date(member.lastLogin).toLocaleDateString() : 'Never'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/dashboard?tab=devices&owner=${member.userId}`)}
                            >
                                View Devices
                            </Button>
                            {(member.deviceCount || 0) > 0 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setReassignFromUser({ 
                                            id: member.userId!, 
                                            name: member.user?.name || member.user?.email || 'Unknown' 
                                        });
                                        setReassignDialogOpen(true);
                                    }}
                                >
                                    Reassign All
                                </Button>
                            )}
                            {member.memberRole !== 'owner' && (
                                <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                      setMemberToEdit({
                                          id: member._id,
                                          name: member.user?.name || member.user?.email || 'Unknown',
                                          role: member.memberRole
                                      });
                                      setNewRole(member.memberRole as 'admin' | 'member');
                                      setEditRoleDialogOpen(true);
                                  }}
                                  className="mr-1"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRemoveMember(member._id)} // Using _id which is membershipId from convex return
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                                </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Dialog open={reassignDialogOpen} onOpenChange={setReassignDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reassign Devices</DialogTitle>
                        <DialogDescription>
                            Transfer all devices from {reassignFromUser?.name} to another team member.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Transfer to</Label>
                            <Select value={reassignToUser} onValueChange={setReassignToUser}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select team member" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="unassigned">Unassigned (Remove Ownership)</SelectItem>
                                    {teamStats?.filter(m => m.userId !== reassignFromUser?.id).map(member => (
                                        <SelectItem key={member.userId} value={member.userId!}>
                                            {member.user?.name || member.user?.email}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Reason for Transfer</Label>
                            <Textarea 
                                value={reassignReason}
                                onChange={(e) => setReassignReason(e.target.value)}
                                placeholder="e.g., Staff member left, Role change..."
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setReassignDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleReassign} disabled={!reassignToUser}>Confirm Reassignment</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={editRoleDialogOpen} onOpenChange={setEditRoleDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Update Member Role</DialogTitle>
                        <DialogDescription>
                            Change the role for {memberToEdit?.name}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Role</Label>
                            <Select value={newRole} onValueChange={(value: any) => setNewRole(value)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="member">Member</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setEditRoleDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleUpdateRole}>Update Role</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Authentication Policies
                  </CardTitle>
                  <CardDescription>
                    Configure how your team accesses the platform
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Multi-Factor Authentication (MFA)</Label>
                      <p className="text-sm text-muted-foreground">
                        Require all users to use 2FA
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={mfaEnabled}
                        onChange={(e) => setMfaEnabled(e.target.checked)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Session Timeout</Label>
                    <Select value={sessionTimeout} onValueChange={setSessionTimeout}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 Minutes</SelectItem>
                        <SelectItem value="30">30 Minutes</SelectItem>
                        <SelectItem value="60">1 Hour</SelectItem>
                        <SelectItem value="240">4 Hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Password Policy</Label>
                    <Select value={passwordPolicy} onValueChange={setPasswordPolicy}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard (8+ chars)</SelectItem>
                        <SelectItem value="strong">Strong (12+ chars, special)</SelectItem>
                        <SelectItem value="strict">Strict (16+ chars, rotation)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Compliance Frameworks
                  </CardTitle>
                  <CardDescription>
                    Select frameworks to benchmark against
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { id: 'hipaa', label: 'HIPAA', desc: 'Health Insurance Portability and Accountability Act', active: true },
                    { id: 'nist', label: 'NIST CSF', desc: 'National Institute of Standards and Technology', active: true },
                    { id: 'gdpr', label: 'GDPR', desc: 'General Data Protection Regulation', active: false },
                    { id: 'iso', label: 'ISO 27001', desc: 'Information Security Management', active: false },
                  ].map((framework) => (
                    <div key={framework.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                      <input 
                        type="checkbox" 
                        defaultChecked={framework.active}
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <Label className="font-medium cursor-pointer">{framework.label}</Label>
                        <p className="text-xs text-muted-foreground">{framework.desc}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Risk Thresholds
                </CardTitle>
                <CardDescription>
                  Define when alerts should be triggered
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <Label>Critical Risk Score Threshold</Label>
                      <span className="text-sm font-medium text-red-600">8.0+</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-red-500 w-[80%]"></div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Devices with a risk score above 8.0 will trigger critical alerts.</p>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <Label>Vulnerability Scan Frequency</Label>
                      <span className="text-sm font-medium">Daily</span>
                    </div>
                    <div className="flex gap-2">
                      {['Hourly', 'Daily', 'Weekly', 'Monthly'].map((freq) => (
                        <Button 
                          key={freq} 
                          variant={freq === 'Daily' ? 'default' : 'outline'}
                          size="sm"
                          className="flex-1"
                        >
                          {freq}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { 
                  id: 'ad', 
                  name: 'Active Directory', 
                  type: 'Identity', 
                  status: activeDirectoryStatus, 
                  icon: Users,
                  desc: 'Sync user accounts and organizational units' 
                },
                { 
                  id: 'splunk', 
                  name: 'Splunk', 
                  type: 'SIEM', 
                  status: 'connected', 
                  icon: Activity,
                  desc: 'Forward security logs and alerts' 
                },
                { 
                  id: 'servicenow', 
                  name: 'ServiceNow', 
                  type: 'ITSM', 
                  status: 'disconnected', 
                  icon: Server,
                  desc: 'Create tickets for critical vulnerabilities' 
                },
                { 
                  id: 'epic', 
                  name: 'Epic EHR', 
                  type: 'EHR', 
                  status: 'disconnected', 
                  icon: Database,
                  desc: 'Contextualize devices with patient data' 
                },
                { 
                  id: 'cisco', 
                  name: 'Cisco ISE', 
                  type: 'NAC', 
                  status: 'connected', 
                  icon: Shield,
                  desc: 'Enforce network access policies' 
                },
                { 
                  id: 'jamf', 
                  name: 'Jamf', 
                  type: 'MDM', 
                  status: 'disconnected', 
                  icon: Smartphone,
                  desc: 'Mobile device management sync' 
                }
              ].map((integration) => (
                <Card key={integration.id} className="overflow-hidden">
                  <div className={`h-2 ${integration.status === 'connected' ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <integration.icon className="h-6 w-6 text-gray-700" />
                      </div>
                      <Badge variant={integration.status === 'connected' ? 'default' : 'outline'}>
                        {integration.status === 'connected' ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <CardTitle className="mt-4">{integration.name}</CardTitle>
                    <CardDescription>{integration.type}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4 h-10">{integration.desc}</p>
                    <Button 
                      variant={integration.status === 'connected' ? 'outline' : 'default'} 
                      className="w-full"
                    >
                      {integration.status === 'connected' ? 'Configure' : 'Connect'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="audit" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Audit Logs
                    </CardTitle>
                    <CardDescription>
                      Track all activities within your organization
                    </CardDescription>
                  </div>
                  <Button variant="outline">Export CSV</Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Resource</TableHead>
                      <TableHead>IP Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      { time: '2 mins ago', user: 'Dr. Sarah Smith', action: 'Updated Risk Policy', resource: 'Global Settings', ip: '10.0.1.42' },
                      { time: '15 mins ago', user: 'John Doe (Admin)', action: 'Invited Member', resource: 'james.w@hospital.org', ip: '192.168.1.5' },
                      { time: '1 hour ago', user: 'System', action: 'Auto-scan Completed', resource: 'Network Segment B', ip: 'Localhost' },
                      { time: '3 hours ago', user: 'Dr. Sarah Smith', action: 'Resolved Alert', resource: 'MRI-Scanner-04', ip: '10.0.1.42' },
                      { time: 'Yesterday', user: 'Mike Johnson', action: 'Exported Report', resource: 'Monthly Compliance', ip: '192.168.2.10' },
                    ].map((log, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-sm text-gray-500">{log.time}</TableCell>
                        <TableCell className="font-medium">{log.user}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-gray-50">
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{log.resource}</TableCell>
                        <TableCell className="text-sm text-gray-500 font-mono">{log.ip}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Billing & Subscription
                </CardTitle>
                <CardDescription>
                  Manage your organization's subscription and billing information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-blue-900">Current Plan</h3>
                        <p className="text-blue-700 capitalize">{currentOrganization.subscriptionTier} Plan</p>
                      </div>
                      <Badge className="bg-blue-600 text-white">
                        Active
                      </Badge>
                    </div>
                  </div>
                  <p className="text-gray-600">Billing management interface will be implemented here.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
    </div>
  );
}
