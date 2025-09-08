import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/login',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api(.*)',
  '/sign-in/sso-callback'
]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { userId } = await auth();
  const url = new URL(req.url);
  const path = url.pathname;
  
  // Check for impersonation mode
  const isImpersonating = url.searchParams.has('impersonate');
  const impersonationCookie = req.cookies.get('impersonation_state');
  
  // Allow impersonation access
  if (isImpersonating || impersonationCookie) {
    return NextResponse.next();
  }
  
  // Allow public routes
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }
  
  // Redirect unauthenticated users to login
  if (!userId) {
    const signInUrl = new URL('/login', req.url);
    signInUrl.searchParams.set('redirect_url', path);
    return NextResponse.redirect(signInUrl);
  }
  
  // Redirect authenticated users away from login to dashboard
  if (userId && path === '/login') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }
  
  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!.*\\..*|_next/static|_next/image|favicon.ico).*)',
    '/'
  ]
};