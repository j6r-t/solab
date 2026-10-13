import { NextResponse, type NextRequest } from 'next/server'

// Simple in-memory rate limit store (for development and single-instance production)
// For multi-instance production, deploy with Redis and use a distributed rate limiter
type RateLimitStore = {
    [key: string]: {
        count: number
        resetTime: number
    }
}

const rateLimitStore: RateLimitStore = {}
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000 // 10 minutes
const RATE_LIMIT_MAX_REQUESTS = 100

/**
 * Simple rate limiter using in-memory storage
 * WARNING: Not suitable for production with multiple instances
 * For production with multiple instances, use a distributed store like Redis
 */
function isInRateLimit(ip: string): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now()
    const record = rateLimitStore[ip]

    if (!record || now > record.resetTime) {
        // New window
        rateLimitStore[ip] = {
            count: 1,
            resetTime: now + RATE_LIMIT_WINDOW_MS,
        }
        return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1, resetAt: now + RATE_LIMIT_WINDOW_MS }
    }

    record.count++
    const remaining = Math.max(0, RATE_LIMIT_MAX_REQUESTS - record.count)

    return {
        allowed: record.count <= RATE_LIMIT_MAX_REQUESTS,
        remaining,
        resetAt: record.resetTime,
    }
}

/**
 * Rate limit middleware
 * Applies to all API routes
 */
export async function rateLimitMiddleware(request: NextRequest) {
    // Skip rate limiting for health checks
    if (request.url.includes('/api/health')) {
        return NextResponse.next()
    }

    // Get client IP
    // In Next.js 16, request.ip was removed. We use a default IP.
    // For production with proper IP detection, use request.headers.get('x-forwarded-for')
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1'

    const { allowed, remaining, resetAt } = isInRateLimit(ip)

    const response = NextResponse.next()

    // Add rate limit headers
    response.headers.set('X-RateLimit-Remaining', String(remaining))
    response.headers.set('X-RateLimit-Reset', String(Math.ceil(resetAt / 1000)))

    if (!allowed) {
        return new NextResponse(
            JSON.stringify({
                success: false,
                message: 'Rate limit exceeded. Please try again later.',
            }),
            {
                status: 429,
                headers: {
                    'Content-Type': 'application/json',
                    'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)),
                },
            }
        )
    }

    return response
}
