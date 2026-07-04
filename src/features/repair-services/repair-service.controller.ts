import { NextRequest } from 'next/server'
import { ok, created, noContent } from '@/lib/api/response'
import { handleError } from '@/middlewares/errorHandler'
import { parseBody } from '@/lib/api/parse'
import { listRepairServices, createRepairService, updateRepairService, deleteRepairService } from './repair-service.service'
import { toRepairServiceResponse } from './repair-service.dto'

export async function GET() {
    try {
        const services = await listRepairServices()
        return ok(services.map(toRepairServiceResponse))
    } catch (error) {
        return handleError(error)
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await parseBody<{ name: string; defaultPrice: number }>(request)
        const service = await createRepairService(body)
        return created(toRepairServiceResponse(service))
    } catch (error) {
        return handleError(error)
    }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const body = await parseBody<{ name?: string; defaultPrice?: number }>(request)
        const service = await updateRepairService(id, body)
        return ok(toRepairServiceResponse(service))
    } catch (error) {
        return handleError(error)
    }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        await deleteRepairService(id)
        return noContent()
    } catch (error) {
        return handleError(error)
    }
}
