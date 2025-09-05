"use client";

import { useUser } from "@clerk/nextjs";
import { SignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

// Logo component matching marketing site
function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: { text: "text-lg" },
    md: { text: "text-xl" },
    lg: { text: "text-2xl" }
  };

  const currentSize = sizeClasses[size];

  return (
    <div className={`flex items-center ${currentSize.text} font-bold tracking-tight`}>
      <span className="text-slate-800 font-extrabold">Crypt</span>
      <span className="text-blue-600 font-bold">IoMT</span>
    </div>
  );
}

export default function LoginPage() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push('/dashboard');
    }
  }, [isSignedIn, isLoaded, router]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isSignedIn) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header with logo */}
      <header className="w-full border-b bg-white/95 backdrop-blur">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4">
          <Logo size="sm" />
          <Link 
            href="https://cryptiomt.com" 
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            ← Back to Marketing Site
          </Link>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Welcome section */}
          <div className="text-center mb-8">
            <Logo size="lg" />
            <h1 className="mt-4 text-2xl font-bold text-gray-900">
              Welcome Back
            </h1>
            <p className="mt-2 text-gray-600">
              Sign in to access your CryptIoMT dashboard
            </p>
          </div>

          {/* Clerk SignIn component with custom styling */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <SignIn
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "bg-transparent shadow-none border-0 p-0",
                  headerTitle: "hidden",
                  headerSubtitle: "hidden",
                  socialButtonsBlockButton: "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors",
                  socialButtonsBlockButtonText: "text-gray-700 font-medium",
                  dividerLine: "bg-gray-200",
                  dividerText: "text-gray-500 text-sm",
                  formFieldInput: "border-gray-300 focus:border-blue-500 focus:ring-blue-500",
                  formButtonPrimary: "bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors",
                  footerActionLink: "text-blue-600 hover:text-blue-700 font-medium",
                  identityPreviewText: "text-gray-700",
                  identityPreviewEditButton: "text-blue-600 hover:text-blue-700"
                },
                layout: {
                  socialButtonsPlacement: "top"
                }
              }}
              redirectUrl="/dashboard"
            />
          </div>

          {/* Footer text */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Don't have an account?{" "}
              <Link href="/sign-up" className="text-blue-600 hover:text-blue-700 font-medium">
                Sign up here
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-gray-50 py-4">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-gray-500">
            © 2024 CryptIoMT. Healthcare Cybersecurity Solutions.
          </p>
        </div>
      </footer>
    </div>
  );
}