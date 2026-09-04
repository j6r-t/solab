import { z } from 'zod'

export const createUserSchema = z.object({
    email: z.string().email('Invalid email format'),
    name: z.string().nullable().optional(),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['admin', 'shop', 'atelier'], {
        message: 'Role must be admin, shop, or atelier',
    }),
})

export const updateUserSchema = z.object({
    name: z.string().nullable().optional(),
    role: z.enum(['admin', 'shop', 'atelier'], {
        message: 'Role must be admin, shop, or atelier',
    }).optional(),
    password: z.string().min(6, 'Password must be at least 6 characters').optional(),
})
