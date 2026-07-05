import type { LoginResponse, SetupResponse } from '@/dtos/auth/auth.dto'

export function toLoginResponse(user: { id: string; email: string; name: string | null; password?: string }, token: string): LoginResponse {
    const { password: _, ...safeUser } = user
    return { success: true, token, user: safeUser as LoginResponse['user'] }
}

export function toSetupResponse(user: { id: string; email: string; name: string | null }, defaultPassword: string): SetupResponse {
    return { message: 'Admin user created', user: user as SetupResponse['user'], defaultPassword }
}
