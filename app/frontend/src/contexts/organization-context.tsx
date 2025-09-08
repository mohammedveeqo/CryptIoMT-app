"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { useUser } from '@clerk/nextjs';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';

// Type that matches exactly what getUserOrganizations returns (plain organization object)
type UserOrganization = {
  _id: Id<"organizations">;
  _creationTime: number;
  name: string;
  type: string;
  contactEmail: string;
  contactPhone?: string;
  address?: string;
  subscriptionTier: "basic" | "pro" | "enterprise";
  isActive?: boolean;
  createdBy?: string;
  createdAt?: number;
  updatedAt?: number;
  lastUpdated?: number;
  status?: "active" | "inactive";
  settings?: {
    allowUserRegistration?: boolean;
    requireApproval?: boolean;
    allowedDomains?: string[];
    notificationEmails?: string[];
    customFields?: any;
    maxUsers?: number;
  };
  metadata?: any;
};

interface OrganizationContextType {
  currentOrganization: UserOrganization | null;
  userOrganizations: UserOrganization[] | undefined;
  setCurrentOrganization: (org: UserOrganization | null) => void;
  isLoading: boolean;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const [currentOrganization, setCurrentOrganization] = useState<UserOrganization | null>(null);
  const { isSignedIn, isLoaded } = useUser();
  
  // Only query organizations if user is authenticated
  const userOrganizations = useQuery(
    api.organizations.getUserOrganizations,
    isSignedIn ? {} : "skip"
  );
  
  // More precise loading state
  const isLoading = !isLoaded || (isSignedIn && userOrganizations === undefined);

  // Set default organization when data loads - ONLY once
  useEffect(() => {
    if (userOrganizations && userOrganizations.length > 0 && !currentOrganization) {
      // Set the first active organization as default
      const activeOrg = userOrganizations.find(org => org.status === 'active');
      setCurrentOrganization(activeOrg || userOrganizations[0]);
    }
    // Remove the else if clause that was resetting to null
  }, [userOrganizations]); // Remove currentOrganization from dependencies

  // Reset organization ONLY when user signs out
  useEffect(() => {
    if (!isSignedIn) {
      setCurrentOrganization(null);
    }
  }, [isSignedIn]);

  return (
    <OrganizationContext.Provider value={{
      currentOrganization,
      userOrganizations: isSignedIn ? userOrganizations : undefined,
      setCurrentOrganization,
      isLoading
    }}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
}