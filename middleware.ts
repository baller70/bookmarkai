
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    // Allow the request to proceed
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        const { pathname } = req.nextUrl;
        
        // Public routes that don't require authentication
        const publicRoutes = ['/auth/signin', '/auth/signup', '/auth', '/', '/features', '/pricing'];
        if (publicRoutes.some(route => pathname.startsWith(route))) {
          return true;
        }
        
        // All other routes require authentication
        return !!token;
      },
    },
    pages: {
      signIn: '/auth/signin',
    },
  }
);

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
