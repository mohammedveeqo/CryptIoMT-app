"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (isLoaded && !redirecting) {
      setRedirecting(true);
      if (isSignedIn) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [isSignedIn, isLoaded, router, redirecting]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading CryptIoMT...</p>
        {!isLoaded && (
          <p className="mt-2 text-sm text-gray-500">Initializing authentication...</p>
        )}
      </div>
    </div>
  );
}
