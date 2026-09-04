'use client'

import { api } from '@/lib/api/client'

interface User {
    id: string
    email: string
    name: string | null
    role: string
}

interface LoginResponse {
    success: boolean
    token: string
    user: User
}

export type { LoginResponse, User }

export const login = (email: string, password: string) =>
    api.post<LoginResponse>('/api/auth/login', { email, password })

export const changePassword = (currentPassword: string, newPassword: string) =>
    api.post('/api/auth/change-password', { currentPassword, newPassword })
