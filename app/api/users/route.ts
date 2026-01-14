import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import bcrypt from 'bcryptjs'
import { requireAdmin } from '@/lib/auth'
import { validateEmail, validatePasswordStrength, sanitizeString } from '@/lib/validation'
import { handleApiError } from '@/lib/apiErrorHandler'
import { apiRateLimit, strictRateLimit } from '@/lib/rateLimit'

export async function GET(request: NextRequest) {
  try {
    const rateLimitResponse = await apiRateLimit(request)
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    await requireAdmin(request)
    await connectDB()

    const users = await User.find().select('-password').sort({ createdAt: -1 })

    return NextResponse.json({
      success: true,
      users: users.map((user) => ({
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      })),
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = await strictRateLimit(request)
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    await requireAdmin(request)
    await connectDB()

    const body = await request.json()
    const { email, password, name, role } = body

    // Validation
    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Email, password, and name are required' }, { status: 400 })
    }

    // Validate email format
    if (!validateEmail(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password)
    if (!passwordValidation.valid) {
      return NextResponse.json({ error: passwordValidation.message }, { status: 400 })
    }

    if (role && !['admin', 'staff'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role. Must be admin or staff' }, { status: 400 })
    }

    // Sanitize inputs
    const sanitizedEmail = email.toLowerCase().trim()
    const sanitizedName = sanitizeString(name, 100)

    // Check if user already exists
    const existingUser = await User.findOne({ email: sanitizedEmail })
    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = new User({
      email: sanitizedEmail,
      password: hashedPassword,
      name: sanitizedName,
      role: role || 'staff',
    })

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
