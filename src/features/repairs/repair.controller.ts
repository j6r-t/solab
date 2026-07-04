import { NextRequest } from 'next/server'
import { ok, noContent } from '@/lib/api/response'
import { handleError } from '@/lib/api/error-handler'
import { parseBody, parseQuery } from '@/lib/api/parse'
import { listRepairs, updateRepairStatus, deleteRepair } from './repair.service'
import { toRepairResponse } from './repair.dto'

export async function GET(request: NextRequest) {
    try {
        const { status, search } = parseQuery(request, 'status', 'search')
        const repairs = await listRepairs({ status, search })
        return ok(repairs.map(toRepairResponse))
    } catch (error) {
        return handleError(error)
    }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const body = await parseBody<{ status: string }>(request)
        const repair = await updateRepairStatus(id, body.status)
        return ok(toRepairResponse(repair))
    } catch (error) {
        return handleError(error)
    }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        await deleteRepair(id)
        return noContent()
    } catch (error) {
        return handleError(error)
    }
}
