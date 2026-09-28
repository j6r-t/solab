import { chequeRepo } from '@/lib/database/repositories'
import { db } from '@/lib/database/db'
import { BadRequestError, NotFoundError, ForbiddenError } from '@/lib/errors'
import { ChequeStatus, ChequeEntityType, Prisma } from '@prisma/client'
import { auditService } from '@/modules/system/audit'
import { effectivePaymentTotal } from '@/lib/utils/payments'
import { syncBillPaidState } from '@/modules/partners/optician-shop-bills/optician-shop-bill.service'
import { syncInvoiceStoredPaid } from '@/modules/inventory/purchase-invoices/purchase-invoice.service'

const CHEQUE_INCLUDE = {
    payments: {
        orderBy: { createdAt: 'asc' },
        include: { order: { include: { client: { select: { id: true, name: true, familyName: true } } } } },
    },
    supplierPayments: {
        orderBy: { paidAt: 'asc' },
        include: { purchaseInvoice: { include: { fournisseur: { select: { id: true, name: true } } } } },
    },
    opticianShopPayments: {
        orderBy: { paidAt: 'asc' },
        include: { bill: { include: { opticianShop: { select: { id: true, name: true } } } } },
    },
    consolidatedPayments: {
        orderBy: { paidAt: 'asc' },
        include: { consolidatedInvoice: { include: { opticianShop: { select: { id: true, name: true } } } } },
    },
    supplierConsolidatedPayments: {
        orderBy: { paidAt: 'asc' },
        include: { consolidatedInvoice: { include: { fournisseur: { select: { id: true, name: true } } } } },
    },
} satisfies Prisma.ChequeInclude

const ALLOWED_TARGETS: Record<string, string[]> = {
    client_payment: ['cashed', 'bounced'],
    supplier_payment: ['paid', 'bounced'],
}

export type ChequeInstrumentScope = 'optician_bill' | 'supplier'

