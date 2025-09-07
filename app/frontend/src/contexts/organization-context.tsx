"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery } from 'convex/react';
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
  status: "active" | "inactive";
  settings: {
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
  
  // Get user's organizations - TypeScript will now properly infer the type
  const userOrganizations = useQuery(api.organizations.getUserOrganizations);
  const isLoading = userOrganizations === undefined;

  // Set default organization when data loads
  useEffect(() => {
    if (userOrganizations && userOrganizations.length > 0 && !currentOrganization) {
      // Set the first active organization as default
      const activeOrg = userOrganizations.find(org => org.status === 'active');
      setCurrentOrganization(activeOrg || userOrganizations[0]);
    }
  }, [userOrganizations, currentOrganization]);

  return (
    <OrganizationContext.Provider value={{
      currentOrganization,
      userOrganizations,
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