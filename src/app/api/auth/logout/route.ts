import { NextResponse } from 'next/server'

export async function POST() {
    try {
        // Create response
        const response = NextResponse.json({ success: true })

        // Clear the auth cookie
        response.cookies.delete('auth-token')

        return response
    } catch (error) {
        console.error('POST /api/auth/logout error:', error)
        return NextResponse.json({ error: 'Logout failed' }, { status: 500 })
    }
}
