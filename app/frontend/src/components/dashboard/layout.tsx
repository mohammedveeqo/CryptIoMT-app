"use client";

import { useState, useEffect, useRef } from "react";
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

  // Simple loading check - no redirect logic
  if (isLoading || !currentUser) {
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Main content - full width, no sidebar */}
      <div className="flex flex-col flex-1">
        {/* Top navigation */}
        <div className="sticky top-0 z-10 flex-shrink-0 flex h-20 bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200/50">
          <div className="flex-1 px-8 flex justify-between items-center">
            <div className="flex items-center space-x-8">
              {/* Logo and Brand */}
              <div className="flex items-center group">
                <div className="relative">
                  <Shield className="h-10 w-10 text-blue-600 group-hover:text-blue-700 transition-colors duration-200" />
                  <div className="absolute -inset-1 bg-blue-600/20 rounded-full blur opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                </div>
                <span className="ml-3 text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                  CryptIoMT
                </span>
              </div>
              
              {/* Page Title with Breadcrumb */}
              <div className="flex items-center space-x-3">
                <div className="h-8 w-px bg-gray-300"></div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    {filteredNavigation.find(item => item.href === pathname)?.name || 'Dashboard'}
                  </h1>
                  <p className="text-sm text-gray-500 mt-0.5">Medical Device Security Management</p>
                </div>
              </div>
              
              {/* Organization Selector */}
              <div className="hidden lg:block">
                <OrganizationSelector />
              </div>
            </div>
            
            {/* Right Side - User Profile */}
            <div className="ml-4 flex items-center space-x-6">
              {/* Organization Selector for smaller screens */}
              <div className="lg:hidden">
                <OrganizationSelector />
              </div>
              
              {/* User Info */}
              <div className="flex items-center space-x-4">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{user?.fullName}</p>
                  <div className="flex items-center justify-end mt-1">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 capitalize">
                      {userRole.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <div className="relative">
                  <UserButton 
                    afterSignOutUrl="/" 
                    appearance={{
                      elements: {
                        avatarBox: "w-10 h-10 ring-2 ring-blue-100 hover:ring-blue-200 transition-all duration-200"
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content - with improved padding and background */}
        <main className="flex-1 relative">
          <div className="py-8">
            <div className="max-w-full mx-auto px-8 sm:px-10 lg:px-12">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
