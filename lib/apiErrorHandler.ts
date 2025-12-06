import { NextResponse } from 'next/server'
import { AuthenticationError, AuthorizationError } from './auth'

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof AuthenticationError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode }
    )
  }

  if (error instanceof AuthorizationError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode }
    )
  }

  // Log unexpected errors but don't expose details to client
  console.error('API Error:', error)
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  )
}
