import { NextRequest } from 'next/server'
import { UnauthorizedError } from '@/lib/errors'
import { verifyToken } from '@/features/auth/auth.service'

export async function getAuthenticatedUser(request: NextRequest): Promise<string> {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
        throw new UnauthorizedError('Unauthorized')
    }
    const token = authHeader.slice(7)
    const email = await verifyToken(token)
    if (!email) throw new UnauthorizedError('Invalid token')
    return email
}