export async function listCheques(params?: {
    status?: string
    statuses?: string
    entityType?: string
    dueBefore?: string
    instrumentScopes?: ChequeInstrumentScope[]
}) {
    const where: Prisma.ChequeWhereInput = {}
    const validStatuses = Object.values(ChequeStatus) as string[]
    const statusList = (params?.statuses ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter((s): s is ChequeStatus => validStatuses.includes(s))
    if (statusList.length > 0) {
        where.status = { in: statusList }
    } else if (params?.status) {
        where.status = params.status as ChequeStatus
    }
    if (params?.entityType) where.entityType = params.entityType as ChequeEntityType
    if (params?.dueBefore) {
        const dueBefore = new Date(params.dueBefore)
        if (!Number.isNaN(dueBefore.getTime())) {
            where.dueDate = { lte: dueBefore }
        }
    }
    // Instrument scoping: keep only cheques linked via OpticianShopPayment
    // (optician bills), ConsolidatedPayment (grouped invoices),
    // SupplierPayment or SupplierConsolidatedPayment (grouped supplier
    // invoices), regardless of entityType. The OR is AND-composed with
    // the other top-level filters.
    if (params?.instrumentScopes && params.instrumentScopes.length > 0) {
        where.OR = params.instrumentScopes.flatMap((scope) =>
            scope === 'optician_bill'
                ? [
                      { opticianShopPayments: { some: {} } } as Prisma.ChequeWhereInput,
                      { consolidatedPayments: { some: {} } } as Prisma.ChequeWhereInput,
                  ]
                : [
                      { supplierPayments: { some: {} } } as Prisma.ChequeWhereInput,
                      { supplierConsolidatedPayments: { some: {} } } as Prisma.ChequeWhereInput,
                  ]
        )
    }

    return chequeRepo.findMany({
        where,
        include: CHEQUE_INCLUDE,
        orderBy: { dueDate: 'asc' },
    })
}

async function syncConsolidatedInvoiceStoredPaid(invoiceId: string) {
    const invoice = await db.consolidatedInvoice.findUnique({
        where: { id: invoiceId },
        include: { payments: { include: { cheque: { select: { status: true } } } } },
    })
    if (!invoice) return
    const effective = effectivePaymentTotal(
        invoice.payments.map((p) => ({ amount: p.amount.toString(), method: p.method, cheque: p.cheque })),
        'client'
    )
    const status = effective >= Number(invoice.totalAmount) ? 'paid' : effective > 0 ? 'partiallyPaid' : 'unpaid'
    await db.consolidatedInvoice.update({ where: { id: invoiceId }, data: { paidAmount: Math.min(effective, Number(invoice.totalAmount)), status } })
}

async function syncSupplierConsolidatedInvoiceStoredPaid(invoiceId: string) {
    const invoice = await db.supplierConsolidatedInvoice.findUnique({
        where: { id: invoiceId },
        include: { payments: { include: { cheque: { select: { status: true } } } } },
    })
    if (!invoice) return
    const effective = effectivePaymentTotal(
        invoice.payments.map((p) => ({ amount: p.amount.toString(), method: p.method, cheque: p.cheque })),
        'supplier'
    )
    const status = effective >= Number(invoice.totalAmount) ? 'paid' : effective > 0 ? 'partiallyPaid' : 'unpaid'
    await db.supplierConsolidatedInvoice.update({ where: { id: invoiceId }, data: { paidAmount: Math.min(effective, Number(invoice.totalAmount)), status } })
}

export async function updateChequeStatus(id: string, status: string, opts?: { role?: string }) {
    // Fetch the cheque with all back-relations to resolve what it is
    // linked to; this drives the role-based transition guard below.
    const cheque = await db.cheque.findUnique({
        where: { id },
        include: {
            payments: { take: 1 },
            supplierPayments: { take: 1 },
            opticianShopPayments: { take: 1 },
            consolidatedPayments: { take: 1 },
            supplierConsolidatedPayments: { take: 1 },
        },
    })
    if (!cheque) throw new NotFoundError('Cheque not found')

    // Atelier may only touch instruments linked to optician bills, grouped
    // invoices, supplier invoices or grouped supplier invoices — client-order
    // cheques (and orphans) stay admin/shop only.
    if (opts?.role === 'atelier') {
        const viaOpticianBill = cheque.opticianShopPayments.length > 0
        const viaSupplier = cheque.supplierPayments.length > 0
        const viaConsolidated = cheque.consolidatedPayments.length > 0
        const viaSupplierConsolidated = cheque.supplierConsolidatedPayments.length > 0
        if (!viaOpticianBill && !viaSupplier && !viaConsolidated && !viaSupplierConsolidated) {
            throw new ForbiddenError('Insufficient permissions')
        }
    }

    const validStatuses: string[] = Object.values(ChequeStatus)
    if (!validStatuses.includes(status)) {
        throw new BadRequestError(`Invalid cheque status: ${status}`)
    }
    if (status === cheque.status) {
        throw new BadRequestError(`Cheque is already ${status}`)
    }

    const allowed = ALLOWED_TARGETS[cheque.entityType] || []
    if (cheque.status !== 'pending' || !allowed.includes(status)) {
        throw new BadRequestError(`Invalid transition from '${cheque.status}' to '${status}'`)
    }

    const updated = await chequeRepo.update({
        where: { id },
        data: { status: status as ChequeStatus },
        include: CHEQUE_INCLUDE,
    })

    if (cheque.entityType === 'supplier_payment') {
        const invoicePayments = await db.supplierPayment.findMany({ where: { chequeId: id }, select: { purchaseInvoiceId: true } })
        for (const sp of invoicePayments) {
            await syncInvoiceStoredPaid(sp.purchaseInvoiceId)
        }
        const supplierConsolidatedPayments = await db.supplierConsolidatedPayment.findMany({ where: { chequeId: id }, select: { consolidatedInvoiceId: true } })
        for (const scp of supplierConsolidatedPayments) {
            await syncSupplierConsolidatedInvoiceStoredPaid(scp.consolidatedInvoiceId)
        }
    } else {
        const billPayments = await db.opticianShopPayment.findMany({ where: { chequeId: id }, select: { billId: true } })
        for (const bp of billPayments) {
            await syncBillPaidState(bp.billId)
        }
        const consolidatedPayments = await db.consolidatedPayment.findMany({ where: { chequeId: id }, select: { consolidatedInvoiceId: true } })
        for (const cp of consolidatedPayments) {
            await syncConsolidatedInvoiceStoredPaid(cp.consolidatedInvoiceId)
        }
    }

    await auditService.log({
        action: 'CHEQUE_STATUS_UPDATED',
        entityType: 'CHEQUE',
        entityId: id,
        metadata: { chequeNumber: cheque.number, from: cheque.status, to: status },
    })

    return updated
}
