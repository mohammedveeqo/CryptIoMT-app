"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { DashboardLayout } from "../../../components/dashboard/layout";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [showActions, setShowActions] = useState(null);

  const userRole = (currentUser && 'role' in currentUser && currentUser.role) ? currentUser.role : "customer";
  const isAdmin = ["super_admin", "admin"].includes(userRole);

  // Redirect if not admin
  if (currentUser && !isAdmin) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-medium text-foreground">Access Denied</h3>
          <p className="mt-1 text-sm text-muted-foreground">
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
          <div className="h-8 bg-muted rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
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
        <div className="flex justify-end items-center">
          <div className="flex space-x-3">
            <Button variant="outline" size="sm" className="rounded-md">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button variant="outline" size="sm" className="rounded-md">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button size="sm" className="rounded-md">
              <Plus className="h-4 w-4 mr-2" />
              Add Customer
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Customers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="h-6 w-6 text-muted-foreground" />
                <div className="text-lg font-medium text-foreground">{customers.length}</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Active Customers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <UserCheck className="h-6 w-6 text-green-500" />
                <div className="text-lg font-medium text-foreground">{customers.filter(c => c.isActive && !c.isBlocked).length}</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Blocked Customers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <UserX className="h-6 w-6 text-red-500" />
                <div className="text-lg font-medium text-foreground">{customers.filter(c => c.isBlocked).length}</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">New This Month</CardTitle>
              <CardDescription>Last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="h-6 w-6 text-primary" />
                <div className="text-lg font-medium text-foreground">{
                  customers.filter(c => {
                    const oneMonthAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
                    return c._creationTime > oneMonthAgo;
                  }).length
                }</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Customers Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Customer List</CardTitle>
            <CardDescription>Manage customer accounts, roles, and access permissions.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
          <ul className="divide-y divide-border">
            {customers.map((customer) => (
              <li key={customer._id}>
                <div className="px-4 py-4 flex items-center justify-between hover:bg-muted/40 cursor-pointer" onClick={() => { setSelectedCustomer(customer); setDetailsOpen(true); }}>
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <Users className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-foreground">
                          {customer.name}
                        </div>
                        <div className="ml-2">
                          {customer.isBlocked ? (
                            <Badge variant="destructive">Blocked</Badge>
                          ) : customer.isActive ? (
                            <Badge className="bg-green-600">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {customer.email} • {customer.company}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Role: {customer.role?.replace('_', ' ') || 'customer'} • 
                        Tier: {customer.subscriptionTier || 'basic'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="text-muted-foreground hover:text-foreground" onClick={(e) => { e.stopPropagation(); setSelectedCustomer(customer); setDetailsOpen(true); }}>
                      <Eye className="h-5 w-5" />
                    </button>
                    <button className="text-muted-foreground hover:text-foreground">
                      <Edit className="h-5 w-5" />
                    </button>
                    <button className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-5 w-5" />
                    </button>
                    <button className="text-muted-foreground hover:text-foreground">
                      <MoreHorizontal className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          {customers.length === 0 && (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-medium text-foreground">No customers</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Get started by adding your first customer.
              </p>
              <div className="mt-6">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Customer
                </Button>
              </div>
            </div>
          )}
          </CardContent>
        </Card>
      </div>
      {selectedCustomer && (
        <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>{selectedCustomer.name}</SheetTitle>
              <SheetDescription>
                {selectedCustomer.company || 'Unknown Company'}
              </SheetDescription>
            </SheetHeader>
            <div className="px-4 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-muted-foreground">Email</div>
                  <div className="font-medium break-all">{selectedCustomer.email || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Role</div>
                  <div className="font-medium">{selectedCustomer.role?.replace('_',' ') || 'customer'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Subscription Tier</div>
                  <div className="font-medium">{selectedCustomer.subscriptionTier || 'basic'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Created</div>
                  <div className="font-medium">{selectedCustomer._creationTime ? new Date(selectedCustomer._creationTime).toLocaleDateString() : 'Unknown'}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  {selectedCustomer.isBlocked ? (
                    <Badge variant="destructive">Blocked</Badge>
                  ) : selectedCustomer.isActive ? (
                    <Badge className="bg-green-600">Active</Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </DashboardLayout>
  );
}
