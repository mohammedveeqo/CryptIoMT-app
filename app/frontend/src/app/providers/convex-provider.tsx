"use client";

import { ReactNode, useEffect } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { useAuth, useUser } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

// Handle missing environment variable gracefully
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!convexUrl) {
  throw new Error(
    "Missing NEXT_PUBLIC_CONVEX_URL environment variable.\n" +
    "Set it in your .env.local file.\n" +
    "You can get this URL from https://dashboard.convex.dev"
  );
}

const convex = new ConvexReactClient(convexUrl);

function UserSyncWrapper({ children }: { children: ReactNode }) {
  const { user, isSignedIn } = useUser();
  const createOrUpdateUser = useMutation(api.users.createOrUpdateUser);

  useEffect(() => {
    const syncUser = async () => {
      if (isSignedIn && user) {
        try {
          await createOrUpdateUser({
            clerkUserId: user.id,
            email: user.emailAddresses[0]?.emailAddress || '',
            name: user.fullName || user.firstName || 'User'
          });
          console.log('User automatically synced to Convex:', user.id);
        } catch (error) {
          console.error('Failed to sync user to Convex:', error);
        }
      }
    };

    syncUser();
  }, [isSignedIn, user, createOrUpdateUser]);

  return <>{children}</>;
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      <UserSyncWrapper>
        {children}
      </UserSyncWrapper>
    </ConvexProviderWithClerk>
  );
}