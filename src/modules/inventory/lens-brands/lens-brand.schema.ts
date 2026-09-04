import { z } from 'zod'

export const lensBrandSchema = z.object({
    name: z.string().min(1, 'Brand name is required'),
})

export type LensBrandFormData = z.infer<typeof lensBrandSchema>