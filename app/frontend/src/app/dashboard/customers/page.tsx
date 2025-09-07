"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { DashboardLayout } from "../../../components/dashboard/layout";
import { useState } from "react";
import {
  Users,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  UserX,
  UserCheck,
  Download,
  Upload,
  Plus,
} from "lucide-react";

export default function CustomersPage() {
  const currentUser = useQuery(api.users.getCurrentUser);
  const customers = useQuery(api.users.getAllCustomers); // This should work since getAllCustomers is in users.ts
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showActions, setShowActions] = useState(null);

  const userRole = (currentUser && 'role' in currentUser && currentUser.role) ? currentUser.role : "customer";
  const isAdmin = ["super_admin", "admin"].includes(userRole);

  // Redirect if not admin
  if (currentUser && !isAdmin) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
          <p className="mt-1 text-sm text-gray-500">
            You don't have permission to view this page.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  if (!customers) {
    return (
      <DashboardLayout>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
            <p className="text-gray-600">Manage your customer accounts and permissions</p>
          </div>
          <div className="flex space-x-3">
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </button>
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
            <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Customer
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Customers
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {customers.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserCheck className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Active Customers
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {customers.filter(c => c.isActive && !c.isBlocked).length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserX className="h-6 w-6 text-red-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Blocked Customers
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {customers.filter(c => c.isBlocked).length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      New This Month
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {customers.filter(c => {
                        const oneMonthAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
                        return c._creationTime > oneMonthAgo;
                      }).length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Customers Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Customer List
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Manage customer accounts, roles, and access permissions.
            </p>
          </div>
          <ul className="divide-y divide-gray-200">
            {customers.map((customer) => (
              <li key={customer._id}>
                <div className="px-4 py-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <Users className="h-5 w-5 text-gray-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">
                          {customer.name}
                        </div>
                        <div className="ml-2">
                          {customer.isBlocked ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Blocked
                            </span>
                          ) : customer.isActive ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Inactive
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {customer.email} • {customer.company}
                      </div>
                      <div className="text-xs text-gray-400">
                        Role: {customer.role?.replace('_', ' ') || 'customer'} • 
                        Tier: {customer.subscriptionTier || 'basic'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="text-gray-400 hover:text-gray-600">
                      <Eye className="h-5 w-5" />
                    </button>
                    <button className="text-gray-400 hover:text-gray-600">
                      <Edit className="h-5 w-5" />
                    </button>
                    <button className="text-gray-400 hover:text-red-600">
                      <Trash2 className="h-5 w-5" />
                    </button>
                    <button className="text-gray-400 hover:text-gray-600">
                      <MoreHorizontal className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          {customers.length === 0 && (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No customers</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by adding your first customer.
              </p>
              <div className="mt-6">
                <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Customer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}