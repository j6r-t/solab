import { NextRequest } from 'next/server'
import { ok, created, noContent } from '@/lib/api/response'
import { handleError } from '@/middlewares/errorHandler'
import { parseBody, parseQuery } from '@/lib/api/parse'
import { listPurchaseInvoices, getPurchaseInvoice, createPurchaseInvoice, addPaymentToInvoice, deletePurchaseInvoice, getNextInvoiceNumber } from './purchase-invoice.service'
import { toPurchaseInvoiceResponse } from '@/mappers/purchase-invoice.mapper'
import type { CreatePurchaseInvoiceInput, AddSupplierPaymentInput } from '@/dtos/purchase-invoices/purchase-invoice.dto'

export async function GET(request: NextRequest) {
    try {
        const { entity, fournisseurId, paymentStatus, generate } = parseQuery(request, 'entity', 'fournisseurId', 'paymentStatus', 'generate')
        if (generate === 'next-number' && fournisseurId) {
            const nextNumber = await getNextInvoiceNumber(fournisseurId, entity)
            return ok(nextNumber)
        }
        const invoices = await listPurchaseInvoices({ entity, fournisseurId, paymentStatus })
        return ok(invoices.map(toPurchaseInvoiceResponse))
    } catch (error) {
        return handleError(error)
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await parseBody<CreatePurchaseInvoiceInput>(request)
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
            const body = await parseBody<AddSupplierPaymentInput>(request)
            const invoice = await addPaymentToInvoice(id, body)
            return ok(toPurchaseInvoiceResponse(invoice))
        }
        return ok({})
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
