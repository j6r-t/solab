import { z } from 'zod'

export const clientSchema = z.object({
    name: z.string().min(1, 'First name is required'),
    familyName: z.string().min(1, 'Family name is required'),
    phone: z.string().min(1, 'Phone is required'),
    address: z.string().optional(),
    gender: z.enum(['male', 'female']).optional(),
})

export type ClientFormData = z.infer<typeof clientSchema>

export const productSchema = z.object({
    name: z.string().min(1, 'Product name is required'),
    brand: z.string().optional(),
    model: z.string().optional(),
    category: z.enum(['eyewear', 'lens', 'accessory']).optional(),
    price: z.coerce.number().min(0, 'Price must be positive'),
    quantity: z.coerce.number().int().min(0, 'Quantity must be 0 or more'),
    lensType: z.enum(['singleVision', 'progressive', 'bifocal', 'office', 'photochromic']).optional(),
    material: z.enum(['cr39', 'polycarbonate', 'highIndex', 'trivex']).optional(),
    coating: z.enum(['none', 'ar', 'scratchResistant', 'blueBlock', 'arScratch', 'arBlueBlock']).optional(),
    sph: z.coerce.number().optional(),
    cyl: z.coerce.number().optional(),
    add: z.coerce.number().optional(),
})

export type ProductFormData = z.infer<typeof productSchema>

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
    doctorName: z.string().min(1, 'Doctor name is required'),
})

export type PrescriptionFormData = z.infer<typeof prescriptionSchema>