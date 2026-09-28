import { NextRequest } from 'next/server'
import { ok } from '@/lib/api/response'
import { handleError } from '@/lib/middlewares/errorHandler'
import { BadRequestError } from '@/lib/errors'
import { parseQuery } from '@/lib/api/parse'
import { parsePagination, paginated } from '@/lib/api/pagination'
import { requireRole } from '@/lib/api/auth'
import { listOpticianShopBills, getOpticianShopBillsSummary } from './optician-shop-bill.service'
import { toOpticianShopBillResponse } from '@/modules/partners/optician-shop-bills/mappers/optician-shop-bill.mapper'

const OPTICIAN_BILL_ROLES = ['admin', 'atelier']

export async function GET(request: NextRequest) {
    try {
        requireRole(OPTICIAN_BILL_ROLES)(request)
        const { page, limit } = parsePagination(request)
        const { summary, opticianShopId, status, search } = parseQuery(request, 'summary', 'opticianShopId', 'status', 'search')
        if (summary === 'per-shop') {
            return ok(await getOpticianShopBillsSummary())
        }
        const bills = await listOpticianShopBills({ opticianShopId, status, search })
        return ok(paginated(bills.map(toOpticianShopBillResponse), page, limit))
    } catch (error) {
        return handleError(error)
    }
}

export async function POST(request: NextRequest) {
    try {
        requireRole(OPTICIAN_BILL_ROLES)(request)
        throw new BadRequestError('Unknown action. Use ?action=record-payment')
    } catch (error) {
        return handleError(error)
    }
}