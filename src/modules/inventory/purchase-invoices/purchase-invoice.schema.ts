import { z } from 'zod'

const paymentMethodSchema = z.enum(['cash', 'cheque', 'traite'], {
    message: 'Invalid payment method',
})

const newProductSchema = z.object({
    name: z.string().min(1, 'Product name is required'),
    brand: z.string().min(1, 'Brand is required'),
    model: z.string().optional(),
    category: z.string().min(1, 'Category is required'),
    /** Selling price (suggested from cost × profit % on the client). */
    price: z.number().nonnegative('Price must be non-negative'),
    priceAfterTax: z.number().nonnegative().nullable().optional(),
    thickness: z.string().optional(),
    lensType: z.string().optional(),
    sph: z.number().optional(),
    cyl: z.number().optional(),
    add: z.number().optional(),
})

const invoiceItemSchema = z.object({
    description: z.string().optional(),
    category: z.string().optional(),
    quantity: z.number().int().positive('Quantity must be a positive integer'),
    unitPrice: z.number().nonnegative('Unit price must be non-negative'),
    productId: z.string().optional(),
    lensBlankId: z.string().optional(),
    newProduct: newProductSchema,
    newLensBlank: z.object({
        brand: z.string().min(1, 'Brand is required'),
        lensType: z.string().min(1, 'Lens type is required'),
        material: z.string().min(1, 'Material is required'),
        coating: z.string().min(1, 'Coating is required'),
        thickness: z.string().min(1, 'Thickness is required'),
        sph: z.number().optional(),
        cyl: z.number().optional(),
        sellingPrice: z.number().nonnegative('Price must be non-negative'),
    }),
})

const invoicePaymentSchema = z.object({
    amount: z.number().positive('Amount must be positive'),
    method: paymentMethodSchema,
    chequeNumber: z.string().optional(),
    chequeBank: z.string().optional(),
    chequeDueDate: z.string().optional(),
    chequeType: z.enum(['standard', 'traite'], { message: 'Invalid cheque type' }).optional(),
}).refine(
    (p) => p.method !== 'cheque' && p.method !== 'traite' || (!!p.chequeNumber && !!p.chequeDueDate),
    { message: 'Cheque number and due date are required for cheque/traite payments', path: ['chequeNumber'] }
)

export const purchaseInvoiceSchema = z.object({
    invoiceNumber: z.string().min(1, 'Invoice number is required'),
    fournisseurId: z.string().min(1, 'Supplier is required'),
    entity: z.enum(['shop', 'atelier'], {
        message: 'Entity must be shop or atelier',
    }),
    date: z.string().optional(),
    items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
    payments: z.array(invoicePaymentSchema).optional(),
    notes: z.string().optional(),
})

export const addSupplierPaymentSchema = z.object({
    amount: z.number().positive('Amount must be positive'),
    method: paymentMethodSchema,
    chequeNumber: z.string().optional(),
    chequeBank: z.string().optional(),
    chequeDueDate: z.string().optional(),
    chequeType: z.enum(['standard', 'traite'], { message: 'Invalid cheque type' }).optional(),
}).refine(
    (p) => p.method !== 'cheque' && p.method !== 'traite' || (!!p.chequeNumber && !!p.chequeDueDate),
    { message: 'Cheque number and due date are required for cheque/traite payments', path: ['chequeNumber'] }
)

export type PurchaseInvoiceFormData = z.infer<typeof purchaseInvoiceSchema>