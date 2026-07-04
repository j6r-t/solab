import { NextRequest } from 'next/server'
import { ok, created, noContent } from '@/lib/api/response'
import { handleError } from '@/middlewares/errorHandler'
import { parseBody } from '@/lib/api/parse'
import { listLensBrands, createLensBrand, updateLensBrand, deleteLensBrand } from './lens-brand.service'
import { toLensBrandResponse } from './lens-brand.dto'

export async function GET() {
    try {
        const items = await listLensBrands()
        return ok(items.map(toLensBrandResponse))
    } catch (error) {
        return handleError(error)
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await parseBody<{ name: string }>(request)
        const item = await createLensBrand(body)
        return created(toLensBrandResponse(item))
    } catch (error) {
        return handleError(error)
    }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const body = await parseBody<{ name?: string }>(request)
        const item = await updateLensBrand(id, body)
        return ok(toLensBrandResponse(item))
    } catch (error) {
        return handleError(error)
    }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        await deleteLensBrand(id)
        return noContent()
    } catch (error) {
        return handleError(error)
    }
}
