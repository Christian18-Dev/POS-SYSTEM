import { NextRequest, NextResponse } from 'next/server'

interface RateLimitOptions {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum number of requests per window
  identifier?: (request: NextRequest) => string // Function to identify the client
  message?: string // Custom error message
  skipSuccessfulRequests?: boolean // Don't count successful requests
}

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

// In-memory store (for production, consider using Redis)
const store: RateLimitStore = {}

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < now) {
      delete store[key]
    }
  })
}, 5 * 60 * 1000)

function getClientIdentifier(request: NextRequest): string {
  // Try to get IP from various headers (for proxies/load balancers)
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwarded?.split(',')[0] || realIp || 'unknown'
  
  // Also include user agent for additional identification
  const userAgent = request.headers.get('user-agent') || 'unknown'
  
  // Return a combination for better tracking
  return `${ip}:${userAgent.slice(0, 50)}`
}

export function rateLimit(options: RateLimitOptions) {
  const {
    windowMs,
    maxRequests,
    identifier = getClientIdentifier,
    message = 'Too many requests, please try again later.',
    skipSuccessfulRequests = false,
  } = options

  return async (request: NextRequest): Promise<NextResponse | null> => {
    const key = identifier(request)
    const now = Date.now()

    // Get or create rate limit entry
    let entry = store[key]

    if (!entry || entry.resetTime < now) {
      // Create new entry or reset expired one
      entry = {
        count: 0,
        resetTime: now + windowMs,
      }
      store[key] = entry
    }

    // Increment request count
    entry.count++

    // Check if limit exceeded
    if (entry.count > maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000)
      
      return NextResponse.json(
        {
          error: message,
          retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(entry.resetTime).toISOString(),
          },
        }
      )
    }

    // Return null to continue with the request
    return null
  }
}

// Pre-configured rate limiters for common use cases
// Login rate limit: 5 attempts per 5 minutes (configurable via env)
const LOGIN_RATE_LIMIT_WINDOW = parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS || '300000') // 5 minutes default
const LOGIN_RATE_LIMIT_MAX = parseInt(process.env.LOGIN_RATE_LIMIT_MAX || '10') // 5 attempts default

const STRICT_RATE_LIMIT_WINDOW = parseInt(process.env.STRICT_RATE_LIMIT_WINDOW_MS || '3600000') // 1 hour default
const STRICT_RATE_LIMIT_MAX = parseInt(process.env.STRICT_RATE_LIMIT_MAX || '200') // 200 requests default

export const loginRateLimit = rateLimit({
  windowMs: LOGIN_RATE_LIMIT_WINDOW,
  maxRequests: LOGIN_RATE_LIMIT_MAX,
  message: `Too many login attempts. Please try again in ${Math.ceil(LOGIN_RATE_LIMIT_WINDOW / 60000)} minutes.`,
})

export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60, // 60 requests per minute
  message: 'Too many requests. Please slow down.',
})

export const strictRateLimit = rateLimit({
  windowMs: STRICT_RATE_LIMIT_WINDOW,
  maxRequests: STRICT_RATE_LIMIT_MAX,
  message: 'Rate limit exceeded. Please try again later.',
})
