import { z } from 'zod'

export const repairServiceSchema = z.object({
    name: z.string().min(1, 'Service name is required'),
    defaultPrice: z.number().nonnegative('Price must be non-negative'),
})

export type RepairServiceFormData = z.infer<typeof repairServiceSchema>