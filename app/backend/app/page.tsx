"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";

export default function Home() {
  const { user, isLoaded } = useUser();
  const currentUser = useQuery(api.users.getCurrentUser);
  const createOrUpdateUser = useMutation(api.users.createOrUpdateUser);

  // Auto-create user when they sign in
  useEffect(() => {
    if (isLoaded && user && !currentUser?.user) {
      createOrUpdateUser();
    }
  }, [isLoaded, user, currentUser, createOrUpdateUser]);

  if (!isLoaded) return <div>Loading...</div>;
  if (!user) return <div>Please sign in</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">CryptIoMT Dashboard</h1>
      
      {currentUser && (
        <div className="bg-gray-100 p-4 rounded mb-4">
          <h2 className="font-semibold">User Info:</h2>
          <p>Name: {currentUser.identity?.name}</p>
          <p>Email: {currentUser.identity?.email}</p>
          <p>Role: {currentUser.user?.role || 'Not set'}</p>
          <p>Status: {currentUser.user ? 'Stored in Convex' : 'Not in database yet'}</p>
        </div>
      )}
    </div>
  );
}
