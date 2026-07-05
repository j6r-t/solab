import { NextRequest } from 'next/server'
import { ok, created, noContent } from '@/lib/api/response'
import { handleError } from '@/middlewares/errorHandler'
import { parseBody, parseQuery } from '@/lib/api/parse'
import { listFournisseurs, createFournisseur, updateFournisseur, deleteFournisseur } from './fournisseur.service'
import { toFournisseurResponse } from '@/mappers/fournisseur.mapper'
import type { CreateFournisseurInput, UpdateFournisseurInput } from '@/dtos/fournisseurs/fournisseur.dto'

export async function GET(request: NextRequest) {
    try {
        const { search } = parseQuery(request, 'search')
        const items = await listFournisseurs({ search })
        return ok(items.map(toFournisseurResponse))
    } catch (error) {
        return handleError(error)
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await parseBody<CreateFournisseurInput>(request)
        const item = await createFournisseur(body)
        return created(toFournisseurResponse(item))
    } catch (error) {
        return handleError(error)
    }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const body = await parseBody<UpdateFournisseurInput>(request)
        const item = await updateFournisseur(id, body)
        return ok(toFournisseurResponse(item))
    } catch (error) {
        return handleError(error)
    }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        await deleteFournisseur(id)
        return noContent()
    } catch (error) {
        return handleError(error)
    }
}
