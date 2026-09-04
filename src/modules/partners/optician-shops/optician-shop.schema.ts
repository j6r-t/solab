import { z } from 'zod'

export const opticianShopSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    phone: z.string().min(1, 'Phone is required'),
    address: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
})

export type OpticianShopFormData = z.infer<typeof opticianShopSchema>