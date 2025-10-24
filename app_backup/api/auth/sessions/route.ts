import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/prisma'

// GET /api/auth/sessions - Get user's active sessions
export async function GET(request: NextRequest) {
  try {
    // Get session using NextAuth
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        sessions: {
          orderBy: { expires: 'desc' }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 })
    }

    // Format sessions for response
    const formattedSessions = user.sessions.map(s => ({
      id: s.id,
      sessionToken: s.sessionToken.substring(0, 10) + '...', // Truncate for security
      expires: s.expires,
      isCurrent: s.sessionToken === session.user.id // Approximate check
    }))

    return NextResponse.json({
      success: true,
      sessions: formattedSessions
    })

  } catch (error) {
    console.error('Sessions fetch error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// DELETE /api/auth/sessions - Sign out from specific session or all sessions
export async function DELETE(request: NextRequest) {
  try {
    // Get session using NextAuth
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const signOutAll = searchParams.get('all') === 'true'

    if (signOutAll) {
      // Delete all sessions for this user
      await prisma.session.deleteMany({
        where: { userId: user.id }
      })

      return NextResponse.json({
        success: true,
        message: 'Signed out from all sessions'
      })

    } else if (sessionId) {
      // Delete specific session
      await prisma.session.delete({
        where: { 
          id: sessionId,
          userId: user.id // Ensure user owns this session
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Signed out from session'
      })

    } else {
      return NextResponse.json({ 
        error: 'Session ID or all=true parameter required' 
      }, { status: 400 })
    }

  } catch (error) {
    console.error('Session signout error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
} 