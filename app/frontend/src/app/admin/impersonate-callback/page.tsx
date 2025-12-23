'use client';

import { useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSignIn, useClerk } from '@clerk/nextjs';

function ImpersonateCallbackContent() {
  const { signIn, setActive } = useSignIn();
  const { signOut } = useClerk();
  const router = useRouter();
  const searchParams = useSearchParams();
  const processingRef = useRef(false);

  useEffect(() => {
    if (processingRef.current) return;
    processingRef.current = true;

    const handleImpersonation = async () => {
      const ticket = searchParams.get('ticket');
      
      if (!ticket) {
        console.error('No impersonation ticket found');
        router.push('/admin');
        return;
      }

      if (!signIn || !setActive) {
        console.error('Sign-in not available');
        router.push('/admin');
        return;
      }

      try {
        console.log('Processing impersonation ticket:', ticket);

        // Sign out current user first to avoid "already signed in" error
        await signOut();
        
        // Use the sign-in token to authenticate as the target user
        const result = await signIn.create({
          strategy: 'ticket',
          ticket: ticket,
        });

        console.log('Sign-in result:', result);

        if (result?.status === 'complete') {
          console.log('Sign-in completed, setting active session');
          
          // Set the active session
          await setActive({ session: result.createdSessionId });
          
          console.log('Impersonation successful, redirecting to dashboard');
          
          // Set impersonation flag in session storage
          sessionStorage.setItem('impersonation_mode', JSON.stringify({
            isImpersonating: true,
            timestamp: Date.now()
          }));
          
          // Redirect to dashboard with impersonation flag
          // Use window.location.href to force a full reload and ensure auth state is picked up
          window.location.href = '/dashboard?impersonate=true';
        } else {
          console.log('Unexpected sign-in status:', result?.status);
          throw new Error(`Sign-in not completed. Status: ${result?.status}`);
        }
      } catch (error) {
        console.error('Impersonation failed:', error);
        // Show visible error to user
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        alert(`Impersonation failed: ${errorMessage}. Please check console for details.`);
        router.push('/admin');
      }
    };

    handleImpersonation();
  }, [signIn, setActive, router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-gray-600 font-medium">Processing impersonation...</p>
      </div>
    </div>
  );
}

export default function ImpersonateCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    }>
      <ImpersonateCallbackContent />
    </Suspense>
  );
}