import { NextRequest } from 'next/server'
import { ok } from '@/lib/api/response'
import { handleError } from '@/lib/middlewares/errorHandler'
import { BadRequestError } from '@/lib/errors'
import { parseBody } from '@/lib/api/parse'
import { requireRole } from '@/lib/api/auth'
import { getConsolidatedInvoice, recordConsolidatedPayment } from '@/modules/partners/consolidated-invoices/consolidated-invoice.service'
import { toConsolidatedInvoiceResponse } from '@/modules/partners/consolidated-invoices/mappers/consolidated-invoice.mapper'
import { recordConsolidatedPaymentSchema } from '@/modules/partners/optician-shop-bills/optician-shop-bill.schema'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        requireRole(['admin', 'atelier'])(request)
        const { id } = await params
        const invoice = await getConsolidatedInvoice(id)
        return ok(toConsolidatedInvoiceResponse(invoice))
    } catch (error) {
        return handleError(error)
    }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        requireRole(['admin', 'atelier'])(request)
        const { id } = await params
        const url = new URL(request.url)
        const action = url.searchParams.get('action')
        if (action !== 'record-payment') {
            throw new BadRequestError('Unknown action. Use ?action=record-payment')
        }
        const body = await parseBody(request, recordConsolidatedPaymentSchema)
        const invoice = await recordConsolidatedPayment(id, body)
        return ok(toConsolidatedInvoiceResponse(invoice))
    } catch (error) {
        return handleError(error)
    }
}
