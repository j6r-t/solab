import { NextResponse } from 'next/server'

/**
 * Health check endpoint for Docker/uptime monitoring
 */
export async function GET() {
    return NextResponse.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'sofien-optic',
    })
}
