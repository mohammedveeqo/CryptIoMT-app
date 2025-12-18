'use client'

import React, { useMemo } from 'react';
import { useUser } from '@clerk/nextjs'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useOrganization } from '@/contexts/organization-context'
import { DashboardOverview } from '@/components/dashboard/overview'
import { RiskTrendChart } from '@/components/dashboard/risk-trend-chart';
import { useRouter } from 'next/navigation'

// Memoize heavy components to prevent unnecessary re-renders
const MemoizedDashboardOverview = React.memo(DashboardOverview);

export default function Dashboard() {
  const { user } = useUser();
  const { currentOrganization } = useOrganization();
  const router = useRouter();

  // Memoize organization ID to prevent unnecessary re-renders
  const organizationId = useMemo(() => currentOrganization?._id, [currentOrganization?._id]);

  const currentUser = useQuery(api.users.getCurrentUser)
  
  const userRole = (currentUser && 'role' in currentUser && currentUser.role) ? currentUser.role : "customer"
  const isAdmin = ["super_admin", "admin", "analyst"].includes(userRole)

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8" id="dashboard-content">
      {/* Main Dashboard Content */}
      <div className="animate-in slide-in-from-bottom-4 duration-700">
        <div className="space-y-6">
          <MemoizedDashboardOverview />
          <RiskTrendChart />
        </div>
      </div>
    </div>
  )
}
