"use client";

import { useQuery } from "convex/react";
// Use the backend's generated API
import { api } from "../../../../backend/convex/_generated/api";
import {
  Server,
  Users,
  AlertTriangle,
  Shield,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

// Custom hook to conditionally fetch customers
function useCustomersForAdmin(isAdmin: boolean) {
  const customers = useQuery(
    api.customers.getAllCustomers,
    isAdmin ? {} : "skip"
  );
  return isAdmin ? customers : [];
}

export function DashboardOverview() {
  const currentUser = useQuery(api.users.getCurrentUser);
  const equipmentStats = useQuery(api.equipment.getEquipmentStats, {});
  
  const userRole = (currentUser && 'role' in currentUser && currentUser.role) ? currentUser.role : "customer";
  const isAdmin = ["super_admin", "admin", "analyst"].includes(userRole);
  
  // Use custom hook that properly handles conditional queries
  const customers = useCustomersForAdmin(isAdmin);

  const stats = [
    {
      name: "Total Equipment",
      value: equipmentStats?.total || 0,
      icon: Server,
      change: "+12%",
      changeType: "increase" as const,
      visible: true,
    },
    {
      name: "Active Customers",
      value: customers?.filter(c => c.isActive).length || 0,
      icon: Users,
      change: "+5%",
      changeType: "increase" as const,
      visible: isAdmin,
    },
    {
      name: "High Risk Devices",
      value: (equipmentStats?.riskDistribution?.high || 0) + (equipmentStats?.riskDistribution?.critical || 0),
      icon: AlertTriangle,
      change: "-8%",
      changeType: "decrease" as const,
      visible: true,
    },
    {
      name: "Security Score",
      value: "87%",
      icon: Shield,
      change: "+3%",
      changeType: "increase" as const,
      visible: true,
    },
  ];

  const visibleStats = stats.filter(stat => stat.visible);

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Welcome back, {currentUser?.identity?.name || "User"}!
          </h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>
              {isAdmin 
                ? "Monitor your customers' cybersecurity posture and manage risk assessments."
                : "View your equipment inventory and security risk assessments."}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {visibleStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Icon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {stat.name}
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          {stat.value}
                        </div>
                        <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                          stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {stat.changeType === 'increase' ? (
                            <TrendingUp className="self-center flex-shrink-0 h-4 w-4 text-green-500" />
                          ) : (
                            <TrendingDown className="self-center flex-shrink-0 h-4 w-4 text-red-500" />
                          )}
                          <span className="ml-1">{stat.change}</span>
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {isAdmin && (
              <>
                <button className="relative block w-full border-2 border-gray-300 border-dashed rounded-lg p-6 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  <Users className="mx-auto h-8 w-8 text-gray-400" />
                  <span className="mt-2 block text-sm font-medium text-gray-900">
                    Add New Customer
                  </span>
                </button>
                <button className="relative block w-full border-2 border-gray-300 border-dashed rounded-lg p-6 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  <Server className="mx-auto h-8 w-8 text-gray-400" />
                  <span className="mt-2 block text-sm font-medium text-gray-900">
                    Upload Equipment Data
                  </span>
                </button>
              </>
            )}
            <button className="relative block w-full border-2 border-gray-300 border-dashed rounded-lg p-6 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <AlertTriangle className="mx-auto h-8 w-8 text-gray-400" />
              <span className="mt-2 block text-sm font-medium text-gray-900">
                Run Risk Assessment
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Recent Activity
          </h3>
          <div className="flow-root">
            <ul className="-mb-8">
              <li className="relative pb-8">
                <div className="relative flex space-x-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500">
                    <Shield className="h-4 w-4 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-gray-500">
                      <span className="font-medium text-gray-900">Risk assessment completed</span>
                      <span className="whitespace-nowrap"> 2 hours ago</span>
                    </div>
                  </div>
                </div>
              </li>
              <li className="relative pb-8">
                <div className="relative flex space-x-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500">
                    <Server className="h-4 w-4 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-gray-500">
                      <span className="font-medium text-gray-900">New equipment added</span>
                      <span className="whitespace-nowrap"> 4 hours ago</span>
                    </div>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}