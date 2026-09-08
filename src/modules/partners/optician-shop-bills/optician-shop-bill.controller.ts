import { NextRequest } from 'next/server'
import { ok } from '@/lib/api/response'
import { handleError } from '@/lib/middlewares/errorHandler'
import { BadRequestError } from '@/lib/errors'
import { parseBody, parseQuery } from '@/lib/api/parse'
import { parsePagination, paginated } from '@/lib/api/pagination'
import { requireRole } from '@/lib/api/auth'
import { listOpticianShopBills, getOpticianShopBill, recordBillPayment } from './optician-shop-bill.service'
import { toOpticianShopBillResponse } from '@/modules/partners/optician-shop-bills/mappers/optician-shop-bill.mapper'
import { recordBillPaymentSchema } from '@/modules/partners/optician-shop-bills/optician-shop-bill.schema'

const OPTICIAN_BILL_ROLES = ['admin', 'atelier']

export async function GET(request: NextRequest) {
    try {
        requireRole(OPTICIAN_BILL_ROLES)(request)
        const url = new URL(request.url)
        const id = url.searchParams.get('id')
        if (id) {
            const bill = await getOpticianShopBill(id)
            return ok(toOpticianShopBillResponse(bill))
        }
        const { page, limit } = parsePagination(request)
        const { opticianShopId, status } = parseQuery(request, 'opticianShopId', 'status')
        const bills = await listOpticianShopBills({ opticianShopId, status })
        return ok(paginated(bills.map(toOpticianShopBillResponse), page, limit))
    } catch (error) {
        return handleError(error)
    }
}

export async function POST(request: NextRequest) {
    try {
        requireRole(OPTICIAN_BILL_ROLES)(request)
        const url = new URL(request.url)
        const action = url.searchParams.get('action')
        if (action === 'record-payment') {
            const body = await parseBody(request, recordBillPaymentSchema)
            const bill = await recordBillPayment(body.billId, body)
            return ok(toOpticianShopBillResponse(bill))
        }
        throw new BadRequestError('Unknown action. Use ?action=record-payment')
    } catch (error) {
        return handleError(error)
    }
}