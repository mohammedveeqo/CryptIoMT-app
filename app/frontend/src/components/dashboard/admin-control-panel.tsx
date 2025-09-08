'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, Crown, Settings } from 'lucide-react'

interface AdminControlPanelProps {
  userRole: string
}

export function AdminControlPanel({ userRole }: AdminControlPanelProps) {
  return (
    <Card className="bg-gradient-to-r from-orange-50 via-red-50 to-pink-50 border-orange-200/50 shadow-lg overflow-hidden">
      <CardContent className="pt-8 pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Crown className="h-8 w-8 text-white" />
              </div>
              <div className="absolute -inset-1 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl blur opacity-25"></div>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <p className="text-xl font-bold text-gray-900">
                  Admin Control Panel
                </p>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 border border-orange-200">
                  {userRole.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-gray-600 max-w-md leading-relaxed">
                You have elevated privileges to manage organizations, import data, and oversee system operations across the platform.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <Button className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-2.5">
              <Upload className="h-4 w-4 mr-2" />
              Bulk Data Import
            </Button>
            <Button variant="outline" className="border-orange-300 text-orange-700 hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 hover:border-orange-400 transition-all duration-200 px-6 py-2.5">
              <Settings className="h-4 w-4 mr-2" />
              System Settings
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}