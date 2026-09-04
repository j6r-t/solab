import { NextRequest } from 'next/server'
import { ok, created, noContent } from '@/lib/api/response'
import { handleError } from '@/lib/middlewares/errorHandler'
import { BadRequestError } from '@/lib/errors'
import { parseBody, parseQuery } from '@/lib/api/parse'
import { parsePagination, paginated } from '@/lib/api/pagination'
import { listPurchaseInvoices, createPurchaseInvoice, addPaymentToInvoice, deletePurchaseInvoice, getNextInvoiceNumber } from './purchase-invoice.service'
import { toPurchaseInvoiceResponse } from '@/modules/inventory/purchase-invoices/mappers/purchase-invoice.mapper'
import { purchaseInvoiceSchema, addSupplierPaymentSchema } from '@/modules/inventory/purchase-invoices/purchase-invoice.schema'

export async function GET(request: NextRequest) {
    try {
        const { entity, fournisseurId, paymentStatus, generate } = parseQuery(request, 'entity', 'fournisseurId', 'paymentStatus', 'generate')
        if (generate === 'next-number' && fournisseurId) {
            const nextNumber = await getNextInvoiceNumber(fournisseurId, entity)
            return ok(nextNumber)
        }
        const { page, limit } = parsePagination(request)
        const invoices = await listPurchaseInvoices({ entity, fournisseurId, paymentStatus })
        return ok(paginated(invoices.map(toPurchaseInvoiceResponse), page, limit))
    } catch (error) {
        return handleError(error)
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await parseBody(request, purchaseInvoiceSchema)
        const invoice = await createPurchaseInvoice(body)
        return created(toPurchaseInvoiceResponse(invoice))
    } catch (error) {
        return handleError(error)
    }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const url = new URL(request.url)
        if (url.searchParams.get('action') === 'add-payment') {
            const body = await parseBody(request, addSupplierPaymentSchema)
            const invoice = await addPaymentToInvoice(id, body)
            return ok(toPurchaseInvoiceResponse(invoice))
        }
        throw new BadRequestError('Unknown action. Use ?action=add-payment')
    } catch (error) {
        return handleError(error)
    }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        await deletePurchaseInvoice(id)
        return noContent()
    } catch (error) {
        return handleError(error)
    }
}
