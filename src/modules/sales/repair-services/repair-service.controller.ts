import { NextRequest } from 'next/server'
import { ok, created, noContent } from '@/lib/api/response'
import { handleError } from '@/lib/middlewares/errorHandler'
import { parseBody } from '@/lib/api/parse'
import { parsePagination, paginated } from '@/lib/api/pagination'
import { requireRole } from '@/lib/api/auth'
import { listRepairServices, createRepairService, updateRepairService, deleteRepairService } from './repair-service.service'
import { toRepairServiceResponse } from '@/modules/sales/repair-services/mappers/repair-service.mapper'
import { repairServiceSchema } from '@/modules/sales/repair-services/repair-service.schema'

const REPAIR_SERVICE_READ_ROLES = ['admin', 'shop', 'atelier']
const REPAIR_SERVICE_WRITE_ROLES = ['admin', 'atelier']

export async function GET(request: NextRequest) {
    try {
        requireRole(REPAIR_SERVICE_READ_ROLES)(request)
        const { page, limit } = parsePagination(request)
        const services = await listRepairServices()
        return ok(paginated(services.map(toRepairServiceResponse), page, limit))
    } catch (error) {
        return handleError(error)
    }
}

export async function POST(request: NextRequest) {
    try {
        requireRole(REPAIR_SERVICE_WRITE_ROLES)(request)
        const body = await parseBody(request, repairServiceSchema)
        const service = await createRepairService(body)
        return created(toRepairServiceResponse(service))
    } catch (error) {
        return handleError(error)
    }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        requireRole(REPAIR_SERVICE_WRITE_ROLES)(request)
        const { id } = await params
        const body = await parseBody(request, repairServiceSchema.partial())
        const service = await updateRepairService(id, body)
        return ok(toRepairServiceResponse(service))
    } catch (error) {
        return handleError(error)
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        requireRole(REPAIR_SERVICE_WRITE_ROLES)(request)
        const { id } = await params
        await deleteRepairService(id)
        return noContent()
    } catch (error) {
        return handleError(error)
    }
}