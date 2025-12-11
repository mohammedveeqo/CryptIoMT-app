"use client";

import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-[40vh] flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full rounded-2xl border border-gray-200 bg-white p-6 shadow-sm text-center">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h1>
        <p className="text-sm text-gray-600 mb-4">{error.message}</p>
        <Button onClick={reset} className="bg-blue-600 hover:bg-blue-700">Try again</Button>
      </div>
    </div>
  );
}
