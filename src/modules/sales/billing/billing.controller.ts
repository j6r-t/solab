import { NextRequest } from 'next/server'
import { ok } from '@/lib/api/response'
import { handleError } from '@/lib/middlewares/errorHandler'
import { parseQuery } from '@/lib/api/parse'
import { parsePagination, paginated } from '@/lib/api/pagination'
import { listBilling } from './billing.service'
import { toBillingResponse } from '@/modules/sales/billing/mappers/billing.mapper'

export async function GET(request: NextRequest) {
    try {
        const { page, limit } = parsePagination(request)
        const { status, search, start, end } = parseQuery(request, 'status', 'search', 'start', 'end')
        const orders = await listBilling({ status, search, start, end })
        return ok(paginated(orders.map(toBillingResponse), page, limit))
    } catch (error) {
        return handleError(error)
    }
}
