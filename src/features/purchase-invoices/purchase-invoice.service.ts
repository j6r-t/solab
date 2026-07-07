import { purchaseInvoiceRepo } from '@/lib/database/repositories'
import { db } from '@/lib/database/db'
import { BadRequestError, NotFoundError } from '@/errors'

export async function listPurchaseInvoices(params?: { entity?: string; fournisseurId?: string; paymentStatus?: string }) {
    const where: any = {}
    if (params?.entity) where.entity = params.entity
    if (params?.fournisseurId) where.fournisseurId = params.fournisseurId

    const invoices = await purchaseInvoiceRepo.findMany({
        where,
        include: {
            fournisseur: { select: { id: true, name: true, phone: true } },
            items: { include: { product: { select: { id: true, name: true, brand: true } }, lensBlank: { select: { id: true, brand: true, thickness: true } } } },
            payments: { orderBy: { paidAt: 'desc' }, include: { cheque: true, traite: true } },
        },
        orderBy: { date: 'desc' },
    })

    if (params?.paymentStatus) {
        return invoices.filter((inv) => {
            const paid = Number(inv.paidAmount)
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
        include: {
            fournisseur: { select: { id: true, name: true, phone: true } },
            items: { include: { product: { select: { id: true, name: true, brand: true } }, lensBlank: { select: { id: true, brand: true, thickness: true } } } },
            payments: { orderBy: { paidAt: 'desc' } },
        },
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
    payments?: { amount: number; method: 'cash' | 'cheque' | 'traite' | 'transfer'; chequeNumber?: string; chequeBank?: string; chequeDueDate?: string }[]
    notes?: string
}) {
    if (!data.items?.length) throw new BadRequestError('At least one item is required')
    const totalAmount = data.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
    let paidAmount = data.payments?.reduce((s, p) => s + p.amount, 0) || 0

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
        include: {
            fournisseur: { select: { id: true, name: true, phone: true } },
            items: { include: { product: { select: { id: true, name: true, brand: true } }, lensBlank: { select: { id: true, brand: true, thickness: true } } } },
            payments: { orderBy: { paidAt: 'desc' } },
        },
    })

    if (data.payments?.length) {
        for (const p of data.payments) {
            let chequeId: string | undefined
            let traiteId: string | undefined

            if (p.method === 'cheque') {
                const cheque = await db.cheque.create({
                    data: {
                        number: p.chequeNumber || '',
                        bankName: p.chequeBank || '',
                        amount: p.amount,
                        dueDate: new Date(p.chequeDueDate || Date.now()),
                        entityType: 'supplier_payment',
                    },
                })
                chequeId = cheque.id
            } else if (p.method === 'traite') {
                const traite = await db.traite.create({
                    data: {
                        number: p.chequeNumber || '',
                        amount: p.amount,
                        dueDate: new Date(p.chequeDueDate || Date.now()),
                        purchaseInvoiceId: invoice.id,
                        notes: null,
                    },
                })
                traiteId = traite.id
            }

            await db.supplierPayment.create({
                data: {
                    purchaseInvoiceId: invoice.id,
                    amount: p.amount,
                    method: p.method as any,
                    chequeId: chequeId || null,
                    traiteId: traiteId || null,
                    paidAt: new Date(),
                },
            })
        }

        // re-fetch with payments
        const updated = await purchaseInvoiceRepo.findUnique({
            where: { id: invoice.id },
            include: {
                fournisseur: { select: { id: true, name: true, phone: true } },
                items: { include: { product: { select: { id: true, name: true, brand: true } }, lensBlank: { select: { id: true, brand: true, thickness: true } } } },
                payments: { orderBy: { paidAt: 'desc' } },
            },
        })
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
        where: { fournisseurId, entity: entity || 'shop' },
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

export async function addPaymentToInvoice(id: string, data: { amount: number; method: string; chequeNumber?: string; chequeBank?: string; chequeDueDate?: string }) {
    const invoice = await purchaseInvoiceRepo.findUnique({ where: { id } })
    if (!invoice) throw new NotFoundError('Purchase invoice not found')

    let chequeId: string | undefined
    let traiteId: string | undefined
    if (data.method === 'cheque') {
        const cheque = await db.cheque.create({
            data: {
                number: data.chequeNumber || '',
                bankName: data.chequeBank || '',
                amount: data.amount,
                dueDate: new Date(data.chequeDueDate || Date.now()),
                entityType: 'supplier_payment',
            },
        })
        chequeId = cheque.id
    } else if (data.method === 'traite') {
        const traite = await db.traite.create({
            data: {
                number: data.chequeNumber || '',
                amount: data.amount,
                dueDate: new Date(data.chequeDueDate || Date.now()),
                purchaseInvoiceId: id,
                notes: null,
            },
        })
        traiteId = traite.id
    }

    await db.supplierPayment.create({
        data: {
            purchaseInvoiceId: id,
            amount: data.amount,
            method: data.method as any,
            chequeId: chequeId || null,
            traiteId: traiteId || null,
            paidAt: new Date(),
        },
    })

    const newPaid = Number(invoice.paidAmount) + data.amount
    return purchaseInvoiceRepo.update({
        where: { id },
        data: { paidAmount: newPaid },
        include: {
            fournisseur: { select: { id: true, name: true, phone: true } },
            items: { include: { product: { select: { id: true, name: true, brand: true } }, lensBlank: { select: { id: true, brand: true, thickness: true } } } },
            payments: { orderBy: { paidAt: 'desc' } },
        },
    })
}

export async function deletePurchaseInvoice(id: string) {
    await purchaseInvoiceRepo.delete({ where: { id } })
}
