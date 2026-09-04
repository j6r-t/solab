import { z } from 'zod'

export const recordBillPaymentSchema = z.object({
    billId: z.string().min(1, 'Bill ID is required'),
    amount: z.number().positive('Amount must be positive'),
    method: z.enum(['cash', 'cheque', 'card'], {
        message: 'Invalid payment method',
    }),
    chequeId: z.string().optional(),
    notes: z.string().optional(),
})

export type RecordBillPaymentFormData = z.infer<typeof recordBillPaymentSchema>