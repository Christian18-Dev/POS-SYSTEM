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

  const isProd = process.env.NODE_ENV === 'production'
  if (!isProd) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    const stack = error instanceof Error ? error.stack : undefined
    return NextResponse.json(
      {
        error: message,
        ...(stack ? { stack } : {}),
      },
      { status: 500 }
    )
  }

  return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
}
