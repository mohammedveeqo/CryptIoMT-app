"use client";

import AlertsAndThreats from "@/components/dashboard/alerts-and-threats";
import { useOrganization } from "@/contexts/organization-context";

export default function AlertsPage() {
  const { currentOrganization } = useOrganization();

  return (
    <div className="space-y-6">
      {currentOrganization?._id ? (
        <AlertsAndThreats organizationId={currentOrganization._id} />
      ) : (
        <div className="flex items-center justify-center h-64 border rounded-lg bg-slate-50">
          <div className="text-muted-foreground">Please select an organization to view alerts</div>
        </div>
      )}
    </div>
  );
}
