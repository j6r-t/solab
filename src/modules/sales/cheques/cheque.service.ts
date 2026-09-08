import { chequeRepo } from '@/lib/database/repositories'
import { db } from '@/lib/database/db'
import { BadRequestError, NotFoundError } from '@/lib/errors'
import { ChequeStatus, ChequeEntityType, Prisma } from '@prisma/client'
import { auditService } from '@/modules/system/audit'
import { effectivePaymentTotal } from '@/lib/utils/payments'

const CHEQUE_INCLUDE = {
    payments: {
        orderBy: { createdAt: 'asc' },
        include: { order: { include: { client: { select: { id: true, name: true, familyName: true } } } } },
    },
    supplierPayments: {
        orderBy: { paidAt: 'asc' },
        include: { purchaseInvoice: { include: { fournisseur: { select: { id: true, name: true } } } } },
    },
} satisfies Prisma.ChequeInclude

const ALLOWED_TARGETS: Record<string, string[]> = {
    client_payment: ['cashed', 'bounced'],
    supplier_payment: ['paid', 'bounced'],
}

export async function listCheques(params?: { status?: string; statuses?: string; entityType?: string; dueBefore?: string }) {
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

    return chequeRepo.findMany({
        where,
        include: CHEQUE_INCLUDE,
        orderBy: { dueDate: 'asc' },
    })
}

async function syncPurchaseInvoiceStoredPaid(invoiceId: string) {
    const invoice = await db.purchaseInvoice.findUnique({
        where: { id: invoiceId },
        include: { payments: { include: { cheque: { select: { status: true } } } } },
    })
    if (!invoice) return
    const effective = effectivePaymentTotal(
        invoice.payments.map((p) => ({ amount: p.amount.toString(), method: p.method, cheque: p.cheque })),
        'supplier'
    )
    await db.purchaseInvoice.update({ where: { id: invoiceId }, data: { paidAmount: effective } })
}

async function syncOpticianBillStoredPaid(billId: string) {
    const bill = await db.opticianShopBill.findUnique({
        where: { id: billId },
        include: { payments: { include: { cheque: { select: { status: true } } } } },
    })
    if (!bill) return
    const effective = effectivePaymentTotal(
        bill.payments.map((p) => ({ amount: p.amount.toString(), method: p.method, cheque: p.cheque })),
        'client'
    )
    const status = effective >= Number(bill.totalAmount) ? 'paid' : effective > 0 ? 'partiallyPaid' : 'unpaid'
    await db.opticianShopBill.update({ where: { id: billId }, data: { paidAmount: effective, status } })
}

export async function updateChequeStatus(id: string, status: string) {
    const cheque = await chequeRepo.findUnique({ where: { id } })
    if (!cheque) throw new NotFoundError('Cheque not found')

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
            await syncPurchaseInvoiceStoredPaid(sp.purchaseInvoiceId)
        }
    } else {
        const billPayments = await db.opticianShopPayment.findMany({ where: { chequeId: id }, select: { billId: true } })
        for (const bp of billPayments) {
            await syncOpticianBillStoredPaid(bp.billId)
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
