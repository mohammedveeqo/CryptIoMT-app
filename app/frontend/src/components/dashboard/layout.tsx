"use client";

import { useState, useEffect, useRef } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
// Use the backend's generated API
import { api } from "../../../convex/_generated/api";
import {
  Users,
  Server,
  FileSpreadsheet,
  BarChart3,
  Settings,
  Menu,
  X,
  Home,
  AlertTriangle,
  Shield,
  ShieldCheck,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { OrganizationSelector } from './organization-selector';
import { useOrganization } from '../../contexts/organization-context';
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { GlobalSearch, GlobalSearchDialog } from "./global-search";

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

  const [isDark, setIsDark] = useState<boolean>(false);
  useEffect(() => {
    const el = document.documentElement;
    setIsDark(el.classList.contains('dark'));
  }, []);

  const toggleTheme = () => {
    const el = document.documentElement;
    const next = !el.classList.contains('dark');
    el.classList.toggle('dark', next);
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light');
    } catch (_) {}
    setIsDark(next);
  };

  // Simple loading check - no redirect logic
  if (isLoading || !currentUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home, roles: ["super_admin", "admin", "analyst", "customer"] },
    { name: "Equipment", href: "/dashboard/equipment", icon: Server, roles: ["super_admin", "admin", "analyst", "customer"] },
    { name: "Risk Assessment", href: "/dashboard/risk", icon: AlertTriangle, roles: ["super_admin", "admin", "analyst", "customer"] },
    { name: "Vulnerabilities", href: "/dashboard/vulnerabilities", icon: Shield, roles: ["super_admin", "admin", "analyst", "customer"] },
    { name: "Compliance", href: "/dashboard/compliance", icon: ShieldCheck, roles: ["super_admin", "admin", "analyst", "customer"] },
    { name: "Customers", href: "/dashboard/customers", icon: Users, roles: ["super_admin", "admin"] },
    { name: "Excel Upload", href: "/dashboard/upload", icon: FileSpreadsheet, roles: ["super_admin", "admin", "analyst"] },
    { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3, roles: ["super_admin", "admin", "analyst"] },
    { name: "Reports", href: "/dashboard/reports", icon: FileText, roles: ["super_admin", "admin", "analyst", "customer"] },
    { name: "Settings", href: "/dashboard/settings", icon: Settings, roles: ["super_admin", "admin", "analyst", "customer"] },
  ];

  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(userRole)
  );


  return (
    <div className="min-h-screen bg-background">
      {/* Main content - full width, no sidebar */}
      <div className="flex flex-col flex-1">
        {/* Top navigation - Mobile Responsive */}
        <div className="sticky top-0 z-10 flex-shrink-0 bg-background/95 backdrop-blur-md shadow-lg border-b">
          <div className="flex-1 px-4 sm:px-6 lg:px-8">
            {/* Mobile Layout */}
            <div className="flex flex-col space-y-4 py-4 sm:hidden">
              {/* Top row: Logo + User */}
              <div className="flex justify-between items-center">
                <div className="flex items-center group flex-shrink-0">
                  <span className="text-lg font-bold">
                    <span className="text-foreground">Crypt</span>
                    <span className="text-primary">IoMT</span>
                  </span>
                </div>
                
                <div className="flex items-center space-x-3 flex-shrink-0">
                  {userRole === 'super_admin' && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">Admin</Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href="/dashboard/upload">Go to Upload</Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  <div className="text-right min-w-0">
                    <p className="text-sm font-medium text-foreground truncate max-w-20">{user?.fullName}</p>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground capitalize">
                      {userRole.replace('_', ' ')}
                    </span>
                  </div>
                  <UserButton 
                    afterSignOutUrl="/" 
                    appearance={{
                      elements: {
                        avatarBox: "w-8 h-8 ring-2 ring-blue-100 hover:ring-blue-200 transition-all duration-200"
                      }
                    }}
                  />
                </div>
              </div>
              
              {/* Second row: Page title */}
              <div className="min-w-0">
                <h1 className="text-xl font-semibold text-foreground truncate">
                  {filteredNavigation.find(item => item.href === pathname)?.name || 'Dashboard'}
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5 truncate">Medical Device Security Management</p>
              </div>
              
              {/* Third row: Organization selector */}
              <div className="w-full min-w-0 space-y-3">
                <div className="max-w-full">
                  <OrganizationSelector />
                </div>
                <div className="w-full">
                    <GlobalSearch />
                </div>
              </div>
            </div>
          
          {/* Desktop Layout */}
          <div className="hidden sm:flex justify-between items-center h-20">
            <div className="flex items-center space-x-8">
              {/* Logo and Brand */}
              <div className="flex items-center group">
                <span className="text-2xl font-bold">
                  <span className="text-foreground">Crypt</span>
                  <span className="text-primary">IoMT</span>
                </span>
              </div>
              
              {/* Page Title with Breadcrumb */}
              <div className="flex items-center space-x-3">
                <div className="h-8 w-px bg-border"></div>
                <div>
                  <h1 className="text-xl font-semibold text-foreground">
                    {filteredNavigation.find(item => item.href === pathname)?.name || 'Dashboard'}
                  </h1>
                  <p className="text-sm text-muted-foreground mt-0.5">Medical Device Security Management</p>
                </div>
              </div>
              
              {/* Organization Selector */}
              <div className="hidden lg:block">
                <OrganizationSelector />
              </div>
            </div>
            
            <div className="flex-1 flex justify-center px-4 max-w-lg">
                <GlobalSearch />
            </div>

              {/* Right Side - User Profile */}
              <div className="ml-4 flex items-center space-x-6">
              {/* Organization Selector for smaller screens */}
              <div className="lg:hidden">
                <OrganizationSelector />
              </div>

              {/* User Info */}
              <div className="flex items-center space-x-4">
                <div className="text-right hidden md:block">
                  <p className="text-sm font-medium text-foreground">{user?.fullName}</p>
                  <div className="flex items-center justify-end mt-1">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground capitalize">
                      {userRole.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <div className="relative flex items-center gap-3">
                  {userRole === 'super_admin' && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">Admin</Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href="/dashboard/upload">Go to Upload</Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  <Button variant="outline" size="sm" onClick={toggleTheme} className="rounded-md">
                    {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  </Button>
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
      </div>

      {/* Page content - with improved padding and background */}
      <main className="flex-1 relative">
        <div className="py-4 sm:py-6 lg:py-8">
          <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </div>
      </main>
      <GlobalSearch />
    </div>
  </div>
);
}
