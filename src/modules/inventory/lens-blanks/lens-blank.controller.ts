import { NextRequest } from 'next/server'
import { ok, created, noContent } from '@/lib/api/response'
import { handleError } from '@/lib/middlewares/errorHandler'
import { parseBody, parseQuery } from '@/lib/api/parse'
import { parsePagination, paginated } from '@/lib/api/pagination'
import { requireRole } from '@/lib/api/auth'
import { listLensBlanks, createLensBlank, updateLensBlank, adjustLensBlankStock, deleteLensBlank } from './lens-blank.service'
import { toLensBlankResponse } from '@/modules/inventory/lens-blanks/mappers/lens-blank.mapper'
import { lensBlankSchema, adjustStockSchema } from '@/modules/inventory/lens-blanks/lens-blank.schema'

const LENS_BLANK_READ_ROLES = ['admin', 'shop', 'atelier']
const LENS_BLANK_WRITE_ROLES = ['admin', 'atelier']

export async function GET(request: NextRequest) {
    try {
        requireRole(LENS_BLANK_READ_ROLES)(request)
        const { page, limit } = parsePagination(request)
        const { search, brand, lensType, material, coating, thickness, lowStock, sphRight, cylRight, sphLeft, cylLeft } = parseQuery(request, 'search', 'brand', 'lensType', 'material', 'coating', 'thickness', 'lowStock', 'sphRight', 'cylRight', 'sphLeft', 'cylLeft')
        const blanks = await listLensBlanks({ search, brand, lensType, material, coating, thickness, lowStock, sphRight, cylRight, sphLeft, cylLeft })
        return ok(paginated(blanks.map(toLensBlankResponse), page, limit))
    } catch (error) {
        return handleError(error)
    }
}

export async function POST(request: NextRequest) {
    try {
        requireRole(LENS_BLANK_WRITE_ROLES)(request)
        const body = await parseBody(request, lensBlankSchema)
        const blank = await createLensBlank(body)
        return created(toLensBlankResponse(blank))
    } catch (error) {
        return handleError(error)
    }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        requireRole(LENS_BLANK_WRITE_ROLES)(request)
        const { id } = await params
        const url = new URL(request.url)
        if (url.searchParams.get('action') === 'adjust-stock') {
            const { quantity, reason } = await parseBody(request, adjustStockSchema)
            const blank = await adjustLensBlankStock(id, quantity, reason)
            return ok(toLensBlankResponse(blank))
        }
        const body = await parseBody(request, lensBlankSchema.partial())
        const blank = await updateLensBlank(id, body)
        return ok(toLensBlankResponse(blank))
    } catch (error) {
        return handleError(error)
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        requireRole(LENS_BLANK_WRITE_ROLES)(request)
        const { id } = await params
        await deleteLensBlank(id)
        return noContent()
    } catch (error) {
        return handleError(error)
    }
}
