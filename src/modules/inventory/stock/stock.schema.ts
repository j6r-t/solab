import { z } from 'zod'

export const productSchema = z.object({
    name: z.string().min(1, 'Product name is required'),
    brand: z.string().optional(),
    model: z.string().optional(),
    category: z.enum(['lunette', 'lentille', 'verre', 'accessory', 'nettoyant_lentilles', 'nettoyant_monture']).optional(),
    price: z.coerce.number().min(0, 'Price must be positive'),
    priceAfterTax: z.coerce.number().min(0).optional(),
    costPrice: z.coerce.number().optional(),
    quantity: z.coerce.number().int().min(0, 'Quantity must be 0 or more'),
    thickness: z.string().optional(),
    lensType: z.enum(['singleVision', 'progressive', 'bifocal', 'office', 'photochromic']).optional(),
    material: z.enum(['cr39', 'polycarbonate', 'highIndex', 'trivex']).optional(),
    coating: z.enum(['none', 'ar', 'scratchResistant', 'blueBlock', 'arScratch', 'arBlueBlock']).optional(),
    sph: z.coerce.number().optional(),
    cyl: z.coerce.number().optional(),
    add: z.coerce.number().optional(),
    fournisseurId: z.string().optional(),
})

export type ProductFormData = z.infer<typeof productSchema>
