
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const adminSessionCookie = request.cookies.get('admin-session');

  // Protect all /admin routes except /admin/login
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!adminSessionCookie || adminSessionCookie.value !== 'true') {
      // Not authenticated, redirect to login
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // If authenticated admin tries to access /admin/login, redirect to dashboard
  if (pathname === '/admin/login') {
    if (adminSessionCookie && adminSessionCookie.value === 'true') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*', // Matches all routes under /admin, including /admin itself
    '/admin/login',
  ],
};
