import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check if the request is for a protected route
  if (request.nextUrl.pathname.startsWith('/app')) {
    // Skip middleware for auth-related routes
    if (
      request.nextUrl.pathname.startsWith('/app/signin') ||
      request.nextUrl.pathname.startsWith('/app/signup') ||
      request.nextUrl.pathname.startsWith('/app/forgot-password') ||
      request.nextUrl.pathname.startsWith('/app/reset-password') ||
      request.nextUrl.pathname.startsWith('/api/auth')
    ) {
      return NextResponse.next();
    }

    // Check for session cookie
    const sessionCookie = request.cookies.get('better-auth.session_token');

    if (!sessionCookie) {
      // Redirect to signin if no session
      return NextResponse.redirect(new URL('/app/signin', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
