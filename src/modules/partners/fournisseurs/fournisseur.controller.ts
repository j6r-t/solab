import { NextRequest } from 'next/server'
import { ok, created, noContent } from '@/lib/api/response'
import { handleError } from '@/lib/middlewares/errorHandler'
import { parseBody, parseQuery } from '@/lib/api/parse'
import { parsePagination, paginated } from '@/lib/api/pagination'
import { requireRole } from '@/lib/api/auth'
import { listFournisseurs, createFournisseur, updateFournisseur, deleteFournisseur } from './fournisseur.service'
import { toFournisseurResponse } from '@/modules/partners/fournisseurs/mappers/fournisseur.mapper'
import { fournisseurSchema } from '@/modules/partners/fournisseurs/fournisseur.schema'

const FOURNISSEUR_ROLES = ['admin', 'shop', 'atelier']

export async function GET(request: NextRequest) {
    try {
        requireRole(FOURNISSEUR_ROLES)(request)
        const { page, limit } = parsePagination(request)
        const { search, entity } = parseQuery(request, 'search', 'entity')
        const items = await listFournisseurs({ search, entity })
        return ok(paginated(items.map(toFournisseurResponse), page, limit))
    } catch (error) {
        return handleError(error)
    }
}

export async function POST(request: NextRequest) {
    try {
        requireRole(FOURNISSEUR_ROLES)(request)
        const body = await parseBody(request, fournisseurSchema)
        const item = await createFournisseur(body)
        return created(toFournisseurResponse(item))
    } catch (error) {
        return handleError(error)
    }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        requireRole(FOURNISSEUR_ROLES)(request)
        const { id } = await params
        const body = await parseBody(request, fournisseurSchema.partial())
        const item = await updateFournisseur(id, body)
        return ok(toFournisseurResponse(item))
    } catch (error) {
        return handleError(error)
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        requireRole(FOURNISSEUR_ROLES)(request)
        const { id } = await params
        await deleteFournisseur(id)
        return noContent()
    } catch (error) {
        return handleError(error)
    }
}
