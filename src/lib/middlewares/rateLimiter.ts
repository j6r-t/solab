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
 * FNV-1a over a string — small, deterministic, dependency-free. Used only for
 * the last-resort bucket key when no proxy exposes the client IP.
 */
function hashKey(input: string): string {
    let hash = 0x811c9dc5
    for (let i = 0; i < input.length; i++) {
        hash ^= input.charCodeAt(i)
        hash = Math.imul(hash, 0x01000193)
    }
    return (hash >>> 0).toString(16)
}

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

    // Production concern: every client behind a proxy that strips these
    // headers must NOT collapse into a single shared bucket (the old
    // '127.0.0.1' fallback silently rate-limited the whole user base as one
    // identity). So: first x-forwarded-for entry, then x-real-ip, then
    // cf-connecting-ip, and only as a last resort a hash of stable request
    // attributes — which spreads traffic across buckets instead of pooling
    // every unknown client into one.
    const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    const realIp = request.headers.get('x-real-ip')?.trim()
    const cfIp = request.headers.get('cf-connecting-ip')?.trim()
    const bucketKey =
        forwarded ||
        realIp ||
        cfIp ||
        `anon:${hashKey(`${request.headers.get('user-agent') ?? ''}|${new URL(request.url).pathname}`)}`

    const { allowed, remaining, resetAt } = isInRateLimit(bucketKey)

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
