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
  ArrowLeft
} from 'lucide-react';
import { Id } from '../../../../convex/_generated/dataModel';

import { useRouter } from 'next/navigation';

export default function ManageOrganizationPage() {
  const router = useRouter();
  const { user } = useUser();
  const { currentOrganization } = useOrganization();
  const [isEditing, setIsEditing] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'member' | 'admin'>('member');
  
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
  const assignDeviceOwner = useMutation(api.medicalDevices.assignDeviceOwner);
  const reassignAllDevices = useMutation(api.medicalDevices.reassignAllDevices);
  
  const [reassignDialogOpen, setReassignDialogOpen] = useState(false);
  const [reassignFromUser, setReassignFromUser] = useState<{ id: string, name: string } | null>(null);
  const [reassignToUser, setReassignToUser] = useState<string>("");
  const [reassignReason, setReassignReason] = useState("");

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
        <TabsList className="h-auto w-fit p-1 bg-muted/50">
          <TabsTrigger value="settings" className="flex items-center gap-2 px-6 py-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="members" className="flex items-center gap-2 px-6 py-2">
            <Users className="h-4 w-4" />
            Members
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
