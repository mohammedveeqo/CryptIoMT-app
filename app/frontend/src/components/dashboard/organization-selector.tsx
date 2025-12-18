"use client";

import { useState } from 'react';
import { useOrganization } from '../../contexts/organization-context';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  Building2,
  ChevronDown,
  Plus,
  Users,
  Settings,
  ExternalLink,
  Loader2,
  UserPlus,
  Mail
} from 'lucide-react';

export function OrganizationSelector() {
  const { currentOrganization, userOrganizations, setCurrentOrganization, isLoading } = useOrganization();
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [organizationCode, setOrganizationCode] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'member' | 'admin'>('member');
  const [orgData, setOrgData] = useState({
    name: '',
    type: 'hospital',
    email: '',
    phone: '',
    address: ''
  });
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  
  const joinOrganization = useMutation(api.organizations.joinOrganization);
  const createOrganization = useMutation(api.organizations.createUserOrganization);
  const inviteUser = useMutation(api.organizations.inviteUserToOrganization);
  const currentUser = useQuery(api.users.getCurrentUser);
  const organizationMembers = useQuery(
    api.organizations.getOrganizationMembers,
    currentOrganization ? { organizationId: currentOrganization._id } : "skip"
  );
  const router = useRouter();

  // Check if current user can manage the organization
  const userMembership = organizationMembers?.find(
    (member: any) => (member.user?.email) === (currentUser && 'email' in currentUser ? (currentUser as any).email : null)
  );
  const canManage = userMembership?.memberRole === 'owner' || 
                   userMembership?.memberRole === 'admin' || 
                   currentUser?.role === 'admin' || 
                   currentUser?.role === 'super_admin';

  const handleJoinOrganization = async () => {
    if (!organizationCode.trim()) return;
    
    setIsJoining(true);
    try {
      await joinOrganization({ organizationId: organizationCode as any });
      setJoinDialogOpen(false);
      setOrganizationCode('');
      window.location.reload();
    } catch (error) {
      console.error('Failed to join organization:', error);
      alert('Failed to join organization. Please check the organization ID and try again.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleCreateOrganization = async () => {
    if (!orgData.name.trim() || !orgData.email.trim()) return;
    
    setIsCreating(true);
    try {
      await createOrganization({
        name: orgData.name,
        type: orgData.type as 'hospital' | 'clinic' | 'research' | 'vendor' | 'other',
        email: orgData.email,
        phone: orgData.phone,
        address: orgData.address,
        subscriptionTier: 'basic'
      });
      
      setCreateDialogOpen(false);
      setOrgData({ name: '', type: 'hospital', email: '', phone: '', address: '' });
      window.location.reload();
    } catch (error) {
      console.error('Failed to create organization:', error);
      alert('Failed to create organization. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleInviteUser = async () => {
    if (!inviteEmail.trim() || !currentOrganization) return;
    
    setIsInviting(true);
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
      alert('Failed to invite user. Please try again.');
    } finally {
      setIsInviting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse" />
        <div className="w-32 h-4 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  if (!userOrganizations || userOrganizations.length === 0) {
    return (
      <div className="flex items-center space-x-2">
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="default" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-medium">
              <Building2 className="h-4 w-4 mr-2" />
              Create Organization
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-foreground font-semibold">Create New Organization</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Set up a new organization to manage medical devices and security.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="create-name" className="text-muted-foreground font-medium">Organization Name *</Label>
                <Input
                  id="create-name"
                  value={orgData.name}
                  onChange={(e) => setOrgData({ ...orgData, name: e.target.value })}
                  placeholder="Enter organization name"
                  className="mt-1 border-border focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="create-type" className="text-muted-foreground font-medium">Organization Type *</Label>
                <Select value={orgData.type} onValueChange={(value) => setOrgData({ ...orgData, type: value })}>
                  <SelectTrigger className="mt-1 border-border focus:border-blue-500">
                    <SelectValue placeholder="Select organization type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hospital">Hospital</SelectItem>
                    <SelectItem value="clinic">Clinic</SelectItem>
                    <SelectItem value="research">Research Institution</SelectItem>
                    <SelectItem value="vendor">Vendor/Company</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="create-email" className="text-muted-foreground font-medium">Contact Email *</Label>
                <Input
                  id="create-email"
                  type="email"
                  value={orgData.email}
                  onChange={(e) => setOrgData({ ...orgData, email: e.target.value })}
                  placeholder="Enter contact email"
                  className="mt-1 border-border focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="create-phone" className="text-muted-foreground font-medium">Phone Number</Label>
                <Input
                  id="create-phone"
                  value={orgData.phone}
                  onChange={(e) => setOrgData({ ...orgData, phone: e.target.value })}
                  placeholder="Enter phone number"
                  className="mt-1 border-border focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <Label htmlFor="create-address" className="text-muted-foreground font-medium">Address</Label>
                <Textarea
                  id="create-address"
                  value={orgData.address}
                  onChange={(e) => setOrgData({ ...orgData, address: e.target.value })}
                  placeholder="Enter organization address"
                  rows={3}
                  className="mt-1 border-border focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <Button 
                onClick={handleCreateOrganization} 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
                disabled={isCreating || !orgData.name.trim() || !orgData.email.trim()}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Organization'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        
        <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="border-border hover:bg-muted text-foreground font-medium">
              <Plus className="h-4 w-4 mr-2" />
              Join Organization
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-foreground font-semibold">Join an Organization</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Enter the organization ID or ask your administrator for an invitation.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="orgCode" className="text-muted-foreground font-medium">Organization ID</Label>
                <Input
                  id="orgCode"
                  value={organizationCode}
                  onChange={(e) => setOrganizationCode(e.target.value)}
                  placeholder="Enter organization ID..."
                  className="mt-1 border-border focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <Button 
                onClick={handleJoinOrganization} 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
                disabled={isJoining || !organizationCode.trim()}
              >
                {isJoining ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Joining...
                  </>
                ) : (
                  'Join Organization'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2 w-full">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center space-x-2 border-border hover:bg-muted w-full justify-between min-w-0">
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <Building2 className="h-4 w-4 text-blue-600 flex-shrink-0" />
              <span className="text-foreground font-medium truncate">
                {currentOrganization?.name || 'Select Organization'}
              </span>
              <Badge variant="secondary" className="text-xs flex-shrink-0 hidden sm:inline-flex">
                {currentOrganization?.type || 'None'}
              </Badge>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-80 max-w-[calc(100vw-2rem)]">
          <DropdownMenuLabel className="text-foreground font-semibold">
            Organizations
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {userOrganizations?.map((org) => (
            <DropdownMenuItem
              key={org._id}
              onClick={() => setCurrentOrganization(org)}
              className="hover:bg-muted cursor-pointer"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-2">
                  <Building2 className="h-4 w-4 text-blue-600" />
                  <span className="text-foreground font-medium">{org.name}</span>
                  <Badge variant="outline" className="text-xs">{org.type}</Badge>
                </div>
                {currentOrganization?._id === org._id && (
                  <div className="h-2 w-2 bg-blue-600 rounded-full" />
                )}
              </div>
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator />
          
          {currentOrganization && canManage && (
            <>
              <DropdownMenuItem
                onClick={() => router.push('/dashboard/manage')}
                className="hover:bg-muted cursor-pointer"
              >
                <Settings className="h-4 w-4 mr-2 text-blue-600" />
                <span className="text-foreground font-medium">Manage Organization</span>
              </DropdownMenuItem>
              
              <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                <DialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="hover:bg-muted cursor-pointer">
                    <UserPlus className="h-4 w-4 mr-2 text-blue-600" />
                    <span className="text-foreground font-medium">Invite Member</span>
                  </DropdownMenuItem>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="text-foreground font-semibold">Invite User to Organization</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                      Send an invitation to join {currentOrganization.name}.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="invite-email" className="text-muted-foreground font-medium">Email Address *</Label>
                      <Input
                        id="invite-email"
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="Enter user's email address"
                        className="mt-1 border-border focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="invite-role" className="text-muted-foreground font-medium">Role</Label>
                      <Select value={inviteRole} onValueChange={(value: 'member' | 'admin') => setInviteRole(value)}>
                        <SelectTrigger className="mt-1 border-border focus:border-blue-500">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Button 
                      onClick={handleInviteUser} 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
                      disabled={isInviting || !inviteEmail.trim()}
                    >
                      {isInviting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Sending Invitation...
                        </>
                      ) : (
                        <>
                          <Mail className="h-4 w-4 mr-2" />
                          Send Invitation
                        </>
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
