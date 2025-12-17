'use client'

import React, { useState, useMemo } from 'react';
import { useUser } from '@clerk/nextjs'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useOrganization } from '@/contexts/organization-context'
import { DeviceInventory } from '@/components/dashboard/device-inventory'
import { DashboardOverview } from '@/components/dashboard/overview'
import { QuickStats } from '@/components/dashboard/quick-stats'
import { Shield } from 'lucide-react'
import { useSearchParams, useRouter } from 'next/navigation'
import { NetworkTopology } from '@/components/dashboard/network-topology'
import { RiskAssessment } from '@/components/dashboard/risk-assessment';
import { RiskTrendChart } from '@/components/dashboard/risk-trend-chart';
import AlertsAndThreats from "@/components/dashboard/alerts-and-threats";
import { ScheduledReports } from "@/components/dashboard/scheduled-reports";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Download, Printer } from 'lucide-react'

// Memoize heavy components to prevent unnecessary re-renders
const MemoizedNetworkTopology = React.memo(NetworkTopology);
const MemoizedDeviceInventory = React.memo(DeviceInventory);
const MemoizedDashboardOverview = React.memo(DashboardOverview);
// Memoize the AlertsAndThreats component to prevent unnecessary re-renders
const MemoizedAlertsAndThreats = React.memo(AlertsAndThreats);

