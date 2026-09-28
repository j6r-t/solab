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

interface ChequeOpticianShopPaymentInput {
    id: string
    bill?: {
        id: string
        billNumber: string
        opticianShop?: { id: string; name: string } | null
    } | null
}

interface ChequeConsolidatedPaymentInput {
    id: string
    consolidatedInvoice?: {
        id: string
        invoiceNumber: string
        opticianShop?: { id: string; name: string } | null
    } | null
}

interface ChequeSupplierConsolidatedPaymentInput {
    id: string
    consolidatedInvoice?: {
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
    opticianShopPayments?: ChequeOpticianShopPaymentInput[]
    consolidatedPayments?: ChequeConsolidatedPaymentInput[]
    supplierConsolidatedPayments?: ChequeSupplierConsolidatedPaymentInput[]
}

export function toChequeResponse(cheque: ChequeInput): ChequeResponse {
    const payment = cheque.payments?.[0]
    const supplierPayment = cheque.supplierPayments?.[0]
    const opticianShopPayment = cheque.opticianShopPayments?.[0]
    const consolidatedPayment = cheque.consolidatedPayments?.[0]
    const supplierConsolidatedPayment = cheque.supplierConsolidatedPayments?.[0]
    const bill = opticianShopPayment?.bill
    const consolidatedInvoice = consolidatedPayment?.consolidatedInvoice
    const supplierConsolidatedInvoice = supplierConsolidatedPayment?.consolidatedInvoice
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
        opticianBill: bill
            ? {
                id: bill.id,
                billNumber: bill.billNumber,
                opticianShop: {
                    id: bill.opticianShop?.id || '',
                    name: bill.opticianShop?.name || '',
                },
            }
            : null,
        consolidatedInvoice: consolidatedInvoice
            ? {
                id: consolidatedInvoice.id,
                invoiceNumber: consolidatedInvoice.invoiceNumber,
                opticianShop: {
                    id: consolidatedInvoice.opticianShop?.id || '',
                    name: consolidatedInvoice.opticianShop?.name || '',
                },
            }
            : null,
        supplierConsolidated: supplierConsolidatedInvoice
            ? {
                id: supplierConsolidatedInvoice.id,
                invoiceNumber: supplierConsolidatedInvoice.invoiceNumber,
                fournisseur: {
                    id: supplierConsolidatedInvoice.fournisseur?.id || '',
                    name: supplierConsolidatedInvoice.fournisseur?.name || '',
                },
            }
            : null,
    }
}
