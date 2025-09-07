"use client";

import { useState } from 'react';
import { useOrganization } from '../../contexts/organization-context';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
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
import {
  Building2,
  ChevronDown,
  Plus,
  Users,
  Settings,
  ExternalLink
} from 'lucide-react';

export function OrganizationSelector() {
  const { currentOrganization, userOrganizations, setCurrentOrganization, isLoading } = useOrganization();
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [organizationCode, setOrganizationCode] = useState('');
  
  const joinOrganization = useMutation(api.organizations.joinOrganization);

  const handleJoinOrganization = async () => {
    if (!organizationCode.trim()) return;
    
    try {
      await joinOrganization({ organizationId: organizationCode as any });
      setJoinDialogOpen(false);
      setOrganizationCode('');
    } catch (error) {
      console.error('Failed to join organization:', error);
      // You might want to show a toast notification here
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
      <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Join Organization
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join an Organization</DialogTitle>
            <DialogDescription>
              Enter the organization ID or ask your administrator for an invitation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="orgCode">Organization ID</Label>
              <Input
                id="orgCode"
                value={organizationCode}
                onChange={(e) => setOrganizationCode(e.target.value)}
                placeholder="Enter organization ID..."
              />
            </div>
            <Button onClick={handleJoinOrganization} className="w-full">
              Join Organization
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center space-x-2 min-w-[200px]">
          <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
            <Building2 className="h-4 w-4 text-blue-600" />
          </div>
          <div className="flex-1 text-left">
            <div className="text-sm font-medium truncate">
              {currentOrganization?.name || 'Select Organization'}
            </div>
            {currentOrganization && (
              <div className="text-xs text-gray-500 capitalize">
                {currentOrganization.type}
              </div>
            )}
          </div>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Your Organizations</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {userOrganizations.map((org) => (
          <DropdownMenuItem
            key={org._id}
            onClick={() => setCurrentOrganization(org)}
            className="flex items-center space-x-3 p-3"
          >
            <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
              <Building2 className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="font-medium">{org.name}</div>
              <div className="text-xs text-gray-500 flex items-center space-x-2">
                <span className="capitalize">{org.type}</span>
                <Badge variant={org.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                  Member
                </Badge>
              </div>
            </div>
            {currentOrganization?._id === org._id && (
              <div className="w-2 h-2 bg-blue-600 rounded-full" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
          <DialogTrigger asChild>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <Plus className="h-4 w-4 mr-2" />
              Join Organization
            </DropdownMenuItem>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Join an Organization</DialogTitle>
              <DialogDescription>
                Enter the organization ID or ask your administrator for an invitation.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="orgCode">Organization ID</Label>
                <Input
                  id="orgCode"
                  value={organizationCode}
                  onChange={(e) => setOrganizationCode(e.target.value)}
                  placeholder="Enter organization ID..."
                />
              </div>
              <Button onClick={handleJoinOrganization} className="w-full">
                Join Organization
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        {currentOrganization && (
          <DropdownMenuItem>
            <Settings className="h-4 w-4 mr-2" />
            Manage Organization
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}