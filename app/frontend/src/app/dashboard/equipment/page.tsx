"use client";

import { DeviceInventory } from "@/components/dashboard/device-inventory";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";

export default function EquipmentPage() {
  const { user } = useUser();
  const currentUser = useQuery(api.users.getCurrentUser);
  
  const userRole = (currentUser && 'role' in currentUser && currentUser.role) ? currentUser.role : "customer";
  const isAdmin = ["super_admin", "admin", "analyst"].includes(userRole);

  return (
    <div className="space-y-6">
      <DeviceInventory isAdmin={isAdmin} userRole={userRole} />
    </div>
  );
}
