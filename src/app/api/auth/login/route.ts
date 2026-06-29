import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createToken, comparePassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json()

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            )
        }

        const user = await db.user.findUnique({
            where: { email },
        })

        if (!user || !(await comparePassword(password, user.password))) {
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            )
        }

        const token = await createToken(user.email)

        // Create response with user data and token (token also needed by client for localStorage)
        const response = NextResponse.json({
            success: true,
            token,
            user: { id: user.id, email: user.email, name: user.name },
        })

        // Set HTTP-only cookie with JWT token
        response.cookies.set('auth-token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/',
        })

        return response
    } catch (error) {
        console.error('POST /api/auth/login error:', error)
        return NextResponse.json({ error: 'Login failed' }, { status: 500 })
    }
}