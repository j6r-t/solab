import { z } from 'zod'

export const doctorSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    phone: z.string().optional(),
    address: z.string().nullable().optional(),
    specialization: z.string().nullable().optional(),
})

export type DoctorFormData = z.infer<typeof doctorSchema>