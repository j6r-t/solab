import { NextRequest } from 'next/server'
import { ok } from '@/lib/api/response'
import { handleError } from '@/lib/middlewares/errorHandler'
import { getOpticianShopBill } from '@/modules/partners/optician-shop-bills/optician-shop-bill.service'
import { toOpticianShopBillResponse } from '@/modules/partners/optician-shop-bills/mappers/optician-shop-bill.mapper'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const bill = await getOpticianShopBill(id)
        return ok(toOpticianShopBillResponse(bill))
    } catch (error) {
        return handleError(error)
    }
}
