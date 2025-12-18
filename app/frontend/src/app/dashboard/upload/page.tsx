"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileSpreadsheet } from "lucide-react";

export default function UploadPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center min-h-[400px] border-2 border-dashed rounded-lg bg-slate-50">
        <div className="text-center">
          <FileSpreadsheet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Upload Feature Coming Soon</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            This feature will allow you to bulk upload medical device inventories using standard Excel templates.
          </p>
        </div>
      </div>
    </div>
  );
}
