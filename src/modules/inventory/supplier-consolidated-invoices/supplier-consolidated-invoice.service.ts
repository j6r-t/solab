import { db } from '@/lib/database/db'
import { BillStatus, ChequeType, PaymentMethod, Prisma } from '@prisma/client'
import { NotFoundError, BadRequestError } from '@/lib/errors'
import { assertWithinTotal, effectivePaymentTotal, pendingInstrumentTotal } from '@/lib/utils/payments'
import { auditService } from '@/modules/system/audit'

const SUPPLIER_CONSOLIDATED_INCLUDE = {
    fournisseur: { select: { id: true, name: true } },
    items: { orderBy: { sourceInvoiceNumber: 'asc' as const } },
    payments: {
        orderBy: { paidAt: 'desc' as const },
        include: { cheque: { select: { status: true, type: true, number: true, bankName: true, dueDate: true } } },
    },
} as const

function round3(n: number): number {
    return Math.round(n * 1000) / 1000
}

function supplierAbbreviation(name: string): string {
    return (
        name
            .split(' ')
            .map((w) => w.replace(/[^a-zA-Z0-9]/g, '').charAt(0).toUpperCase())
            .filter(Boolean)
            .join('')
            .slice(0, 4) || 'SUP'
    )
}

function invoiceEffectiveRemaining(invoice: {
    totalAmount: Prisma.Decimal | string | number
    payments: { amount: Prisma.Decimal | string | number; method: string; cheque: { status: string } | null }[]
}): number {
    const effective = effectivePaymentTotal(
        invoice.payments.map((p) => ({ amount: p.amount.toString(), method: p.method, cheque: p.cheque })),
        'supplier'
    )
    return round3(Math.max(0, Number(invoice.totalAmount) - effective))
}

export async function groupPurchaseInvoices(data: { fournisseurId: string; invoiceIds: string[] }) {
    const uniqueIds = [...new Set(data.invoiceIds)]
    if (uniqueIds.length < 2) throw new BadRequestError('At least 2 invoices are required')

    const created = await db.$transaction(async (tx) => {
        const invoices = await tx.purchaseInvoice.findMany({
            where: { id: { in: uniqueIds } },
            include: {
                payments: { include: { cheque: { select: { status: true } } } },
                fournisseur: { select: { id: true, name: true } },
            },
        })
        if (invoices.length !== uniqueIds.length) throw new NotFoundError('One or more invoices not found')

        for (const invoice of invoices) {
            if (invoice.fournisseurId !== data.fournisseurId) {
                throw new BadRequestError('All invoices must belong to the same fournisseur')
            }
            if (invoice.groupedIntoId) {
                throw new BadRequestError(`Invoice ${invoice.invoiceNumber} is already grouped into a consolidated invoice`)
            }
            if (invoiceEffectiveRemaining(invoice) <= 0) {
                throw new BadRequestError(`Invoice ${invoice.invoiceNumber} is already fully paid`)
            }
        }

        const entities = new Set(invoices.map((invoice) => invoice.entity))
        if (entities.size > 1) throw new BadRequestError('All invoices must belong to the same entity')

        const amounts = invoices.map((invoice) => ({
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            amount: invoiceEffectiveRemaining(invoice),
        }))
        const totalAmount = round3(amounts.reduce((sum, a) => sum + a.amount, 0))
        if (totalAmount <= 0) throw new BadRequestError('Total remaining must be positive')

        const fournisseur = invoices[0].fournisseur
        const prefix = `FAC-G-${supplierAbbreviation(fournisseur.name)}-`
        // invoiceNumber is globally unique — scan ALL invoices so two
        // fournisseurs sharing an abbreviation can never generate the same number
        const existing = await tx.supplierConsolidatedInvoice.findMany({
            select: { invoiceNumber: true },
        })
        let maxSeq = 0
        for (const inv of existing) {
            if (inv.invoiceNumber.startsWith(prefix)) {
                const num = parseInt(inv.invoiceNumber.slice(prefix.length), 10)
                if (!isNaN(num) && num > maxSeq) maxSeq = num
            }
        }
        const invoiceNumber = `${prefix}${String(maxSeq + 1).padStart(3, '0')}`

        const invoice = await tx.supplierConsolidatedInvoice.create({
            data: {
                invoiceNumber,
                fournisseurId: data.fournisseurId,
                entity: invoices[0].entity,
                totalAmount,
                paidAmount: 0,
                status: 'unpaid',
                items: {
                    create: amounts.map((a) => ({
                        sourcePurchaseInvoiceId: a.invoiceId,
                        sourceInvoiceNumber: a.invoiceNumber,
                        amount: a.amount,
                    })),
                },
            },
        })

        await tx.purchaseInvoice.updateMany({
            where: { id: { in: uniqueIds } },
            data: { groupedIntoId: invoice.id },
        })

        return { invoice, amounts, totalAmount }
    }, { timeout: 15000 })

    await auditService.log({
        action: 'SUPPLIER_INVOICE_GROUPED',
        entityType: 'SUPPLIER_CONSOLIDATED_INVOICE',
        entityId: created.invoice.id,
        metadata: {
            invoiceNumber: created.invoice.invoiceNumber,
            fournisseurId: data.fournisseurId,
            invoiceIds: uniqueIds,
            amounts: created.amounts.map((a) => ({ sourceInvoiceId: a.invoiceId, sourceInvoiceNumber: a.invoiceNumber, amount: a.amount })),
            totalAmount: created.totalAmount,
        },
    })

    return db.supplierConsolidatedInvoice.findUnique({ where: { id: created.invoice.id }, include: SUPPLIER_CONSOLIDATED_INCLUDE })
}

