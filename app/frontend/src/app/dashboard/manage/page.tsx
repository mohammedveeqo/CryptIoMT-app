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
  X
} from 'lucide-react';
import { Id } from '../../../../convex/_generated/dataModel';

export default function ManageOrganizationPage() {
  const { user } = useUser();
  const { currentOrganization } = useOrganization();
  const [isEditing, setIsEditing] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'member' | 'admin'>('member');
  
  // Get current user info
  const currentUser = useQuery(api.users.getCurrentUser);
  
  // Get organization members
  const organizationMembers = useQuery(
    api.organizations.getOrganizationMembers,
    currentOrganization ? { organizationId: currentOrganization._id } : "skip"
  );
  
  // Mutations
  const inviteUser = useMutation(api.organizations.inviteUserToOrganization);
  const updateOrganization = useMutation(api.organizations.updateOrganization);
  const removeMember = useMutation(api.organizations.removeMember);
  
  const [orgData, setOrgData] = useState({
    name: currentOrganization?.name || '',
    type: currentOrganization?.type || 'hospital',
    contactEmail: currentOrganization?.contactEmail || '',
    contactPhone: currentOrganization?.contactPhone || '',
    address: currentOrganization?.address || ''
  });
  
  // Check if current user is owner or admin of the organization
  const userMembership = organizationMembers?.find(
    member => member.email === user?.emailAddresses[0]?.emailAddress
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
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Organization Management</h1>
                <p className="text-sm text-gray-600">{currentOrganization?.name}</p>
              </div>
            </div>
            <Badge 
              variant="outline" 
              className="bg-blue-50 text-blue-700 border-blue-200 px-3 py-1"
            >
              {currentOrganization?.type}
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs defaultValue="settings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white border border-gray-200 p-1 rounded-lg">
            <TabsTrigger 
              value="settings" 
              className="flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200"
            >
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
            <TabsTrigger 
              value="members" 
              className="flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200"
            >
              <Users className="h-4 w-4" />
              Members
            </TabsTrigger>
            <TabsTrigger 
              value="billing" 
              className="flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200"
            >
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
                      Organization Members
                    </CardTitle>
                    <CardDescription>
                      Manage members and their roles within your organization
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
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {organizationMembers?.map((member) => (
                      <TableRow key={member._id}>
                        <TableCell className="font-medium">
                          {member.firstName} {member.lastName}
                        </TableCell>
                        <TableCell>{member.email}</TableCell>
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
                          {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {member.memberRole !== 'owner' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveMember(member.membershipId)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
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
    </div>
  );
}