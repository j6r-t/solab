import { NextRequest } from 'next/server'
import { ok, noContent } from '@/lib/api/response'
import { handleError } from '@/middlewares/errorHandler'
import { parseBody } from '@/lib/api/parse'
import { getAuthenticatedUser } from '@/lib/api/auth'
import { authenticateUser, setupAdmin, changePassword } from './auth.service'
import { AUTH_COOKIE_MAX_AGE } from '@/lib/constants'
import { auditService } from '@/modules/audit'
import { toLoginResponse, toSetupResponse } from '@/mappers/auth.mapper'
import type { LoginInput, ChangePasswordInput } from '@/dtos/auth/auth.dto'

export async function loginPOST(request: NextRequest) {
    try {
        const { email, password } = await parseBody<LoginInput>(request)
        const result = await authenticateUser(email, password)
        const response = ok(toLoginResponse(result.user, result.token))
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
        await auditService.log({ action: 'USER_LOGOUT', entityType: 'USER' })
        return response
    } catch (error) {
        return handleError(error)
    }
}

export async function setupPOST() {
    try {
        const result = await setupAdmin()
        return ok(toSetupResponse(result.user, result.defaultPassword))
    } catch (error) {
        return handleError(error)
    }
}

export async function changePasswordPOST(request: NextRequest) {
    try {
        const email = await getAuthenticatedUser(request)
        const { currentPassword, newPassword } = await parseBody<ChangePasswordInput>(request)
        await changePassword(email, currentPassword, newPassword)
        return noContent()
    } catch (error) {
        return handleError(error)
    }
}
