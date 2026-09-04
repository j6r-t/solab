import type { ChequeResponse } from '@/modules/sales/cheques/dtos/cheque.dto'
import type { Prisma } from '@prisma/client'

type Numeric = Prisma.Decimal | string | number | null

interface ChequePaymentInput {
    id: string
    order?: {
        id: string
        orderNumber: number
        client?: { id: string; name: string; familyName: string } | null
    } | null
}

interface ChequeSupplierPaymentInput {
    id: string
    purchaseInvoice?: {
        id: string
        invoiceNumber: string
        fournisseur?: { id: string; name: string } | null
    } | null
}

interface ChequeInput {
    id: string
    number: string
    type: string
    bankName?: string | null
    amount: Numeric
    issueDate: Date
    dueDate: Date
    status: string
    entityType: string
    notes?: string | null
    payments?: ChequePaymentInput[]
    supplierPayments?: ChequeSupplierPaymentInput[]
}

export function toChequeResponse(cheque: ChequeInput): ChequeResponse {
    const payment = cheque.payments?.[0]
    const supplierPayment = cheque.supplierPayments?.[0]
    return {
        id: cheque.id,
        number: cheque.number,
        type: cheque.type,
        bankName: cheque.bankName ?? null,
        amount: cheque.amount == null ? '0' : String(cheque.amount),
        issueDate: cheque.issueDate,
        dueDate: cheque.dueDate,
        status: cheque.status,
        entityType: cheque.entityType,
        notes: cheque.notes ?? null,
        order: payment?.order
            ? {
                id: payment.order.id,
                orderNumber: payment.order.orderNumber,
                client: {
                    id: payment.order.client?.id || '',
                    name: payment.order.client?.name || '',
                    familyName: payment.order.client?.familyName || '',
                },
            }
            : null,
        invoice: supplierPayment?.purchaseInvoice
            ? {
                id: supplierPayment.purchaseInvoice.id,
                invoiceNumber: supplierPayment.purchaseInvoice.invoiceNumber,
                fournisseur: {
                    id: supplierPayment.purchaseInvoice.fournisseur?.id || '',
                    name: supplierPayment.purchaseInvoice.fournisseur?.name || '',
                },
            }
            : null,
    }
}
