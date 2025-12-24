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
import { Building2, Users, X } from 'lucide-react';

export default function OnboardingPage() {
  const { user } = useUser();
  const router = useRouter();
  const [step, setStep] = useState<'welcome' | 'create-org' | 'join-org'>('welcome');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const createOrganization = useMutation(api.organizations.createUserOrganization);
  const joinOrganizationByCode = useMutation(api.organizations.joinOrganizationByCode);
  const createOrUpdateUser = useMutation(api.users.createOrUpdateUser);
  
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

  const Background = () => (
    <>
      <div className="absolute inset-0 w-full h-full bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-blue-400 opacity-20 blur-[100px]"></div>
    </>
  );

  const cardClasses = "bg-white border-slate-200 shadow-xl text-slate-900";
  const inputClasses = "bg-white border-slate-200 text-slate-900 focus:border-blue-500 focus:ring-blue-500/20 placeholder:text-slate-400";
  const labelClasses = "text-slate-700";

  if (step === 'welcome') {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 relative overflow-hidden p-4">
        <Background />
        <Card className={`w-full max-w-md ${cardClasses}`}>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-slate-900">Welcome to CryptIoMT</CardTitle>
            <CardDescription className="text-slate-600">
              Let's get you set up. Create a new organization or join an existing one.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => setStep('create-org')} 
              className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white h-12"
            >
              <Building2 className="h-4 w-4" />
              <span>Create New Organization</span>
            </Button>
            
            <Button 
              onClick={() => setStep('join-org')} 
              variant="outline" 
              className="w-full flex items-center justify-center space-x-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 h-12 bg-white"
            >
              <Users className="h-4 w-4" />
              <span>Join Existing Organization</span>
            </Button>
            
            <Button 
              onClick={handleSkip} 
              variant="ghost" 
              className="w-full text-slate-500 hover:text-slate-700 hover:bg-transparent"
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
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 relative overflow-hidden p-4">
        <Background />
        <Card className={`w-full max-w-lg ${cardClasses}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-slate-900">Create Organization</CardTitle>
                <CardDescription className="text-slate-600">
                  Set up your organization to start managing security.
                </CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setStep('welcome')}
                className="text-slate-400 hover:text-slate-700 hover:bg-slate-100"
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
            
            <div className="space-y-2">
              <Label htmlFor="name" className={labelClasses}>Organization Name *</Label>
              <Input
                id="name"
                value={orgData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOrgData({ ...orgData, name: e.target.value })}
                placeholder="Enter organization name"
                required
                className={inputClasses}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type" className={labelClasses}>Organization Type *</Label>
              <Select value={orgData.type} onValueChange={(value: any) => setOrgData({ ...orgData, type: value })}>
                <SelectTrigger className={inputClasses}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-slate-900">
                  <SelectItem value="hospital" className="focus:bg-slate-100 focus:text-slate-900">Hospital</SelectItem>
                  <SelectItem value="clinic" className="focus:bg-slate-100 focus:text-slate-900">Clinic</SelectItem>
                  <SelectItem value="research" className="focus:bg-slate-100 focus:text-slate-900">Research Institution</SelectItem>
                  <SelectItem value="vendor" className="focus:bg-slate-100 focus:text-slate-900">Medical Device Vendor</SelectItem>
                  <SelectItem value="other" className="focus:bg-slate-100 focus:text-slate-900">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className={labelClasses}>Contact Email *</Label>
              <Input
                id="email"
                type="email"
                value={orgData.email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOrgData({ ...orgData, email: e.target.value })}
                placeholder="contact@hospital.com"
                required
                className={inputClasses}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone" className={labelClasses}>Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={orgData.phone}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOrgData({ ...orgData, phone: e.target.value })}
                placeholder="+1 (555) 123-4567"
                className={inputClasses}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address" className={labelClasses}>Address</Label>
              <Textarea
                id="address"
                value={orgData.address}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setOrgData({ ...orgData, address: e.target.value })}
                placeholder="123 Main St, City, State 12345"
                rows={3}
                className={inputClasses}
              />
            </div>
            
            <div className="flex space-x-3 pt-4">
              <Button 
                onClick={handleCreateOrganization} 
                disabled={!orgData.name || !orgData.email || isLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLoading ? 'Creating...' : 'Create Organization'}
              </Button>
              <Button 
                onClick={handleSkip} 
                variant="outline"
                disabled={isLoading}
                className="border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 bg-white"
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
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 relative overflow-hidden p-4">
        <Background />
        <Card className={`w-full max-w-md ${cardClasses}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-slate-900">Join Organization</CardTitle>
                <CardDescription className="text-slate-600">
                  Enter the organization ID provided by your administrator.
                </CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setStep('welcome')}
                className="text-slate-400 hover:text-slate-700 hover:bg-slate-100"
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
            
            <div className="space-y-2">
              <Label htmlFor="joinCode" className={labelClasses}>Organization ID *</Label>
              <Input
                id="joinCode"
                value={joinCode}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setJoinCode(e.target.value)}
                placeholder="Enter invitation code"
                required
                className={inputClasses}
              />
            </div>
            
            <div className="flex space-x-3 pt-4">
              <Button 
                onClick={handleJoinOrganization} 
                disabled={!joinCode || isLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLoading ? 'Joining...' : 'Join Organization'}
              </Button>
              <Button 
                onClick={handleSkip} 
                variant="outline"
                disabled={isLoading}
                className="border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 bg-white"
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
