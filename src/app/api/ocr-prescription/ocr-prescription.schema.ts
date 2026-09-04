import { z } from 'zod'

export const ocrPrescriptionSchema = z.object({
    imageData: z.string().min(1, 'Image data is required'),
})