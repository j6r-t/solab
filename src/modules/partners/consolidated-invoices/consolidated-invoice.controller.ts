import { NextRequest } from 'next/server'
import { ok } from '@/lib/api/response'
import { handleError } from '@/lib/middlewares/errorHandler'
import { parseBody, parseQuery } from '@/lib/api/parse'
import { parsePagination, paginated } from '@/lib/api/pagination'
import { requireRole } from '@/lib/api/auth'
import { groupOpticianShopBills, listConsolidatedInvoices } from './consolidated-invoice.service'
import { toConsolidatedInvoiceResponse } from '@/modules/partners/consolidated-invoices/mappers/consolidated-invoice.mapper'
import { groupBillsSchema } from '@/modules/partners/optician-shop-bills/optician-shop-bill.schema'

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
        return ok(toConsolidatedInvoiceResponse(invoice!))
    } catch (error) {
        return handleError(error)
    }
}
