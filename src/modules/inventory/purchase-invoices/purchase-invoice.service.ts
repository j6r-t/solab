import { purchaseInvoiceRepo } from '@/lib/database/repositories'
import { db } from '@/lib/database/db'
import { QR_CODE_PREFIX } from '@/lib/constants'
import { BadRequestError, NotFoundError } from '@/lib/errors'
import { ChequeType, InvoiceEntity, LensCoating, LensMaterial, LensType, PaymentMethod, Prisma, ProductCategory } from '@prisma/client'
import { assertWithinTotal, effectivePaymentTotal, isCashMethod, pendingInstrumentTotal } from '@/lib/utils/payments'
import { auditService } from '@/modules/system/audit'

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

// Single writer for a purchase invoice's stored paid state: derives it from
// the effective (cleared-instrument) payments, clamped to the total. Also
// used by cheque status transitions (sales/cheques).
export async function syncInvoiceStoredPaid(invoiceId: string) {
    const invoice = await db.purchaseInvoice.findUnique({
        where: { id: invoiceId },
        include: { payments: { include: { cheque: { select: { status: true } } } } },
    })
    if (!invoice) return
    const effective = effectivePaymentTotal(
        invoice.payments.map((p) => ({ amount: p.amount.toString(), method: p.method, cheque: p.cheque })),
        'supplier'
    )
    await db.purchaseInvoice.update({ where: { id: invoiceId }, data: { paidAmount: Math.min(effective, Number(invoice.totalAmount)) } })
}

