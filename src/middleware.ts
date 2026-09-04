import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/modules/system/auth/auth.service'

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl
    
    // Completely skip auth for these public routes (no token verification needed)
    const publicRoutes = ['/api/auth/login', '/api/auth/setup', '/api/auth/logout', '/api/dev/reset-admin-password', '/login']
    if (publicRoutes.some(route => pathname.startsWith(route))) {
        return NextResponse.next()
    }
    
    // For auth endpoints that still require authentication (like change-password)
    // AND all other protected API routes
    if (pathname.startsWith('/api/')) {
        let token: string | undefined
        
        // Check Authorization header first, then cookie
        const authHeader = request.headers.get('authorization')
        if (authHeader?.startsWith('Bearer ')) {
            token = authHeader.slice(7)
        } else {
            const cookieToken = request.cookies.get('auth-token')
            if (cookieToken?.value) {
                token = cookieToken.value
            }
        }
        
        if (!token) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            )
        }
        const payload = await verifyToken(token)
        
        if (!payload) {
            return NextResponse.json(
                { success: false, message: 'Invalid token' },
                { status: 401 }
            )
        }
        
        // Add user info to request headers for controllers to use
        const requestHeaders = new Headers(request.headers)
        requestHeaders.set('x-user-email', payload.email)
        requestHeaders.set('x-user-role', payload.role)
        
        return NextResponse.next({
            request: {
                headers: requestHeaders,
            },
        })
    }
    
    return NextResponse.next()
}

export const config = {
    matcher: '/api/:path*',
}