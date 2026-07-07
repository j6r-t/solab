import { NextRequest } from 'next/server'
import { UnauthorizedError, ForbiddenError } from '@/errors'
import { verifyToken } from '@/features/auth/auth.service'

export async function getAuthenticatedUser(request: NextRequest): Promise<string> {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
        throw new UnauthorizedError('Unauthorized')
    }
    const token = authHeader.slice(7)
    const payload = await verifyToken(token)
    if (!payload) throw new UnauthorizedError('Invalid token')
    return payload.email
}

export async function getAuthenticatedUserWithRole(request: NextRequest): Promise<{ email: string; role: string }> {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
        throw new UnauthorizedError('Unauthorized')
    }
    const token = authHeader.slice(7)
    const payload = await verifyToken(token)
    if (!payload) throw new UnauthorizedError('Invalid token')
    return payload
}

export function requireRole(allowedRoles: string[]) {
    return async (request: NextRequest): Promise<{ email: string; role: string }> => {
        const user = await getAuthenticatedUserWithRole(request)
        if (!allowedRoles.includes(user.role)) {
            throw new ForbiddenError('Insufficient permissions')
        }
        return user
    }
}
