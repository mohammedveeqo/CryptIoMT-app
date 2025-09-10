import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/login',
  '/login/sso-callback',
  '/sign-in/sso-callback',
  '/api(.*)'
]);

const isImpersonationRoute = createRouteMatcher([
  '/admin/impersonate-callback'
]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { userId } = await auth();
  const url = new URL(req.url);
  const path = url.pathname;
  
  // Handle impersonation routes separately
  if (isImpersonationRoute(req)) {
    const isImpersonating = url.searchParams.has('ticket');
    const impersonationCookie = req.cookies.get('impersonation_state');
    
    if (isImpersonating || impersonationCookie) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL('/admin', req.url));
  }
  
  // Allow public routes
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }
  
  // Normal authentication logic
  if (!userId) {
    const signInUrl = new URL('/login', req.url);
    signInUrl.searchParams.set('redirect_url', path);
    return NextResponse.redirect(signInUrl);
  }
  
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