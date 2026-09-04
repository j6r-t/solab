import { z } from 'zod'

export const prescriptionSchema = z.object({
    clientId: z.string().min(1, 'Client is required'),
    sphRight: z.coerce.number(),
    cylRight: z.coerce.number(),
    axisRight: z.coerce.number().int().min(0).max(180),
    addRight: z.coerce.number(),
    pdRight: z.coerce.number().int().min(0),
    sphLeft: z.coerce.number(),
    cylLeft: z.coerce.number(),
    axisLeft: z.coerce.number().int().min(0).max(180),
    addLeft: z.coerce.number(),
    pdLeft: z.coerce.number().int().min(0),
    doctorId: z.string().optional(),
    doctorName: z.string().optional(),
    dateWritten: z.string().optional(),
})

export type PrescriptionFormData = z.infer<typeof prescriptionSchema>
