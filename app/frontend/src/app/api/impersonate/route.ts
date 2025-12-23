// app/api/impersonate/route.ts
import { currentUser } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';


export async function POST(request: NextRequest) {
  try {
    // Get the current user
    const user = await currentUser();
    
    if (!user) {
      console.error('No authenticated user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId: targetUserId } = await request.json();
    console.log('Impersonation request:', { adminUserId: user.id, targetUserId });
    
    if (!targetUserId) {
      return NextResponse.json({ error: 'Target user ID is required' }, { status: 400 });
    }

    try {
      // Get the Clerk client instance
      const clerk = await clerkClient();
      
      // Check if the target user exists
      const targetUser = await clerk.users.getUser(targetUserId);
      
      if (!targetUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Create a sign-in token for impersonation
      const signInToken = await clerk.signInTokens.createSignInToken({
        userId: targetUserId,
        expiresInSeconds: 3600, // 1 hour
      });

      // Construct the impersonation URL - use dedicated callback
      // Use dynamic host detection for better reliability
      const host = request.headers.get('host');
      const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (host ? `${protocol}://${host}` : 'http://localhost:3002');
      const impersonationUrl = `${baseUrl.replace(/\/$/, '')}/admin/impersonate-callback?ticket=${signInToken.token}`;

      // Set up the response
      const response = NextResponse.json({
        success: true,
        impersonationUrl
      });

      // Set secure cookies for impersonation state tracking
      response.cookies.set('impersonation_state', JSON.stringify({
        originalUserId: user.id,
        targetUserId: targetUserId,
        timestamp: Date.now()
      }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 3600
      });

      return response;

    } catch (error) {
      console.error('Error creating impersonation session:', error);
      return NextResponse.json({ error: 'Failed to create impersonation session' }, { status: 500 });
    }

  } catch (error) {
    console.error('Detailed impersonation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create impersonation token',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}