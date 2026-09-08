import { NextRequest } from 'next/server'
import { ok } from '@/lib/api/response'
import { handleError } from '@/lib/middlewares/errorHandler'
import { requireRole } from '@/lib/api/auth'
import { getOpticianShopBill } from '@/modules/partners/optician-shop-bills/optician-shop-bill.service'
import { toOpticianShopBillResponse } from '@/modules/partners/optician-shop-bills/mappers/optician-shop-bill.mapper'

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
