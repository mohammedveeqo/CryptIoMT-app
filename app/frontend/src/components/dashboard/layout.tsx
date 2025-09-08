"use client";

import { useState, useEffect } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
// Use the backend's generated API
import { api } from "../../../convex/_generated/api";
import {
  Shield,
  Users,
  Server,
  FileSpreadsheet,
  BarChart3,
  Settings,
  Menu,
  X,
  Home,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { OrganizationSelector } from './organization-selector';
import { useOrganization } from '../../contexts/organization-context';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const { userOrganizations, isLoading } = useOrganization();
  
  // Get user role from Convex with better type safety
  const currentUser = useQuery(api.users.getCurrentUser);
  const userRole = (currentUser && 'role' in currentUser && currentUser.role) ? currentUser.role : "customer";

  // Redirect users without organizations to onboarding (except admins)
  useEffect(() => {
    if (!isLoading && currentUser && userOrganizations !== undefined) {
      const isAdmin = ['super_admin', 'admin'].includes(userRole);
      const hasOrganizations = userOrganizations && userOrganizations.length > 0;
      
      // Debug logging to help identify the issue
      console.log('Dashboard redirect check:', {
        isLoading,
        currentUser: !!currentUser,
        userOrganizations,
        hasOrganizations,
        isAdmin,
        userRole,
        pathname
      });
      
      // Only redirect non-admin users without organizations
      // Make sure we're not in a redirect loop and give more time for data to load
      // Also check if we're coming from impersonation
      const isFromImpersonation = typeof window !== 'undefined' && 
        (window.location.search.includes('impersonate=true') || 
         sessionStorage.getItem('impersonation'));
      
      // Add additional checks to prevent premature redirects
      const shouldRedirect = !isAdmin && 
                           !hasOrganizations && 
                           !pathname.includes('/onboarding') && 
                           !isFromImpersonation &&
                           userOrganizations !== undefined && // Ensure data is actually loaded
                           Array.isArray(userOrganizations); // Ensure it's a proper array
      
      if (shouldRedirect) {
        // Add a delay to ensure organization data has fully loaded
        const timeoutId = setTimeout(() => {
          // Double-check organizations are still empty after delay
          if (userOrganizations && userOrganizations.length === 0) {
            console.log('Redirecting to onboarding after delay');
            router.push('/onboarding');
          }
        }, 1500); // Increased delay to 1.5 seconds
        
        return () => clearTimeout(timeoutId);
      }
    }
  }, [isLoading, currentUser, userOrganizations, userRole, router, pathname]);

  // Show loading while checking organization membership
  if (isLoading || !currentUser || userOrganizations === undefined) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }
  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home, roles: ["super_admin", "admin", "analyst", "customer"] },
    { name: "Equipment", href: "/dashboard/equipment", icon: Server, roles: ["super_admin", "admin", "analyst", "customer"] },
    { name: "Risk Assessment", href: "/dashboard/risk", icon: AlertTriangle, roles: ["super_admin", "admin", "analyst", "customer"] },
    { name: "Customers", href: "/dashboard/customers", icon: Users, roles: ["super_admin", "admin"] },
    { name: "Excel Upload", href: "/dashboard/upload", icon: FileSpreadsheet, roles: ["super_admin", "admin", "analyst"] },
    { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3, roles: ["super_admin", "admin", "analyst"] },
    { name: "Settings", href: "/dashboard/settings", icon: Settings, roles: ["super_admin", "admin", "analyst", "customer"] },
  ];

  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(userRole)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main content - full width, no sidebar */}
      <div className="flex flex-col flex-1">
        {/* Top navigation */}
        <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white shadow">
          <div className="flex-1 px-6 flex justify-between items-center">
            <div className="flex items-center space-x-6">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-blue-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">CryptIoMT</span>
              </div>
              <h1 className="text-2xl font-semibold text-gray-900">
                {filteredNavigation.find(item => item.href === pathname)?.name || 'Dashboard'}
              </h1>
              <OrganizationSelector />
            </div>
            <div className="ml-4 flex items-center md:ml-6">
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-700">
                  <span className="font-medium">{user?.fullName}</span>
                  <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full capitalize">
                    {userRole.replace('_', ' ')}
                  </span>
                </div>
                <UserButton afterSignOutUrl="/" />
              </div>
            </div>
          </div>
        </div>

        {/* Page content - with proper padding */}
        <main className="flex-1">
          <div className="py-8">
            <div className="max-w-full mx-auto px-6 sm:px-8 lg:px-12">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
