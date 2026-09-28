import { NextRequest } from 'next/server'
import { ok, created } from '@/lib/api/response'
import { handleError } from '@/lib/middlewares/errorHandler'
import { BadRequestError } from '@/lib/errors'
import { parseBody, parseQuery } from '@/lib/api/parse'
import { parsePagination, paginated } from '@/lib/api/pagination'
import { requireRole } from '@/lib/api/auth'
import { groupPurchaseInvoices, listSupplierConsolidatedInvoices, getSupplierConsolidatedInvoice, recordSupplierConsolidatedPayment } from './supplier-consolidated-invoice.service'
import { toSupplierConsolidatedInvoiceResponse } from '@/modules/inventory/supplier-consolidated-invoices/mappers/supplier-consolidated-invoice.mapper'
import { groupSupplierInvoicesSchema, recordSupplierConsolidatedPaymentSchema } from '@/modules/inventory/supplier-consolidated-invoices/supplier-consolidated-invoice.schema'

const SUPPLIER_CONSOLIDATED_INVOICE_ROLES = ['admin', 'shop', 'atelier']

export async function GET(request: NextRequest) {
    try {
        requireRole(SUPPLIER_CONSOLIDATED_INVOICE_ROLES)(request)
        const { page, limit } = parsePagination(request)
        const { fournisseurId, entity, status, search } = parseQuery(request, 'fournisseurId', 'entity', 'status', 'search')
        const invoices = await listSupplierConsolidatedInvoices({ fournisseurId, entity, status, search })
        return ok(paginated(invoices.map(toSupplierConsolidatedInvoiceResponse), page, limit))
    } catch (error) {
        return handleError(error)
    }
}

export async function POST(request: NextRequest) {
    try {
        requireRole(SUPPLIER_CONSOLIDATED_INVOICE_ROLES)(request)
        const body = await parseBody(request, groupSupplierInvoicesSchema)
        const invoice = await groupPurchaseInvoices(body)
        return created(toSupplierConsolidatedInvoiceResponse(invoice!))
    } catch (error) {
        return handleError(error)
    }
}

export async function GET_ID(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        requireRole(SUPPLIER_CONSOLIDATED_INVOICE_ROLES)(request)
        const { id } = await params
        const invoice = await getSupplierConsolidatedInvoice(id)
        return ok(toSupplierConsolidatedInvoiceResponse(invoice))
    } catch (error) {
        return handleError(error)
    }
}

export async function PATCH_ID(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        requireRole(SUPPLIER_CONSOLIDATED_INVOICE_ROLES)(request)
        const { id } = await params
        const url = new URL(request.url)
        const action = url.searchParams.get('action')
        if (action !== 'record-payment') {
            throw new BadRequestError('Unknown action. Use ?action=record-payment')
        }
        const body = await parseBody(request, recordSupplierConsolidatedPaymentSchema)
        const invoice = await recordSupplierConsolidatedPayment(id, body)
        return ok(toSupplierConsolidatedInvoiceResponse(invoice))
    } catch (error) {
        return handleError(error)
    }
}
