import { z } from 'zod'

const paymentMethodSchema = z.enum(['cash', 'cheque', 'traite'], {
    message: 'Invalid payment method',
})

const invoiceItemSchema = z.object({
    description: z.string().optional(),
    category: z.string().optional(),
    quantity: z.number().int().positive('Quantity must be a positive integer'),
    unitPrice: z.number().nonnegative('Unit price must be non-negative'),
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