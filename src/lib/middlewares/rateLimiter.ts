import { NextResponse, type NextRequest } from 'next/server'

// Simple in-memory rate limit store (for development)
// In production, use Redis with @upstash/ratelimit
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
 * Use @upstash/ratelimit with Redis for production
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
        return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1, resetAt: record?.resetTime || now + RATE_LIMIT_WINDOW_MS }
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
    // Skip rate limiting in development (use simple in-memory limiter)
    // In production, you should configure UPSTASH_REDIS_URL and UPSTASH_REDIS_TOKEN
    // and use the Redis-based limiter instead

    // Skip rate limiting for health checks
    if (request.url.includes('/api/health')) {
        return NextResponse.next()
    }

    // Get client IP
    const ip = request.ip || '127.0.0.1'

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

// Export a factory function for production Redis-based rate limiting
export function createRateLimiter(redisUrl?: string, redisToken?: string) {
    if (redisUrl && redisToken) {
        // Production: Use Upstash Redis
        return import('@upstash/ratelimit').then(({ Ratelimit }) => {
            return new Ratelimit({
                redis: new (require('@upstash/redis'))({
                    url: redisUrl,
                    token: redisToken,
                }),
                limiter: Ratelimit.slidingWindow(100, '10 m'),
                prefix: 'sofien_optic:',
            })
        })
    }
    // Development: Return simple in-memory limiter
    return Promise.resolve({ limit: (id: string) => Promise.resolve({ success: true, remaining: 99, reset: Date.now() + 600000 }) })
}