async function createSupplierInstrument(invoiceId: string, p: SupplierPaymentInput, tx: Prisma.TransactionClient = db) {
    let chequeId: string | null = null
    if (p.method === 'cheque' || p.method === 'traite') {
        const cheque = await tx.cheque.create({
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

    await tx.supplierPayment.create({
        data: {
            purchaseInvoiceId: invoiceId,
            amount: p.amount,
            method: toStoredMethod(p.method),
            chequeId,
            paidAt: new Date(),
        },
    })
}

export async function listPurchaseInvoices(params?: { entity?: string; fournisseurId?: string; paymentStatus?: string; search?: string }) {
    const where: Prisma.PurchaseInvoiceWhereInput = {}
    if (params?.entity) where.entity = params.entity as InvoiceEntity
    if (params?.fournisseurId) where.fournisseurId = params.fournisseurId
    // Grouped invoices live in their consolidated invoice — exclude them from
    // the payable list (Phase 4, mirrors the Phase 3 bill list).
    where.groupedIntoId = null

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
    items: {
        description?: string
        category?: string
        quantity: number
        unitPrice: number
        productId?: string
        lensBlankId?: string
        newProduct?: { name: string; brand: string; model?: string; category: string; price: number; priceAfterTax?: number | null; thickness?: string; sph?: number; cyl?: number; add?: number }
        newLensBlank?: { brand: string; lensType: string; material: string; coating: string; thickness: string; sph?: number; cyl?: number; sellingPrice: number }
    }[]
    payments?: SupplierPaymentInput[]
    notes?: string
}) {
    if (!data.items?.length) throw new BadRequestError('At least one item is required')
    const totalAmount = data.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
    const paidAmount = (data.payments || []).filter((p) => isCashMethod(p.method)).reduce((s, p) => s + p.amount, 0)

    // Stock enters here: linked products/blanks get their quantity incremented
    // and `newProduct`/`newLensBlank` rows are created — all in one transaction.
    const createdProducts: { id: string; name: string; brand: string; price: number; code: string }[] = []
    const createdBlanks: { id: string; brand: string; lensType: string; quantity: number }[] = []
    const restocked: { kind: 'product' | 'lensBlank'; id: string; quantity: number }[] = []

    const invoice = await db.$transaction(async (tx) => {
        const itemsCreate: {
            description: string | null
            category: string | null
            quantity: number
            unitPrice: number
            productId?: string
            lensBlankId?: string
        }[] = []

        for (const item of data.items) {
            let productId: string | undefined = item.productId || undefined
            let lensBlankId: string | undefined = item.lensBlankId || undefined

            if (item.newProduct) {
                const np = item.newProduct
                if (data.entity !== 'shop') throw new BadRequestError('Inline product creation is only available for shop invoices')
                const code = `${QR_CODE_PREFIX}-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
                const product = await tx.product.create({
                    data: {
                        name: np.name,
                        price: np.price,
                        priceAfterTax: np.priceAfterTax ?? null,
                        costPrice: item.unitPrice,
                        quantity: item.quantity,
                        category: np.category as ProductCategory,
                        brand: np.brand || '—',
                        model: np.model || '—',
                        thickness: np.thickness || null,
                        sph: np.sph ?? null,
                        cyl: np.cyl ?? null,
                        add: np.add ?? null,
                        fournisseurId: data.fournisseurId,
                        qrcode: { create: { code } },
                    },
                })
                productId = product.id
                createdProducts.push({ id: product.id, name: product.name, brand: product.brand, price: Number(product.price), code })
            } else if (item.newLensBlank) {
                const nb = item.newLensBlank
                if (data.entity !== 'atelier') throw new BadRequestError('Inline lens blank creation is only available for atelier invoices')
                const blank = await tx.lensBlank.create({
                    data: {
                        brand: nb.brand,
                        lensType: nb.lensType as LensType,
                        material: nb.material as LensMaterial,
                        coating: nb.coating as LensCoating,
                        thickness: nb.thickness,
                        sph: nb.sph ?? 0,
                        cyl: nb.cyl ?? 0,
                        costPrice: item.unitPrice,
                        sellingPrice: nb.sellingPrice,
                        quantity: item.quantity,
                        fournisseurId: data.fournisseurId,
                    },
                })
                lensBlankId = blank.id
                createdBlanks.push({ id: blank.id, brand: blank.brand, lensType: String(blank.lensType), quantity: item.quantity })
            } else if (productId) {
                const product = await tx.product.findUnique({ where: { id: productId }, select: { id: true } })
                if (!product) throw new NotFoundError(`Product ${productId} not found`)
                await tx.product.update({ where: { id: productId }, data: { quantity: { increment: item.quantity }, costPrice: item.unitPrice } })
                restocked.push({ kind: 'product', id: productId, quantity: item.quantity })
            } else if (lensBlankId) {
                const blank = await tx.lensBlank.findUnique({ where: { id: lensBlankId }, select: { id: true } })
                if (!blank) throw new NotFoundError(`Lens blank ${lensBlankId} not found`)
                await tx.lensBlank.update({ where: { id: lensBlankId }, data: { quantity: { increment: item.quantity } } })
                restocked.push({ kind: 'lensBlank', id: lensBlankId, quantity: item.quantity })
            }

            itemsCreate.push({
                description: item.description || null,
                category: item.category || null,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                ...(productId ? { productId } : {}),
                ...(lensBlankId ? { lensBlankId } : {}),
            })
        }

        return tx.purchaseInvoice.create({
            data: {
                invoiceNumber: data.invoiceNumber,
                fournisseurId: data.fournisseurId,
                entity: data.entity,
                date: data.date ? new Date(data.date) : new Date(),
                totalAmount,
                paidAmount,
                notes: data.notes || null,
                items: { create: itemsCreate },
            },
            include: INVOICE_INCLUDE,
        })
    })

    await auditService.log({
        action: 'SUPPLIER_INVOICE_CREATED',
        entityType: 'PURCHASE_INVOICE',
        entityId: invoice.id,
        metadata: {
            invoiceNumber: invoice.invoiceNumber,
            totalAmount,
            entity: data.entity,
            createdProducts: createdProducts.map((p) => p.name),
            restocked,
        },
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
        return { invoice: updated, createdProducts, createdBlanks }
    }

    return { invoice, createdProducts, createdBlanks }
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
    const invoice = await purchaseInvoiceRepo.findUnique({
        where: { id },
        include: {
            payments: { include: { cheque: { select: { status: true } } } },
            groupedInto: { select: { invoiceNumber: true } },
        },
    })
    if (!invoice) throw new NotFoundError('Purchase invoice not found')

    // Phase 4: grouped invoices are frozen — payments go on the consolidated invoice
    if (invoice.groupedIntoId) {
        throw new BadRequestError(`Invoice is already grouped into consolidated invoice ${invoice.groupedInto?.invoiceNumber ?? invoice.groupedIntoId}`)
    }
    if (data.amount <= 0) throw new BadRequestError('Payment amount must be positive')

    const paymentInputs = invoice.payments.map((p) => ({ amount: p.amount.toString(), method: p.method, cheque: p.cheque }))
    // Overpay guard on effective paid + pending instruments + the new amount
    assertWithinTotal({
        totalAmount: invoice.totalAmount,
        effectivePaid: effectivePaymentTotal(paymentInputs, 'supplier'),
        pendingTotal: pendingInstrumentTotal(paymentInputs, 'supplier'),
        newAmount: data.amount,
    })

    await db.$transaction(async (tx) => {
        await createSupplierInstrument(id, data, tx)
    })
    await syncInvoiceStoredPaid(id)

    const updated = await purchaseInvoiceRepo.findUnique({
        where: { id },
        include: INVOICE_INCLUDE,
    })
    if (!updated) throw new NotFoundError('Purchase invoice not found')

    await auditService.log({
        action: 'SUPPLIER_INVOICE_PAYMENT_RECORDED',
        entityType: 'PURCHASE_INVOICE',
        entityId: id,
        metadata: { amount: data.amount, method: data.method },
    })

    return updated
}

export async function deletePurchaseInvoice(id: string) {
    // Reverse the stock movement this invoice caused (mirrors createPurchaseInvoice).
    await db.$transaction(async (tx) => {
        const items = await tx.purchaseInvoiceItem.findMany({
            where: { invoiceId: id },
            select: { productId: true, lensBlankId: true, quantity: true },
        })
        for (const item of items) {
            if (item.productId) {
                await tx.product.update({ where: { id: item.productId }, data: { quantity: { decrement: item.quantity } } })
            }
            if (item.lensBlankId) {
                await tx.lensBlank.update({ where: { id: item.lensBlankId }, data: { quantity: { decrement: item.quantity } } })
            }
        }
        await tx.purchaseInvoice.delete({ where: { id } })
    })
}