export default function Dashboard() {
  const { user } = useUser();
  const { currentOrganization } = useOrganization();
  const [activeTab, setActiveTab] = useState("overview");
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = searchParams.get('tab') || 'overview';

  // Memoize organization ID to prevent unnecessary re-renders
  const organizationId = useMemo(() => currentOrganization?._id, [currentOrganization?._id]);

  const currentUser = useQuery(api.users.getCurrentUser)
  
  const userRole = (currentUser && 'role' in currentUser && currentUser.role) ? currentUser.role : "customer"
  const isAdmin = ["super_admin", "admin", "analyst"].includes(userRole)
  const devices = useQuery(
    api.medicalDevices.getAllMedicalDevices,
    currentOrganization ? { organizationId: currentOrganization._id } : 'skip'
  )

  const handleExportPDF = async () => {
    try {
      // @ts-ignore
      const html2canvas = (await import('html2canvas')).default;
      // @ts-ignore
      const jsPDF = (await import('jspdf')).default;

      const element = document.getElementById('dashboard-content');
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        ignoreElements: (element: Element) => element.classList.contains('no-print'),
      } as any);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height + 100] // Add space for header
      });

      // Add Logo if available
      // @ts-ignore
      if (currentOrganization?.logoUrl) {
        try {
            const logoUrl = currentOrganization.logoUrl;
            // Create an image element to load the logo
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.src = logoUrl;
            await new Promise((resolve) => {
                img.onload = resolve;
                img.onerror = resolve; // Continue even if logo fails
            });
            
            const logoWidth = 120;
            const logoHeight = (img.height / img.width) * logoWidth;
            pdf.addImage(img, 'PNG', 40, 40, logoWidth, logoHeight);
            
            // Add Organization Name
            pdf.setFontSize(24);
            pdf.text(currentOrganization.name || "Security Report", 180, 70);
        } catch (e) {
            console.warn("Failed to load logo for PDF", e);
        }
      } else {
         pdf.setFontSize(24);
         pdf.text("Security Dashboard Report", 40, 70);
      }
      
      pdf.setFontSize(12);
      pdf.text(`Generated on ${new Date().toLocaleDateString()}`, 40, 100);

      // Add the dashboard screenshot below the header
      pdf.addImage(imgData, 'PNG', 0, 120, canvas.width, canvas.height);
      
      pdf.save(`dashboard-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export PDF. Please try again.");
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8" id="dashboard-content">


      {/* Main Dashboard Tabs */}
      <div className="animate-in slide-in-from-bottom-4 duration-700">
        <Tabs value={tab} onValueChange={(v) => router.replace(`/dashboard?tab=${v}`)} className="space-y-4 sm:space-y-6 lg:space-y-8">
          {/* Mobile: Dropdown Tabs */}
          <div className="sm:hidden sticky top-16 z-30 bg-card/80 backdrop-blur-sm border-b border-border py-2">
            <Select value={tab} onValueChange={(v) => router.replace(`/dashboard?tab=${v}`)}>
            <SelectTrigger className="w/full bg-card/80 backdrop-blur-sm shadow-lg border border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overview">Overview</SelectItem>
                <SelectItem value="devices">Device Inventory</SelectItem>
                <SelectItem value="risk">Risk Assessment</SelectItem>
                <SelectItem value="network">Network Topology</SelectItem>
                <SelectItem value="alerts">Alerts & Threats</SelectItem>
                <SelectItem value="reports">Reports</SelectItem>
                
              </SelectContent>
            </Select>
          </div>

          {/* Desktop: Horizontal Tabs */}
          <div className="hidden sm:flex justify-center sticky top-16 z-30 bg-card/80 backdrop-blur-md border-b border-border py-3">
            <TabsList className="bg-card/90 backdrop-blur-md shadow-xl border border-border p-2 rounded-2xl flex-wrap gap-2">
              <TabsTrigger 
                value="overview" 
                className="text-foreground hover:bg-muted hover:text-foreground border border-border data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-transparent data-[state=active]:shadow-lg data-[state=active]:ring-2 data-[state=active]:ring-blue-300 transition-all duration-200 rounded-xl px-3 sm:px-5 lg:px-7 py-2.5 font-semibold text-sm"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="devices"
                className="text-foreground hover:bg-muted hover:text-foreground border border-border data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-transparent data-[state=active]:shadow-lg data-[state=active]:ring-2 data-[state=active]:ring-blue-300 transition-all duration-200 rounded-xl px-3 sm:px-5 lg:px-7 py-2.5 font-semibold text-sm"
              >
                <span className="hidden sm:inline">Device Inventory</span>
                <span className="sm:hidden">Devices</span>
              </TabsTrigger>
              <TabsTrigger 
                value="risk"
                className="text-foreground hover:bg-muted hover:text-foreground border border-border data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-transparent data-[state=active]:shadow-lg data-[state=active]:ring-2 data-[state=active]:ring-blue-300 transition-all duration-200 rounded-xl px-3 sm:px-5 lg:px-7 py-2.5 font-semibold text-sm"
              >
                <span className="hidden sm:inline">Risk Assessment</span>
                <span className="sm:hidden">Risk</span>
              </TabsTrigger>
              <TabsTrigger 
                value="network"
                className="text-foreground hover:bg-muted hover:text-foreground border border-border data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-transparent data-[state=active]:shadow-lg data-[state=active]:ring-2 data-[state=active]:ring-blue-300 transition-all duration-200 rounded-xl px-3 sm:px-5 lg:px-7 py-2.5 font-semibold text-sm"
              >
                <span className="hidden sm:inline">Network Topology</span>
                <span className="sm:hidden">Network</span>
              </TabsTrigger>
              <TabsTrigger 
                value="alerts"
                className="text-foreground hover:bg-muted hover:text-foreground border border-border data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-transparent data-[state=active]:shadow-lg data-[state=active]:ring-2 data-[state=active]:ring-blue-300 transition-all duration-200 rounded-xl px-3 sm:px-5 lg:px-7 py-2.5 font-semibold text-sm"
              >
                <span className="hidden sm:inline">Alerts & Threats</span>
                <span className="sm:hidden">Alerts</span>
              </TabsTrigger>
              <TabsTrigger 
                value="reports"
                className="text-foreground hover:bg-muted hover:text-foreground border border-border data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-transparent data-[state=active]:shadow-lg data-[state=active]:ring-2 data-[state=active]:ring-blue-300 transition-all duration-200 rounded-xl px-3 sm:px-5 lg:px-7 py-2.5 font-semibold text-sm"
              >
                <span className="hidden sm:inline">Reports</span>
                <span className="sm:hidden">Reports</span>
              </TabsTrigger>
              
            </TabsList>
          </div>

          <TabsContent value="overview" className="animate-in fade-in-50 duration-500 space-y-6">
            <MemoizedDashboardOverview />
            <RiskTrendChart />
          </TabsContent>

          <TabsContent value="devices" className="animate-in fade-in-50 duration-500">
            <MemoizedDeviceInventory isAdmin={isAdmin} userRole={userRole} />
          </TabsContent>

          <TabsContent value="risk" className="animate-in fade-in-50 duration-500">
            <RiskAssessment />
          </TabsContent>

          <TabsContent value="network" className="animate-in fade-in-50 duration-500">
            <MemoizedNetworkTopology />
          </TabsContent>

          <TabsContent value="alerts" className="animate-in fade-in-50 duration-500">
            {currentOrganization?._id ? (
              <React.Suspense fallback={
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2">Loading alerts...</span>
                </div>
              }>
                <MemoizedAlertsAndThreats organizationId={currentOrganization._id} />
              </React.Suspense>
            ) : (
              <div className="flex items-center justify-center h-64">
                <div className="text-muted-foreground">Please select an organization to view alerts</div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="reports" className="animate-in fade-in-50 duration-500">
            <ScheduledReports />
          </TabsContent>
          
        </Tabs>
      </div>
    </div>
  )
}
