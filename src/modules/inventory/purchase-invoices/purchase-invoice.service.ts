import { purchaseInvoiceRepo } from '@/lib/database/repositories'
import { db } from '@/lib/database/db'
import { BadRequestError, NotFoundError } from '@/lib/errors'
import { ChequeType, InvoiceEntity, PaymentMethod, Prisma } from '@prisma/client'
import { effectivePaymentTotal, isCashMethod } from '@/lib/utils/payments'

type SupplierPaymentInput = {
    amount: number
    method: string
    chequeNumber?: string
    chequeBank?: string
    chequeDueDate?: string
    chequeType?: string
}

const INVOICE_INCLUDE = {
    fournisseur: { select: { id: true, name: true, phone: true } },
    items: { include: { product: { select: { id: true, name: true, brand: true } }, lensBlank: { select: { id: true, brand: true, thickness: true } } } },
    payments: { orderBy: { paidAt: 'desc' as const }, include: { cheque: { select: { status: true } } } },
} as const

function toStoredMethod(method: string): PaymentMethod {
    return method === 'traite' ? 'cheque' : (method as PaymentMethod)
}

function toChequeType(p: SupplierPaymentInput): ChequeType {
    return p.method === 'traite' ? 'traite' : ((p.chequeType || 'standard') as ChequeType)
}

async function syncInvoiceStoredPaid(invoiceId: string) {
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

async function createSupplierInstrument(invoiceId: string, p: SupplierPaymentInput) {
    let chequeId: string | null = null
    if (p.method === 'cheque' || p.method === 'traite') {
        const cheque = await db.cheque.create({
            data: {
                number: p.chequeNumber || '',
                type: toChequeType(p),
                bankName: p.chequeBank || null,
                amount: p.amount,
                dueDate: new Date(p.chequeDueDate || Date.now()),
                entityType: 'supplier_payment',
            },
        })
        chequeId = cheque.id
    }

    await db.supplierPayment.create({
        data: {
            purchaseInvoiceId: invoiceId,
            amount: p.amount,
            method: toStoredMethod(p.method),
            chequeId,
            paidAt: new Date(),
        },
    })
}

export async function listPurchaseInvoices(params?: { entity?: string; fournisseurId?: string; paymentStatus?: string }) {
    const where: Prisma.PurchaseInvoiceWhereInput = {}
    if (params?.entity) where.entity = params.entity as InvoiceEntity
    if (params?.fournisseurId) where.fournisseurId = params.fournisseurId

    const invoices = await purchaseInvoiceRepo.findMany({
        where,
        include: INVOICE_INCLUDE,
        orderBy: { date: 'desc' },
    })

    if (params?.paymentStatus) {
        return invoices.filter((inv) => {
            const paid = effectivePaymentTotal(
                inv.payments.map((p) => ({ amount: p.amount.toString(), method: p.method, cheque: p.cheque })),
                'supplier'
            )
            const total = Number(inv.totalAmount)
            if (params.paymentStatus === 'unpaid') return paid === 0
            if (params.paymentStatus === 'fullyPaid') return paid >= total
            if (params.paymentStatus === 'partiallyPaid') return paid > 0 && paid < total
            return true
        })
    }

    return invoices
}

export async function getPurchaseInvoice(id: string) {
    const invoice = await purchaseInvoiceRepo.findUnique({
        where: { id },
        include: INVOICE_INCLUDE,
    })
    if (!invoice) throw new NotFoundError('Purchase invoice not found')
    return invoice
}

export async function createPurchaseInvoice(data: {
    invoiceNumber: string
    fournisseurId: string
    entity: 'shop' | 'atelier'
    date?: string
    items: { description?: string; category?: string; quantity: number; unitPrice: number }[]
    payments?: SupplierPaymentInput[]
    notes?: string
}) {
    if (!data.items?.length) throw new BadRequestError('At least one item is required')
    const totalAmount = data.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
    const paidAmount = (data.payments || []).filter((p) => isCashMethod(p.method)).reduce((s, p) => s + p.amount, 0)

    const invoice = await purchaseInvoiceRepo.create({
        data: {
            invoiceNumber: data.invoiceNumber,
            fournisseurId: data.fournisseurId,
            entity: data.entity,
            date: data.date ? new Date(data.date) : new Date(),
            totalAmount,
            paidAmount,
            notes: data.notes || null,
            items: {
                create: data.items.map((item) => ({
                    description: item.description || null,
                    category: item.category || null,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                })),
            },
        },
        include: INVOICE_INCLUDE,
    })

    if (data.payments?.length) {
        for (const p of data.payments) {
            await createSupplierInstrument(invoice.id, p)
        }

        // re-fetch with payments
        const updated = await purchaseInvoiceRepo.findUnique({
            where: { id: invoice.id },
            include: INVOICE_INCLUDE,
        })
        if (!updated) throw new NotFoundError('Purchase invoice not found')
        return updated
    }

    return invoice
}

function supplierAbbreviation(name: string): string {
    return name
        .split(' ')
        .map((w) => w.replace(/[^a-zA-Z0-9]/g, '').charAt(0).toUpperCase())
        .filter(Boolean)
        .join('')
        .slice(0, 4) || 'SUP'
}

export async function getNextInvoiceNumber(fournisseurId: string, entity?: string) {
    const fournisseur = await db.fournisseur.findUnique({ where: { id: fournisseurId } })
    if (!fournisseur) throw new BadRequestError('Supplier not found')
    const abbr = supplierAbbreviation(fournisseur.name)

    const existing = await db.purchaseInvoice.findMany({
        where: { fournisseurId, entity: (entity || 'shop') as InvoiceEntity },
        select: { invoiceNumber: true },
    })

    let maxSeq = 0
    const prefix = `FAC-${abbr}-`
    for (const inv of existing) {
        if (inv.invoiceNumber.startsWith(prefix)) {
            const num = parseInt(inv.invoiceNumber.slice(prefix.length), 10)
            if (!isNaN(num) && num > maxSeq) maxSeq = num
        }
    }
    return { invoiceNumber: `${prefix}${String(maxSeq + 1).padStart(3, '0')}` }
}

export async function addPaymentToInvoice(id: string, data: SupplierPaymentInput) {
    const invoice = await purchaseInvoiceRepo.findUnique({ where: { id } })
    if (!invoice) throw new NotFoundError('Purchase invoice not found')

    await createSupplierInstrument(id, data)
    await syncInvoiceStoredPaid(id)

    const updated = await purchaseInvoiceRepo.findUnique({
        where: { id },
        include: INVOICE_INCLUDE,
    })
    if (!updated) throw new NotFoundError('Purchase invoice not found')
    return updated
}

export async function deletePurchaseInvoice(id: string) {
    await purchaseInvoiceRepo.delete({ where: { id } })
}
