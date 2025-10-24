import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/prisma'

// POST /api/auth/delete-account - Delete user account
export async function POST(request: NextRequest) {
  try {
    // Get session using NextAuth
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { reason, feedback, password } = body

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 })
    }

    // TODO: Verify password before deletion for security
    // TODO: Add account_deletion_requests table to schema for soft deletes
    // For now, we'll log the deletion request and delete immediately
    
    console.log(`Account deletion requested for user ${user.id} at ${new Date().toISOString()}`)
    console.log(`Reason: ${reason || 'No reason provided'}`)
    console.log(`Feedback: ${feedback || 'None'}`)

    // Delete user and all related data (cascade will handle related records)
    await prisma.user.delete({
      where: { id: user.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully. We\'re sorry to see you go!'
    })

  } catch (error) {
    console.error('Account deletion error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
} 