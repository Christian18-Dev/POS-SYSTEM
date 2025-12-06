import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import bcrypt from 'bcryptjs'
import { requireAdmin } from '@/lib/auth'
import { validateEmail, validatePasswordStrength, sanitizeString } from '@/lib/validation'
import { handleApiError } from '@/lib/apiErrorHandler'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin(request)
    await connectDB()

    const user = await User.findById(params.id).select('-password')

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin(request)
    await connectDB()

    const body = await request.json()
    const { email, password, name, role } = body

    const user = await User.findById(params.id)

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Update fields
    if (email !== undefined && email !== user.email) {
      if (!validateEmail(email)) {
        return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
      }
      const sanitizedEmail = email.toLowerCase().trim()
      // Check if new email already exists
      const existingUser = await User.findOne({ email: sanitizedEmail })
      if (existingUser) {
        return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 })
      }
      user.email = sanitizedEmail
    }

    if (name !== undefined) {
      user.name = sanitizeString(name, 100)
    }
    if (role !== undefined) {
      if (!['admin', 'staff'].includes(role)) {
        return NextResponse.json({ error: 'Invalid role. Must be admin or staff' }, { status: 400 })
      }
      user.role = role
    }
    if (password !== undefined && password !== '') {
      const passwordValidation = validatePasswordStrength(password)
      if (!passwordValidation.valid) {
        return NextResponse.json({ error: passwordValidation.message }, { status: 400 })
      }
      user.password = await bcrypt.hash(password, 10)
    }

    await user.save()

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminUser = await requireAdmin(request)
    await connectDB()

    const user = await User.findById(params.id)

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === adminUser.userId) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
    }

    await User.findByIdAndDelete(params.id)

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    })
  } catch (error) {
    return handleApiError(error)
  }
}
