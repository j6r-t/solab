import { NextRequest } from 'next/server'
import { ok, created, noContent } from '@/lib/api/response'
import { handleError } from '@/middlewares/errorHandler'
import { parseBody, parseQuery } from '@/lib/api/parse'
import { listOpticianShops, createOpticianShop, updateOpticianShop, deleteOpticianShop } from './optician-shop.service'
import { toOpticianShopResponse } from '@/mappers/optician-shop.mapper'
import type { CreateOpticianShopInput, UpdateOpticianShopInput } from '@/dtos/optician-shops/optician-shop.dto'

export async function GET(request: NextRequest) {
    try {
        const { search } = parseQuery(request, 'search')
        const items = await listOpticianShops({ search })
        return ok(items.map(toOpticianShopResponse))
    } catch (error) {
        return handleError(error)
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await parseBody<CreateOpticianShopInput>(request)
        const item = await createOpticianShop(body)
        return created(toOpticianShopResponse(item))
    } catch (error) {
        return handleError(error)
    }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const body = await parseBody<UpdateOpticianShopInput>(request)
        const item = await updateOpticianShop(id, body)
        return ok(toOpticianShopResponse(item))
    } catch (error) {
        return handleError(error)
    }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        await deleteOpticianShop(id)
        return noContent()
    } catch (error) {
        return handleError(error)
    }
}
