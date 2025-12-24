"use client";

import { useUser } from "@clerk/nextjs";
import { SignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

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
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (isSignedIn) {
    return null; 
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 w-full h-full bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-blue-400 opacity-20 blur-[100px]"></div>

        {/* Logo Section */}
        <div className="z-10 mb-8 flex flex-col items-center text-center space-y-2">
            <h1 className="text-4xl font-bold tracking-tighter text-slate-900 md:text-5xl">
                Crypt<span className="text-blue-600">IoMT</span>
            </h1>
            <p className="text-slate-600 text-sm md:text-base max-w-[300px]">
                Access your security dashboard.
            </p>
        </div>

        {/* Clerk Component Wrapper */}
        <div className="z-10 w-full max-w-[400px] px-4">
          <SignIn 
            forceRedirectUrl="/dashboard"
            appearance={{
                layout: {
                    socialButtonsPlacement: "bottom",
                    socialButtonsVariant: "iconButton"
                },
                elements: {
                    rootBox: "w-full",
                    card: "bg-white border border-slate-200 shadow-xl rounded-xl w-full p-6 sm:p-8",
                    headerTitle: "text-slate-900 font-bold text-xl",
                    headerSubtitle: "text-slate-500 text-sm",
                    socialButtonsBlockButton: "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors",
                    dividerLine: "bg-slate-200",
                    dividerText: "text-slate-500",
                    formFieldLabel: "text-slate-700 text-xs uppercase tracking-wider font-semibold",
                    formFieldInput: "bg-white border-slate-200 text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all rounded-lg",
                    formButtonPrimary: "bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] transition-all rounded-lg h-10",
                    footerActionText: "text-slate-500",
                    footerActionLink: "text-blue-600 hover:text-blue-700 font-medium hover:underline decoration-blue-500/30 underline-offset-4",
                    identityPreviewText: "text-slate-700",
                    identityPreviewEditButton: "text-blue-600 hover:text-blue-700"
                }
            }}
          />
        </div>
        
        {/* Footer */}
        <div className="mt-12 text-center text-xs text-slate-500 z-10">
            <p>&copy; {new Date().getFullYear()} CryptIoMT. All rights reserved.</p>
        </div>
    </div>
  );
}
