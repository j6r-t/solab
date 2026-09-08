import { NextRequest } from 'next/server'
import { ok, created, noContent } from '@/lib/api/response'
import { handleError } from '@/lib/middlewares/errorHandler'
import { parseBody, parseQuery } from '@/lib/api/parse'
import { parsePagination, paginated } from '@/lib/api/pagination'
import { requireRole } from '@/lib/api/auth'
import { listOpticianShops, createOpticianShop, updateOpticianShop, deleteOpticianShop } from './optician-shop.service'
import { toOpticianShopResponse } from '@/modules/partners/optician-shops/mappers/optician-shop.mapper'
import { opticianShopSchema } from '@/modules/partners/optician-shops/optician-shop.schema'

const OPTICIAN_SHOP_ROLES = ['admin', 'atelier']

export async function GET(request: NextRequest) {
    try {
        requireRole(OPTICIAN_SHOP_ROLES)(request)
        const { page, limit } = parsePagination(request)
        const { search } = parseQuery(request, 'search')
        const items = await listOpticianShops({ search })
        return ok(paginated(items.map(toOpticianShopResponse), page, limit))
    } catch (error) {
        return handleError(error)
    }
}

export async function POST(request: NextRequest) {
    try {
        requireRole(OPTICIAN_SHOP_ROLES)(request)
        const body = await parseBody(request, opticianShopSchema)
        const item = await createOpticianShop(body)
        return created(toOpticianShopResponse(item))
    } catch (error) {
        return handleError(error)
    }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        requireRole(OPTICIAN_SHOP_ROLES)(request)
        const { id } = await params
        const body = await parseBody(request, opticianShopSchema.partial())
        const item = await updateOpticianShop(id, body)
        return ok(toOpticianShopResponse(item))
    } catch (error) {
        return handleError(error)
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        requireRole(OPTICIAN_SHOP_ROLES)(request)
        const { id } = await params
        await deleteOpticianShop(id)
        return noContent()
    } catch (error) {
        return handleError(error)
    }
}
