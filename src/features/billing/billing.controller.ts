import { NextRequest } from 'next/server'
import { ok } from '@/lib/api/response'
import { handleError } from '@/middlewares/errorHandler'
import { parseQuery } from '@/lib/api/parse'
import { listBilling } from './billing.service'
import { toBillingResponse } from './billing.dto'

export async function GET(request: NextRequest) {
    try {
        const { status, search, start, end } = parseQuery(request, 'status', 'search', 'start', 'end')
        const orders = await listBilling({ status, search, start, end })
        return ok(orders.map(toBillingResponse))
    } catch (error) {
        return handleError(error)
    }
}