export async function listSupplierConsolidatedInvoices(params?: { fournisseurId?: string; entity?: string; status?: string; search?: string }) {
    const where: Prisma.SupplierConsolidatedInvoiceWhereInput = {}
    if (params?.fournisseurId) where.fournisseurId = params.fournisseurId
    if (params?.entity) where.entity = params.entity as 'shop' | 'atelier'
    if (params?.status) where.status = params.status as BillStatus
    if (params?.search) {
        where.fournisseur = { name: { contains: params.search } }
    }

    return db.supplierConsolidatedInvoice.findMany({
        where,
        include: SUPPLIER_CONSOLIDATED_INCLUDE,
        orderBy: { createdAt: 'desc' },
    })
}

export async function getSupplierConsolidatedInvoice(id: string) {
    const invoice = await db.supplierConsolidatedInvoice.findUnique({
        where: { id },
        include: SUPPLIER_CONSOLIDATED_INCLUDE,
    })
    if (!invoice) throw new NotFoundError('Consolidated invoice not found')
    return invoice
}

export async function recordSupplierConsolidatedPayment(id: string, data: {
    amount: number
    method: string
    chequeId?: string
    chequeNumber?: string
    chequeBankName?: string
    chequeDueDate?: string
    chequeType?: string
    notes?: string
}) {
    const invoice = await db.supplierConsolidatedInvoice.findUnique({ where: { id }, include: SUPPLIER_CONSOLIDATED_INCLUDE })
    if (!invoice) throw new NotFoundError('Consolidated invoice not found')
    if (data.amount <= 0) throw new BadRequestError('Payment amount must be positive')

    const isInstrument = data.method === 'cheque' || data.method === 'traite'

    const paymentInputs = invoice.payments.map((p) => ({ amount: p.amount.toString(), method: p.method, cheque: p.cheque }))
    // Overpay guard on effective paid + pending instruments + the new amount
    assertWithinTotal({
        totalAmount: invoice.totalAmount,
        effectivePaid: effectivePaymentTotal(paymentInputs, 'supplier'),
        pendingTotal: pendingInstrumentTotal(paymentInputs, 'supplier'),
        newAmount: data.amount,
    })

    const storedMethod: PaymentMethod = isInstrument ? 'cheque' : (data.method as PaymentMethod)

    await db.$transaction(async (tx) => {
        // Inline instrument creation for cheque/traite (mirrors the supplier invoice side)
        let instrumentId: string | null = null
        if (isInstrument) {
            const cheque = await tx.cheque.create({
                data: {
                    number: data.chequeNumber || '',
                    type: (data.method === 'traite' ? 'traite' : data.chequeType || 'standard') as ChequeType,
                    bankName: data.chequeBankName || null,
                    amount: data.amount,
                    dueDate: new Date(data.chequeDueDate || Date.now()),
                    entityType: 'supplier_payment',
                },
            })
            instrumentId = cheque.id
        }

        await tx.supplierConsolidatedPayment.create({
            data: {
                consolidatedInvoiceId: id,
                amount: data.amount,
                method: storedMethod,
                chequeId: instrumentId,
                notes: data.notes || null,
            },
        })
    })

    const updated = await db.supplierConsolidatedInvoice.findUnique({ where: { id }, include: SUPPLIER_CONSOLIDATED_INCLUDE })
    if (!updated) throw new NotFoundError('Consolidated invoice not found')
    const effective = effectivePaymentTotal(
        updated.payments.map((p) => ({ amount: p.amount.toString(), method: p.method, cheque: p.cheque })),
        'supplier'
    )
    const paidAmount = Math.min(effective, Number(updated.totalAmount))
    const status: BillStatus = paidAmount >= Number(updated.totalAmount) ? 'paid' : paidAmount > 0 ? 'partiallyPaid' : 'unpaid'

    const result = await db.supplierConsolidatedInvoice.update({
        where: { id },
        data: { paidAmount, status },
        include: SUPPLIER_CONSOLIDATED_INCLUDE,
    })

    await auditService.log({
        action: 'SUPPLIER_CONSOLIDATED_PAYMENT_RECORDED',
        entityType: 'SUPPLIER_CONSOLIDATED_INVOICE',
        entityId: id,
        metadata: {
            amount: data.amount,
            method: data.method,
            storedMethod,
            instrument: isInstrument,
            effectivePaid: paidAmount,
            status,
        },
    })

    return result
}
