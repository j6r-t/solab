import { NextRequest } from 'next/server'
import { ok, created, noContent } from '@/lib/api/response'
import { handleError } from '@/lib/middlewares/errorHandler'
import { parseBody, parseQuery } from '@/lib/api/parse'
import { parsePagination, paginated } from '@/lib/api/pagination'
import { requireRole } from '@/lib/api/auth'
import { clientSchema } from './client.schema'
import { listClients, getClientById, createClient, updateClient, deleteClient } from './client.service'
import { toClientResponse } from '@/modules/partners/clients/mappers/client.mapper'

const CLIENT_ROLES = ['admin', 'shop']

export async function GET(request: NextRequest) {
    try {
        requireRole(CLIENT_ROLES)(request)
        const { page, limit } = parsePagination(request)
        const { search, gender } = parseQuery(request, 'search', 'gender')
        const clients = await listClients({ search, gender })
        return ok(paginated(clients.map(toClientResponse), page, limit))
    } catch (error) {
        return handleError(error)
    }
}

export async function GET_ID(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        requireRole(CLIENT_ROLES)(request)
        const { id } = await params
        const client = await getClientById(id)
        return ok(toClientResponse(client))
    } catch (error) {
        return handleError(error)
    }
}

export async function POST(request: NextRequest) {
    try {
        requireRole(CLIENT_ROLES)(request)
        const data = await parseBody(request, clientSchema)
        const client = await createClient(data)
        return created(toClientResponse(client))
    } catch (error) {
        return handleError(error)
    }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        requireRole(CLIENT_ROLES)(request)
        const { id } = await params
        const data = await parseBody(request, clientSchema.partial())
        const client = await updateClient(id, data)
        return ok(toClientResponse(client))
    } catch (error) {
        return handleError(error)
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        requireRole(CLIENT_ROLES)(request)
        const { id } = await params
        await deleteClient(id)
        return noContent()
    } catch (error) {
        return handleError(error)
    }
}
