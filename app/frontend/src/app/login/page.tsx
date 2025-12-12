"use client";

import { useUser } from "@clerk/nextjs";
import { SignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
 

// Enhanced logo with security icon
function AppLogo() {
  return (
    <div className="flex items-center justify-center">
      <div className="text-3xl font-bold tracking-tight">
        <span className="text-black font-extrabold">Crypt</span>
        <span className="text-blue-600 font-bold">IoMT</span>
      </div>
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (isSignedIn) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100">
      <div className="flex min-h-screen items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          {/* Main card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            {/* Header section */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-8 text-center">
              <div className="mb-4"></div>
              <h1 className="text-2xl font-bold mb-2">
                <span className="text-black font-extrabold">Crypt</span><span className="text-blue-600 font-bold">IoMT</span>
              </h1>
              <p className="text-blue-100 text-sm">
                Healthcare Cybersecurity Platform
              </p>
            </div>

            {/* Content section */}
            <div className="px-8 py-8">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Welcome Back
                </h2>
                <p className="text-gray-600 text-sm">
                  Sign in to access your dashboard
                </p>
              </div>

              {/* Login form with forced centering */}
              <div className="flex justify-center">
                <SignIn 
                  appearance={{
                    elements: {
                      rootBox: "w-full !mx-auto !flex !justify-center",
                      card: "bg-transparent shadow-none border-0 p-0 w-full !mx-auto !max-w-none",
                      headerTitle: "hidden",
                      headerSubtitle: "hidden",
                      socialButtonsBlockButton: "w-full bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 transition-all duration-200 rounded-lg py-3 px-4 font-medium shadow-sm hover:shadow-md !mx-auto",
                      socialButtonsBlockButtonText: "text-gray-700 font-medium",
                      socialButtonsBlockButtonArrow: "text-gray-400",
                      dividerLine: "bg-gray-200",
                      dividerText: "text-gray-500 text-sm font-medium !text-center",
                      formFieldInput: "w-full border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 px-4 py-3 transition-all duration-200 bg-gray-50 focus:bg-white",
                      formFieldLabel: "text-gray-700 font-medium text-sm",
                      formButtonPrimary: "w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 !mx-auto",
                      footerActionLink: "text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200",
                      identityPreviewText: "text-gray-700",
                      identityPreviewEditButton: "text-blue-600 hover:text-blue-700 transition-colors duration-200",
                      formFieldInputShowPasswordButton: "text-gray-400 hover:text-gray-600",
                      formFieldAction: "text-blue-600 hover:text-blue-700 font-medium text-sm",
                      footer: "!text-center",
                      footerAction: "!text-center !justify-center"
                    },
                    layout: {
                      socialButtonsPlacement: "top"
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Simple, clean footer text */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              © 2025 CryptIoMT
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
