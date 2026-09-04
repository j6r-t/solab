import type { LoginResponse, SetupResponse, UserResponse } from '@/modules/system/auth/dtos/auth.dto'

export function toLoginResponse(user: { id: string; email: string; name: string | null; password?: string }, token: string): LoginResponse {
    const { password: _, ...safeUser } = user
    return { success: true, token, user: safeUser as LoginResponse['user'] }
}

export function toSetupResponse(user: { id: string; email: string; name: string | null }, defaultPassword: string): SetupResponse {
    return { message: 'Admin user created', user: user as SetupResponse['user'], defaultPassword }
}

export function toUserResponse(user: { id: string; email: string; name: string | null; role: string; createdAt?: string }): UserResponse {
    return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt
    }
}
