"use client";

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CheckCircle, AlertCircle, UserCog } from 'lucide-react'

export default function AdminSetup() {
  const router = useRouter()
  const { user, isLoaded: isUserLoaded } = useUser()
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'unauthorized'>('loading')
  const [message, setMessage] = useState('Verifying admin privileges...')
  
  const setupAdmin = useMutation(api.users.setupInitialAdmin)

  useEffect(() => {
    if (!isUserLoaded) return

    if (!user) {
      setStatus('unauthorized')
      setMessage('You must be logged in to access this page.')
      return
    }

    const performSetup = async () => {
      try {
        // Attempt to set up the current user as admin if no admins exist
        const result = await setupAdmin({
          email: user.emailAddresses[0]?.emailAddress || '',
          name: user.fullName || user.firstName || 'Admin User',
          clerkUserId: user.id
        })

        if (result.success) {
          setStatus('success')
          setMessage(result.message)
        } else {
          setStatus('error')
          setMessage(result.message)
        }
      } catch (error) {
        console.error('Setup error:', error)
        setStatus('error')
        setMessage('An error occurred during setup. Please check the console.')
      }
    }

    performSetup()
  }, [isUserLoaded, user, setupAdmin])

  const Background = () => (
    <>
      <div className="absolute inset-0 w-full h-full bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-blue-400 opacity-20 blur-[100px]"></div>
    </>
  );

  const cardClasses = "bg-white border-slate-200 shadow-xl text-slate-900";

  if (status === 'loading') {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 relative overflow-hidden p-4">
        <Background />
        <Card className={`w-full max-w-md text-center ${cardClasses} p-8`}>
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <UserCog className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Loading...</h1>
          <p className="text-slate-600">{message}</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 relative overflow-hidden p-4">
      <Background />
      <Card className={`w-full max-w-md ${cardClasses} p-8`}>
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <UserCog className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Admin Setup</h1>
        </div>

        <div className="space-y-6">
          <div className={`p-4 rounded-lg flex items-start space-x-3 ${
            status === 'success' ? 'bg-green-50 text-green-700' : 
            status === 'error' ? 'bg-red-50 text-red-700' : 
            'bg-slate-50 text-slate-700'
          }`}>
            {status === 'success' ? (
              <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            )}
            <div>
              <h3 className="font-semibold mb-1">
                {status === 'success' ? 'Success' : 
                 status === 'error' ? 'Error' : 'Notice'}
              </h3>
              <p className="text-sm opacity-90">{message}</p>
            </div>
          </div>

          <Button 
            onClick={() => router.push('/dashboard')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            Go to Dashboard
          </Button>
        </div>
      </Card>
    </div>
  )
}
