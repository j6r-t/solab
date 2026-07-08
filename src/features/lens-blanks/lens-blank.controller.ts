import { NextRequest } from 'next/server'
import { ok, created, noContent } from '@/lib/api/response'
import { handleError } from '@/middlewares/errorHandler'
import { parseBody, parseQuery } from '@/lib/api/parse'
import { listLensBlanks, getLensBlank, createLensBlank, updateLensBlank, adjustLensBlankStock, deleteLensBlank } from './lens-blank.service'
import { toLensBlankResponse } from '@/mappers/lens-blank.mapper'
import type { CreateLensBlankInput, UpdateLensBlankInput } from '@/dtos/lens-blanks/lens-blank.dto'

export async function GET(request: NextRequest) {
    try {
        const { search, brand, lensType, material, coating, thickness, lowStock, sphRight, cylRight, sphLeft, cylLeft } = parseQuery(request, 'search', 'brand', 'lensType', 'material', 'coating', 'thickness', 'lowStock', 'sphRight', 'cylRight', 'sphLeft', 'cylLeft')
        const blanks = await listLensBlanks({ search, brand, lensType, material, coating, thickness, lowStock, sphRight, cylRight, sphLeft, cylLeft })
        return ok(blanks.map(toLensBlankResponse))
    } catch (error) {
        return handleError(error)
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await parseBody<CreateLensBlankInput>(request)
        const blank = await createLensBlank(body)
        return created(toLensBlankResponse(blank))
    } catch (error) {
        return handleError(error)
    }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const url = new URL(request.url)
        if (url.searchParams.get('action') === 'adjust-stock') {
            const { quantity, reason } = await request.json()
            const blank = await adjustLensBlankStock(id, quantity, reason)
            return ok(toLensBlankResponse(blank))
        }
        const body = await parseBody<UpdateLensBlankInput>(request)
        const blank = await updateLensBlank(id, body)
        return ok(toLensBlankResponse(blank))
    } catch (error) {
        return handleError(error)
    }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        await deleteLensBlank(id)
        return noContent()
    } catch (error) {
        return handleError(error)
    }
}
