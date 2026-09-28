import { NextRequest } from 'next/server'
import { ok, noContent } from '@/lib/api/response'
import { handleError } from '@/lib/middlewares/errorHandler'
import { parseBody } from '@/lib/api/parse'
import { getAuthenticatedUser } from '@/lib/api/auth'
import { authenticateUser, setupAdmin, changePassword, updateProfile } from './auth.service'
import { AUTH_COOKIE_MAX_AGE } from '@/lib/constants'
import { auditService } from '@/modules/system/audit'
import { toLoginResponse, toSetupResponse } from '@/modules/system/auth/mappers/auth.mapper'
import { loginSchema, changePasswordSchema, updateProfileSchema } from '@/modules/system/auth/auth.schema'

export async function loginPOST(request: NextRequest) {
    try {
        const { email, password } = await parseBody(request, loginSchema)
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
        const { currentPassword, newPassword } = await parseBody(request, changePasswordSchema)
        await changePassword(email, currentPassword, newPassword)
        return noContent()
    } catch (error) {
        return handleError(error)
    }
}

export async function updateProfilePATCH(request: NextRequest) {
    try {
        const email = await getAuthenticatedUser(request)
        const data = await parseBody(request, updateProfileSchema)
        const { user, token } = await updateProfile(email, data)
        return ok({ user, token })
    } catch (error) {
        return handleError(error)
    }
}
