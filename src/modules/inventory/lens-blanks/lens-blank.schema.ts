import { z } from 'zod'

export const lensBlankSchema = z.object({
    brand: z.string().min(1, 'Brand is required'),
    lensType: z.string().min(1, 'Lens type is required'),
    material: z.string().min(1, 'Material is required'),
    coating: z.string().min(1, 'Coating is required'),
    thickness: z.string().min(1, 'Thickness is required'),
    sph: z.number(),
    cyl: z.number(),
    costPrice: z.number().nonnegative('Cost price must be non-negative'),
    sellingPrice: z.number().nonnegative('Selling price must be non-negative'),
    quantity: z.number().int().nonnegative().optional(),
    fournisseurId: z.string().optional(),
})

export const adjustStockSchema = z.object({
    quantity: z.number().int('Quantity must be an integer'),
    reason: z.string().min(1, 'Reason is required'),
})

export type LensBlankFormData = z.infer<typeof lensBlankSchema>