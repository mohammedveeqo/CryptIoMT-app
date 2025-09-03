"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../backend/convex/_generated/api";
import { DashboardLayout } from "../components/dashboard/layout";
import { DashboardOverview } from "../components/dashboard/overview";
import { SignIn } from "@clerk/nextjs";

export default function Home() {
  const { isSignedIn, user } = useUser();
  const currentUser = useQuery(api.users.getCurrentUser);

  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Welcome to CryptIoMT
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Cybersecurity Risk Assessment Platform
            </p>
          </div>
          <SignIn routing="hash" />
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <DashboardOverview />
    </DashboardLayout>
  );
}
