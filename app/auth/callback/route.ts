
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * OAuth callback handler - migrated from Supabase Auth to NextAuth
 * NextAuth handles its own callbacks at /api/auth/callback/[provider]
 * This route exists for backward compatibility
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  
  // Redirect to dashboard - NextAuth handles auth callbacks automatically
  return NextResponse.redirect(requestUrl.origin + '/dashboard')
}
