import { NextRequest } from 'next/server'
import { ok, created, noContent } from '@/lib/api/response'
import { handleError } from '@/middlewares/errorHandler'
import { parseBody, parseQuery } from '@/lib/api/parse'
import { clientSchema } from './client.schema'
import { listClients, getClientById, createClient, updateClient, deleteClient } from './client.service'
import { toClientResponse } from '@/mappers/client.mapper'

export async function GET(request: NextRequest) {
    try {
        const { search, gender } = parseQuery(request, 'search', 'gender')
        const clients = await listClients({ search, gender })
        return ok(clients.map(toClientResponse))
    } catch (error) {
        return handleError(error)
    }
}

export async function GET_ID(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const client = await getClientById(id)
        return ok(toClientResponse(client))
    } catch (error) {
        return handleError(error)
    }
}

export async function POST(request: NextRequest) {
    try {
        const data = await parseBody(request, clientSchema)
        const client = await createClient(data)
        return created(toClientResponse(client))
    } catch (error) {
        return handleError(error)
    }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const data = await parseBody(request, clientSchema.partial())
        const client = await updateClient(id, data)
        return ok(toClientResponse(client))
    } catch (error) {
        return handleError(error)
    }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        await deleteClient(id)
        return noContent()
    } catch (error) {
        return handleError(error)
    }
}
