import { z } from 'zod'

const orderItemSchema = z.object({
    productId: z.string().optional(),
    lensBlankId: z.string().optional(),
    name: z.string().optional(),
    quantity: z.number().int().positive('Quantity must be a positive integer'),
    unitPrice: z.number().nonnegative('Unit price must be non-negative').optional(),
})

const chequeInputSchema = z.object({
    number: z.string().min(1, 'Cheque number is required'),
    bankName: z.string().optional(),
    type: z.enum(['standard', 'traite'], { message: 'Cheque type must be standard or traite' }).optional(),
    dueDate: z.string().min(1, 'Cheque due date is required'),
})

const orderPaymentSchema = z.object({
    amount: z.number().positive('Amount must be positive'),
    type: z.enum(['deposit', 'balance', 'full'], {
        message: 'Payment type must be deposit, balance, or full',
    }),
    method: z.enum(['cash', 'cheque', 'card']).optional(),
    chequeId: z.string().optional(),
    dueDate: z.string().optional(),
    cheque: chequeInputSchema.optional(),
}).refine(
    (p) => p.method !== 'cheque' || !!p.cheque,
    { message: 'Cheque details are required for cheque payments', path: ['cheque'] }
).refine(
    (p) => p.method === 'cheque' || !p.cheque,
    { message: 'Cheque details are only allowed for cheque payments', path: ['cheque'] }
)

const orderRepairSchema = z.object({
    type: z.string().min(1, 'Repair type is required'),
    price: z.number().nonnegative('Price must be non-negative'),
    expectedCompletionDate: z.string().optional(),
    repairServiceId: z.string().optional(),
})

export const createOrderSchema = z.object({
    clientId: z.string().min(1, 'Client is required'),
    orderType: z.enum(['standard', 'remounting', 'direct_sale']).optional(),
    items: z.array(orderItemSchema).optional(),
    payments: z.array(orderPaymentSchema).optional(),
    repairs: z.array(orderRepairSchema).optional(),
    prescriptionId: z.string().optional(),
    turnaroundDays: z.number().int().nonnegative().optional(),
}).refine(
    (data) => data.items?.length || data.repairs?.length,
    { message: 'Order must have at least one item or repair', path: ['items'] }
)

export const updateOrderStatusSchema = z.object({
    status: z.enum(['ready', 'completed', 'cancelled'], {
        message: 'Invalid status',
    }),
})

export const addOrderPaymentsSchema = z.object({
    payments: z.array(orderPaymentSchema).min(1, 'At least one payment is required'),
})

export type CreateOrderFormData = z.infer<typeof createOrderSchema>