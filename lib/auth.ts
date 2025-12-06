import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import connectDB from './mongodb'
import User from '@/models/User'

const JWT_SECRET = process.env.JWT_SECRET

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required')
}

// TypeScript assertion: JWT_SECRET is guaranteed to be string after the check above
const JWT_SECRET_SAFE = JWT_SECRET as string

export interface AuthUser {
  userId: string
  email: string
  role?: 'admin' | 'staff'
}

export class AuthenticationError extends Error {
  statusCode: number
  constructor(message: string = 'Unauthorized', statusCode: number = 401) {
    super(message)
    this.name = 'AuthenticationError'
    this.statusCode = statusCode
  }
}

export class AuthorizationError extends Error {
  statusCode: number
  constructor(message: string = 'Forbidden', statusCode: number = 403) {
    super(message)
    this.name = 'AuthorizationError'
    this.statusCode = statusCode
  }
}

export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  return null
}

export async function verifyAuth(request: NextRequest): Promise<AuthUser | null> {
  try {
    const token = getTokenFromRequest(request)

    if (!token) {
      return null
    }

    const decoded = jwt.verify(token, JWT_SECRET_SAFE) as unknown as { userId: string; email: string; role?: string }

    await connectDB()
    const user = await User.findById(decoded.userId).select('role')

    if (!user) {
      return null
    }

    return {
      userId: decoded.userId,
      email: decoded.email,
      role: (user.role || decoded.role) as 'admin' | 'staff' | undefined,
    }
  } catch (error) {
    return null
  }
}

export async function requireAuth(request: NextRequest): Promise<AuthUser> {
  const user = await verifyAuth(request)

  if (!user) {
    throw new AuthenticationError('Unauthorized. Please provide a valid authentication token.', 401)
  }

  return user
}

export async function requireAdmin(request: NextRequest): Promise<AuthUser> {
  const user = await requireAuth(request)

  if (user.role !== 'admin') {
    throw new AuthorizationError('Forbidden: Admin access required.', 403)
  }

  return user
}
