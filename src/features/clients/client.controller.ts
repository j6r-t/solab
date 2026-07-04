import { NextRequest } from 'next/server'
import { ok, created, noContent } from '@/lib/api/response'
import { handleError } from '@/lib/api/error-handler'
import { parseBody, parseQuery } from '@/lib/api/parse'
import { clientSchema } from './client.schema'
import { listClients, createClient, updateClient, deleteClient } from './client.service'
import { toClientResponse } from './client.dto'

export async function GET(request: NextRequest) {
    try {
        const { search, gender } = parseQuery(request, 'search', 'gender')
        const clients = await listClients({ search, gender })
        return ok(clients.map(toClientResponse))
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
