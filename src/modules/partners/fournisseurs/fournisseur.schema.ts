import { z } from 'zod'

export const fournisseurSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    phone: z.string().optional(),
    address: z.string().nullable().optional(),
    email: z.string().email('Invalid email').nullable().optional(),
    taxId: z.string().nullable().optional(),
    entity: z.string().optional(),
})

export type FournisseurFormData = z.infer<typeof fournisseurSchema>