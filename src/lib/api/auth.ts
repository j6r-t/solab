import { NextRequest } from 'next/server'
import { UnauthorizedError, ForbiddenError } from '@/lib/errors'

/**
 * Get authenticated user email from request headers set by middleware
 * @param request - Next.js request object
 * @returns User email
 * @throws UnauthorizedError if user is not authenticated
 */
export function getAuthenticatedUser(request: NextRequest): string {
    const email = request.headers.get('x-user-email')
    if (!email) {
        throw new UnauthorizedError('Unauthorized')
    }
    return email
}

/**
 * Get authenticated user with role from request headers set by middleware
 * @param request - Next.js request object
 * @returns User object with email and role
 * @throws UnauthorizedError if user is not authenticated
 */
export function getAuthenticatedUserWithRole(request: NextRequest): { email: string; role: string } {
    const email = request.headers.get('x-user-email')
    const role = request.headers.get('x-user-role')
    
    if (!email || !role) {
        throw new UnauthorizedError('Unauthorized')
    }
    
    return { email, role }
}

/**
 * Require specific roles for access
 * @param allowedRoles - Array of allowed role names
 * @returns Function that validates user role
 * @throws ForbiddenError if user doesn't have required role
 */
export function requireRole(allowedRoles: string[]) {
    return (request: NextRequest): { email: string; role: string } => {
        const user = getAuthenticatedUserWithRole(request)
        if (!allowedRoles.includes(user.role)) {
            throw new ForbiddenError('Insufficient permissions')
        }
        return user
    }
}