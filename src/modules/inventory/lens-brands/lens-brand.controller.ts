import { NextRequest } from 'next/server'
import { ok, created, noContent } from '@/lib/api/response'
import { handleError } from '@/lib/middlewares/errorHandler'
import { parseBody } from '@/lib/api/parse'
import { parsePagination, paginated } from '@/lib/api/pagination'
import { requireRole } from '@/lib/api/auth'
import { listLensBrands, createLensBrand, updateLensBrand, deleteLensBrand } from './lens-brand.service'
import { toLensBrandResponse } from '@/modules/inventory/lens-brands/mappers/lens-brand.mapper'
import { lensBrandSchema } from '@/modules/inventory/lens-brands/lens-brand.schema'

export async function GET(request: NextRequest) {
    try {
        requireRole(['admin', 'shop', 'atelier'])(request)
        const { page, limit } = parsePagination(request)
        const items = await listLensBrands()
        return ok(paginated(items.map(toLensBrandResponse), page, limit))
    } catch (error) {
        return handleError(error)
    }
}

export async function POST(request: NextRequest) {
    try {
        requireRole(['admin', 'atelier'])(request)
        const body = await parseBody(request, lensBrandSchema)
        const item = await createLensBrand(body)
        return created(toLensBrandResponse(item))
    } catch (error) {
        return handleError(error)
    }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        requireRole(['admin', 'atelier'])(request)
        const { id } = await params
        const body = await parseBody(request, lensBrandSchema.partial())
        const item = await updateLensBrand(id, body)
        return ok(toLensBrandResponse(item))
    } catch (error) {
        return handleError(error)
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        requireRole(['admin', 'atelier'])(request)
        const { id } = await params
        await deleteLensBrand(id)
        return noContent()
    } catch (error) {
        return handleError(error)
    }
}
