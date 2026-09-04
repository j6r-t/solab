import { z } from 'zod'

export const repairSchema = z.object({
    opticianShopId: z.string().min(1, 'Optician shop is required'),
    serviceIds: z.array(z.string().min(1)).min(1, 'At least one service is required'),
    expectedCompletionDate: z.string().min(1, 'Expected completion date is required'),
    lensSource: z.enum(['stock', 'optician'], {
        message: 'Lens source must be stock or optician',
    }),
    sphRight: z.number(),
    cylRight: z.number(),
    axisRight: z.number(),
    addRight: z.number(),
    pdRight: z.number(),
    sphLeft: z.number(),
    cylLeft: z.number(),
    axisLeft: z.number(),
    addLeft: z.number(),
    pdLeft: z.number(),
    thickness: z.string().optional(),
    lensType: z.string().optional(),
    material: z.string().optional(),
    coating: z.string().optional(),
    prescriptionNotes: z.string().optional(),
    lensBlankLeftId: z.string().optional(),
    lensBlankRightId: z.string().optional(),
    lensBlankPrice: z.number().nonnegative().optional(),
})

export const updateRepairStatusSchema = z.object({
    status: z.enum(['pending', 'in_progress', 'completed', 'delivered', 'cancelled'], {
        message: 'Invalid status',
    }),
})

export const assignLensBlanksSchema = z.object({
    lensBlankLeftId: z.string().optional(),
    lensBlankRightId: z.string().optional(),
    lensBlankPrice: z.number().nonnegative().optional(),
})

export const declareBreakageSchema = z.object({
    which: z.enum(['left', 'right', 'both'], {
        message: 'Must specify left, right, or both',
    }),
    reason: z.string().optional(),
})

export const recordRepairPaymentSchema = z.object({
    amount: z.number().positive('Amount must be positive'),
})

export type RepairFormData = z.infer<typeof repairSchema>