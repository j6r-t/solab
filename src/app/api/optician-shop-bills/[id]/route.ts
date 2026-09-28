import { NextRequest } from 'next/server'
import { ok } from '@/lib/api/response'
import { handleError } from '@/lib/middlewares/errorHandler'
import { BadRequestError } from '@/lib/errors'
import { parseBody } from '@/lib/api/parse'
import { requireRole } from '@/lib/api/auth'
import { getOpticianShopBill, recordBillPayment } from '@/modules/partners/optician-shop-bills/optician-shop-bill.service'
import { toOpticianShopBillResponse } from '@/modules/partners/optician-shop-bills/mappers/optician-shop-bill.mapper'
import { recordBillPaymentSchema } from '@/modules/partners/optician-shop-bills/optician-shop-bill.schema'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        requireRole(['admin', 'atelier'])(request)
        const { id } = await params
        const bill = await getOpticianShopBill(id)
        return ok(toOpticianShopBillResponse(bill))
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
        const body = await parseBody(request, recordBillPaymentSchema)
        const bill = await recordBillPayment(id, body)
        return ok(toOpticianShopBillResponse(bill))
    } catch (error) {
        return handleError(error)
    }
}
