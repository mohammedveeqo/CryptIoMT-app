"use client";

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Shield, CheckCircle, AlertCircle } from 'lucide-react'

export default function AdminSetup() {
  const { user } = useUser()
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  
  const createInitialAdmin = useMutation(api.admin.createInitialAdmin)
  const currentUser = useQuery(api.users.getCurrentUser)
  
  // Check if user is already an admin
  const isAlreadyAdmin = currentUser?.role && ['super_admin', 'admin', 'analyst'].includes(currentUser.role)
  
  const [formData, setFormData] = useState({
    role: 'super_admin' as 'super_admin' | 'admin' | 'analyst'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    
    setIsCreating(true)
    setError('')
    
    try {
      await createInitialAdmin({
        clerkUserId: user.id,
        email: user.emailAddresses[0]?.emailAddress || '',
        name: user.fullName || user.firstName || 'Admin User',
        role: formData.role
      })
      
      setSuccess(true)
      
      // Force a complete page reload to refresh all Clerk and Convex state
      setTimeout(() => {
        window.location.replace('/admin')
      }, 2000)
      
    } catch (error: any) {
      console.error('Failed to create admin:', error)
      setError(error.message || 'Failed to create admin user')
    } finally {
      setIsCreating(false)
    }
  }

  // Show loading state while user data loads
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="p-8 text-center">
          <Shield className="h-16 w-16 text-blue-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Loading...</h1>
          <p className="text-gray-600">Please wait while we verify your authentication.</p>
        </Card>
      </div>
    )
  }
  
  if (isAlreadyAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Access Active</h1>
          <p className="text-gray-600 mb-4">You already have admin privileges.</p>
          <Button onClick={() => window.location.href = '/admin'} className="bg-blue-600 hover:bg-blue-700">
            Go to Admin Panel
          </Button>
        </Card>
      </div>
    )
  }
  
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin User Created!</h1>
          <p className="text-gray-600 mb-4">Redirecting to admin panel...</p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <Shield className="h-16 w-16 text-blue-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Setup</h1>
          <p className="text-gray-600">Create your admin account to access the admin panel.</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Admin Role
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="super_admin">Super Admin</option>
              <option value="admin">Admin</option>
              <option value="analyst">Analyst</option>
            </select>
          </div>

          <Button
            type="submit"
            disabled={isCreating}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isCreating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating Admin User...
              </>
            ) : (
              'Create Admin User'
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            This will create an admin user for: {user.emailAddresses[0]?.emailAddress}
          </p>
        </div>
      </Card>
    </div>
  )
}