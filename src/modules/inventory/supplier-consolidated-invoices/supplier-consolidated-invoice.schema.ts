import { z } from 'zod'

const paymentMethodSchema = z.enum(['cash', 'cheque', 'traite'], {
    message: 'Invalid payment method',
})

export const groupSupplierInvoicesSchema = z.object({
    fournisseurId: z.string().min(1, 'Supplier ID is required'),
    invoiceIds: z.array(z.string().min(1)).min(2, 'At least 2 invoices are required'),
})

export type GroupSupplierInvoicesFormData = z.infer<typeof groupSupplierInvoicesSchema>

export const recordSupplierConsolidatedPaymentSchema = z
    .object({
        amount: z.number().positive('Amount must be positive'),
        method: paymentMethodSchema,
        chequeNumber: z.string().optional(),
        chequeBankName: z.string().optional(),
        chequeDueDate: z.string().optional(),
        chequeType: z.enum(['standard', 'traite'], { message: 'Invalid cheque type' }).optional(),
        notes: z.string().optional(),
    })
    .refine(
        (p) =>
            (p.method !== 'cheque' && p.method !== 'traite') ||
            (!!p.chequeNumber && p.chequeNumber.trim().length > 0 && !!p.chequeDueDate && p.chequeDueDate.trim().length > 0),
        { message: 'Cheque number and due date are required for cheque/traite payments', path: ['chequeNumber'] }
    )

export type RecordSupplierConsolidatedPaymentFormData = z.infer<typeof recordSupplierConsolidatedPaymentSchema>
