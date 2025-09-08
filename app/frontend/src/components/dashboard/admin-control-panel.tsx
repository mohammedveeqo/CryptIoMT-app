'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, Crown, Settings } from 'lucide-react'

interface AdminControlPanelProps {
  userRole: string
}

export function AdminControlPanel({ userRole }: AdminControlPanelProps) {
  return (
    <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center">
              <Crown className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-lg font-semibold text-orange-900">
                Admin Control Panel
              </p>
              <p className="text-sm text-orange-700">
                You have {userRole.replace('_', ' ')} access to manage organizations, import data, and oversee system operations.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button className="bg-orange-600 hover:bg-orange-700">
              <Upload className="h-4 w-4 mr-2" />
              Bulk Data Import
            </Button>
            <Button variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-50">
              <Settings className="h-4 w-4 mr-2" />
              System Settings
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}