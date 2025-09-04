import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/login',
  '/api(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const currentUrl = new URL(req.url);
  const isAccessingDashboard = currentUrl.pathname.startsWith('/dashboard');
  const isAccessingLogin = currentUrl.pathname === '/login';

  // If user is logged in and accessing login page, redirect to dashboard
  if (userId && isAccessingLogin) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // If user is not logged in and accessing protected route, redirect to login
  if (!userId && isAccessingDashboard) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // For non-public routes, redirect unauthenticated users to login
  if (!isPublicRoute(req) && !userId) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};