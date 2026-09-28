import { z } from 'zod'

export const loginSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
})

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
})

export const updateProfileSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name must be at most 100 characters').nullable().optional(),
    email: z.string().email('Invalid email format').optional(),
})

export type LoginFormData = z.infer<typeof loginSchema>
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>
export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>
