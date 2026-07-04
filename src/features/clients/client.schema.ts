import { z } from 'zod'

export const clientSchema = z.object({
    name: z.string().min(1, 'First name is required'),
    familyName: z.string().min(1, 'Family name is required'),
    phone: z.string().min(1, 'Phone is required'),
    address: z.string().optional(),
    gender: z.enum(['male', 'female']).optional(),
})

export type ClientFormData = z.infer<typeof clientSchema>
