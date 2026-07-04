import { NextRequest } from 'next/server'
import { ok, noContent } from '@/lib/api/response'
import { handleError } from '@/lib/api/error-handler'
import { parseBody } from '@/lib/api/parse'
import { getAuthenticatedUser } from '@/lib/api/auth'
import { authenticateUser, setupAdmin, changePassword } from './auth.service'
import { AUTH_COOKIE_MAX_AGE } from '@/lib/constants'

export async function loginPOST(request: NextRequest) {
    try {
        const { email, password } = await parseBody<{ email: string; password: string }>(request)
        const result = await authenticateUser(email, password)
        const response = ok({ success: true as const, token: result.token, user: result.user })
        response.cookies.set('auth-token', result.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: AUTH_COOKIE_MAX_AGE,
            path: '/',
        })
        return response
    } catch (error) {
        return handleError(error)
    }
}

export async function logoutPOST() {
    try {
        const response = noContent()
        response.cookies.delete('auth-token')
        return response
    } catch (error) {
        return handleError(error)
    }
}

export async function setupPOST() {
    try {
        const result = await setupAdmin()
        return ok({
            message: 'Admin user created',
            user: result.user,
            defaultPassword: result.defaultPassword,
        })
    } catch (error) {
        return handleError(error)
    }
}

export async function changePasswordPOST(request: NextRequest) {
    try {
        const email = await getAuthenticatedUser(request)
        const { currentPassword, newPassword } = await parseBody<{ currentPassword: string; newPassword: string }>(request)
        await changePassword(email, currentPassword, newPassword)
        return noContent()
    } catch (error) {
        return handleError(error)
    }
}
