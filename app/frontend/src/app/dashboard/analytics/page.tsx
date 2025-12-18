"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center min-h-[400px] border-2 border-dashed rounded-lg bg-slate-50">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Advanced Analytics Coming Soon</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            This module will provide detailed statistical analysis, trend forecasting, and custom reporting capabilities.
          </p>
        </div>
      </div>
    </div>
  );
}
