import { NextResponse } from 'next/server'
import { db } from '@/lib/database/db'
import { logger } from '@/lib/logger'

/** Uptime checks hit this without a token (public in middleware) — never leak internals here. */
const HEALTH_TIMEOUT_MS = 2000

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined
    const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('Database check timed out')), ms)
    })
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer)) as Promise<T>
}

export async function GET() {
    const timestamp = new Date().toISOString()
    const uptimeSeconds = Math.round(process.uptime())

    try {
        await withTimeout(db.$queryRaw`SELECT 1`, HEALTH_TIMEOUT_MS)
        return NextResponse.json({ status: 'ok', db: 'ok', uptimeSeconds, timestamp })
    } catch (error) {
        logger.error('Health check: database unreachable', {
            error: error instanceof Error ? error.message : String(error),
        })
        return NextResponse.json(
            { status: 'degraded', db: 'unreachable', uptimeSeconds, timestamp },
            { status: 503 }
        )
    }
}
