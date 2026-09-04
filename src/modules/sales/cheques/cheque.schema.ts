import { z } from 'zod'

export const updateChequeStatusSchema = z.object({
    status: z.string().min(1),
})

export type UpdateChequeStatusInput = z.infer<typeof updateChequeStatusSchema>
