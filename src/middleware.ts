import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const isAuthPage = req.nextUrl.pathname.startsWith('/auth')
  const isDashboard = req.nextUrl.pathname.startsWith('/dashboard')

  // If user is not signed in and trying to access protected routes, redirect to login
  if (!token && isDashboard) {
    return NextResponse.redirect(new URL('/auth', req.url))
  }

  // If user is signed in and trying to access auth pages, redirect to dashboard
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
}

// Specify which routes should be handled by the middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     * - api (API routes)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
  ],
} 