import { NextRequest } from 'next/server'
import { ok, created } from '@/lib/api/response'
import { handleError } from '@/lib/middlewares/errorHandler'
import { BadRequestError } from '@/lib/errors'
import { parseBody, parseQuery } from '@/lib/api/parse'
import { parsePagination, paginated } from '@/lib/api/pagination'
import { requireRole } from '@/lib/api/auth'
import { groupOpticianShopBills, listConsolidatedInvoices, getConsolidatedInvoice, recordConsolidatedPayment } from './consolidated-invoice.service'
import { toConsolidatedInvoiceResponse } from '@/modules/partners/consolidated-invoices/mappers/consolidated-invoice.mapper'
import { groupBillsSchema, recordConsolidatedPaymentSchema } from '@/modules/partners/optician-shop-bills/optician-shop-bill.schema'

const CONSOLIDATED_INVOICE_ROLES = ['admin', 'atelier']

export async function GET(request: NextRequest) {
    try {
        requireRole(CONSOLIDATED_INVOICE_ROLES)(request)
        const { page, limit } = parsePagination(request)
        const { opticianShopId, status, search } = parseQuery(request, 'opticianShopId', 'status', 'search')
        const invoices = await listConsolidatedInvoices({ opticianShopId, status, search })
        return ok(paginated(invoices.map(toConsolidatedInvoiceResponse), page, limit))
    } catch (error) {
        return handleError(error)
    }
}

export async function POST(request: NextRequest) {
    try {
        requireRole(CONSOLIDATED_INVOICE_ROLES)(request)
        const body = await parseBody(request, groupBillsSchema)
        const invoice = await groupOpticianShopBills(body)
        return created(toConsolidatedInvoiceResponse(invoice!))
    } catch (error) {
        return handleError(error)
    }
}

export async function GET_ID(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        requireRole(CONSOLIDATED_INVOICE_ROLES)(request)
        const { id } = await params
        const invoice = await getConsolidatedInvoice(id)
        return ok(toConsolidatedInvoiceResponse(invoice))
    } catch (error) {
        return handleError(error)
    }
}

export async function PATCH_ID(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        requireRole(CONSOLIDATED_INVOICE_ROLES)(request)
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
