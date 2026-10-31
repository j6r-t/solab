import { z } from 'zod'

export const bankSchema = z.object({
    name: z.string().min(1, 'Bank name is required'),
})

export type BankFormData = z.infer<typeof bankSchema>
