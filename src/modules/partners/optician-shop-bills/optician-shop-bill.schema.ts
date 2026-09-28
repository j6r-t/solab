import { z } from 'zod'

export const recordBillPaymentSchema = z
    .object({
        amount: z.number().positive('Amount must be positive'),
        method: z.enum(['cash', 'card', 'cheque', 'traite'], {
            message: 'Invalid payment method',
        }),
        chequeId: z.string().optional(),
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

export type RecordBillPaymentFormData = z.infer<typeof recordBillPaymentSchema>

export const groupBillsSchema = z.object({
    opticianShopId: z.string().min(1, 'Shop ID is required'),
    billIds: z.array(z.string().min(1)).min(2, 'At least 2 bills are required'),
})

export type GroupBillsFormData = z.infer<typeof groupBillsSchema>

export const recordConsolidatedPaymentSchema = z
    .object({
        amount: z.number().positive('Amount must be positive'),
        method: z.enum(['cash', 'card', 'cheque', 'traite'], {
            message: 'Invalid payment method',
        }),
        chequeId: z.string().optional(),
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

export type RecordConsolidatedPaymentFormData = z.infer<typeof recordConsolidatedPaymentSchema>
