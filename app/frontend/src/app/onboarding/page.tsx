"use client";

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Shield, Building2, Users, ArrowRight, X } from 'lucide-react';

export default function OnboardingPage() {
  const { user } = useUser();
  const router = useRouter();
  const [step, setStep] = useState<'welcome' | 'create-org' | 'join-org'>('welcome');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const createOrganization = useMutation(api.organizations.createUserOrganization);
  const joinOrganizationByCode = useMutation(api.organizations.joinOrganizationByCode);
  const createOrUpdateUser = useMutation(api.users.createOrUpdateUser);
  const currentUser = useQuery(api.users.getCurrentUser);
  
  const [orgData, setOrgData] = useState({
    name: '',
    type: 'hospital' as 'hospital' | 'clinic' | 'research' | 'vendor' | 'other',
    email: user?.emailAddresses[0]?.emailAddress || '',
    phone: '',
    address: ''
  });
  
  const [joinCode, setJoinCode] = useState('');
  
  // Ensure user exists in our database
  const handleEnsureUser = async () => {
    if (!user) return;
    
    try {
      await createOrUpdateUser({
        clerkUserId: user.id,
        email: user.emailAddresses[0]?.emailAddress || '',
        name: user.fullName || user.firstName || 'User'
      });
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  };
  
  const handleCreateOrganization = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      await handleEnsureUser();
      
      await createOrganization({
        name: orgData.name,
        type: orgData.type,
        email: orgData.email,
        phone: orgData.phone,
        address: orgData.address,
        subscriptionTier: 'basic'
      });
      
      router.push('/dashboard');
    } catch (error: any) {
      setError(error.message || 'Failed to create organization');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleJoinOrganization = async () => {
    if (!user || !joinCode) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      await handleEnsureUser();
      
      // Use the correct joinOrganizationByCode mutation
      await joinOrganizationByCode({
        invitationCode: joinCode
      });
      
      router.push('/dashboard');
    } catch (error: any) {
      setError(error.message || 'Failed to join organization');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSkip = async () => {
    if (!user) return;
    
    try {
      await handleEnsureUser();
      // Add a query parameter to indicate the user skipped onboarding
      router.push('/dashboard?skipped=true');
    } catch (error) {
      console.error('Failed to create user:', error);
      router.push('/dashboard?skipped=true'); // Continue anyway
    }
  };
  
  if (step === 'welcome') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Welcome to CryptIoMT!</CardTitle>
            <CardDescription>
              Let's get you set up. You can create a new organization, join an existing one, or skip this step for now.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => setStep('create-org')} 
              className="w-full flex items-center justify-center space-x-2"
            >
              <Building2 className="h-4 w-4" />
              <span>Create New Organization</span>
            </Button>
            
            <Button 
              onClick={() => setStep('join-org')} 
              variant="outline" 
              className="w-full flex items-center justify-center space-x-2"
            >
              <Users className="h-4 w-4" />
              <span>Join Existing Organization</span>
            </Button>
            
            <Button 
              onClick={handleSkip} 
              variant="ghost" 
              className="w-full text-gray-600"
            >
              Skip for now
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (step === 'create-org') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Create Organization</CardTitle>
                <CardDescription>
                  Set up your organization to start managing medical devices and security.
                </CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setStep('welcome')}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
                {error}
              </div>
            )}
            
            <div>
              <Label htmlFor="name">Organization Name *</Label>
              <Input
                id="name"
                value={orgData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOrgData({ ...orgData, name: e.target.value })}
                placeholder="Enter organization name"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="type">Organization Type *</Label>
              <Select value={orgData.type} onValueChange={(value: any) => setOrgData({ ...orgData, type: value })}>
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
              <Label htmlFor="email">Contact Email *</Label>
              <Input
                id="email"
                type="email"
                value={orgData.email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOrgData({ ...orgData, email: e.target.value })}
                placeholder="contact@hospital.com"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={orgData.phone}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOrgData({ ...orgData, phone: e.target.value })}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            
            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={orgData.address}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setOrgData({ ...orgData, address: e.target.value })}
                placeholder="123 Main St, City, State 12345"
                rows={3}
              />
            </div>
            
            <div className="flex space-x-3 pt-4">
              <Button 
                onClick={handleCreateOrganization} 
                disabled={!orgData.name || !orgData.email || isLoading}
                className="flex-1"
              >
                {isLoading ? 'Creating...' : 'Create Organization'}
              </Button>
              <Button 
                onClick={handleSkip} 
                variant="outline"
                disabled={isLoading}
              >
                Skip
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (step === 'join-org') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Join Organization</CardTitle>
                <CardDescription>
                  Enter the organization ID provided by your administrator.
                </CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setStep('welcome')}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
                {error}
              </div>
            )}
            
            <div>
              <Label htmlFor="joinCode">Organization ID *</Label>
              <Input
                id="joinCode"
                value={joinCode}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setJoinCode(e.target.value)}
                placeholder="Enter invitation code"
                required
              />
            </div>
            
            <div className="flex space-x-3 pt-4">
              <Button 
                onClick={handleJoinOrganization} 
                disabled={!joinCode || isLoading}
                className="flex-1"
              >
                {isLoading ? 'Joining...' : 'Join Organization'}
              </Button>
              <Button 
                onClick={handleSkip} 
                variant="outline"
                disabled={isLoading}
              >
                Skip
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return null;
}