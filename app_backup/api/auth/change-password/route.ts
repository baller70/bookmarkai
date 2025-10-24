import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/prisma'
import { hash, compare } from 'bcryptjs'

// POST /api/auth/change-password - Change user password
export async function POST(request: NextRequest) {
  try {
    // Get session using NextAuth
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ 
        error: 'Current password and new password are required' 
      }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ 
        error: 'New password must be at least 8 characters long' 
      }, { status: 400 })
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user || !user.password) {
      return NextResponse.json({ 
        error: 'User not found or password not set' 
      }, { status: 404 })
    }

    // Verify current password
    const passwordValid = await compare(currentPassword, user.password)
    if (!passwordValid) {
      return NextResponse.json({ 
        error: 'Current password is incorrect' 
      }, { status: 400 })
    }

    // Hash and update new password
    const hashedPassword = await hash(newPassword, 12)
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    })

    // TODO: Add activity logging to user_activity_logs table when schema is updated
    console.log(`Password changed for user ${user.id} at ${new Date().toISOString()}`)

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully'
    })

  } catch (error) {
    console.error('Password change error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
} 