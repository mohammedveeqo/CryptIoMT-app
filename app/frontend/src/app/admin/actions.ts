'use server';

import { currentUser, clerkClient } from '@clerk/nextjs/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function impersonateUser(targetUserId: string) {
  try {
    // Get the current user
    const user = await currentUser();
    
    if (!user) {
      throw new Error('Unauthorized');
    }

    if (!targetUserId) {
      throw new Error('Target user ID is required');
    }

    // Get the Clerk client instance
    const clerk = await clerkClient();
    
    // Check if the target user exists
    const targetUser = await clerk.users.getUser(targetUserId);
    
    if (!targetUser) {
      throw new Error('User not found');
    }

    // Create a sign-in token for impersonation
    const signInToken = await clerk.signInTokens.createSignInToken({
      userId: targetUserId,
      expiresInSeconds: 3600, // 1 hour
    });

    // In a Server Action, we can't easily get the host from the request headers directly like in API routes
    // unless we use `headers()` from `next/headers`.
    const headersList = await import('next/headers').then(mod => mod.headers());
    const host = headersList.get('host');
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    
    // In development, prefer the actual host header to handle localhost/IP access correctly
    let baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (process.env.NODE_ENV === 'development' && host) {
      baseUrl = `${protocol}://${host}`;
    }
    baseUrl = baseUrl || (host ? `${protocol}://${host}` : 'http://localhost:3002');

    const impersonationUrl = `${baseUrl.replace(/\/$/, '')}/admin/impersonate-callback?ticket=${signInToken.token}`;

    // Set secure cookies for impersonation state tracking
    const cookieStore = await cookies();
    cookieStore.set('impersonation_state', JSON.stringify({
      originalUserId: user.id,
      targetUserId: targetUserId,
      timestamp: Date.now()
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600
    });

    return { success: true, impersonationUrl };

  } catch (error) {
    console.error('Error creating impersonation session:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
