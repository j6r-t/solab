import { NextRequest } from 'next/server'
import { ok, created, noContent } from '@/lib/api/response'
import { handleError } from '@/lib/middlewares/errorHandler'
import { parseBody, parseQuery } from '@/lib/api/parse'
import { parsePagination, paginated } from '@/lib/api/pagination'
import { requireRole } from '@/lib/api/auth'
import { listDoctors, createDoctor, updateDoctor, deleteDoctor } from './doctor.service'
import { toDoctorResponse } from '@/modules/partners/doctors/mappers/doctor.mapper'
import { doctorSchema } from '@/modules/partners/doctors/doctor.schema'

const DOCTOR_ROLES = ['admin', 'shop']

export async function GET(request: NextRequest) {
    try {
        requireRole(DOCTOR_ROLES)(request)
        const { page, limit } = parsePagination(request)
        const { search } = parseQuery(request, 'search')
        const items = await listDoctors({ search })
        return ok(paginated(items.map(toDoctorResponse), page, limit))
    } catch (error) {
        return handleError(error)
    }
}

export async function POST(request: NextRequest) {
    try {
        requireRole(DOCTOR_ROLES)(request)
        const body = await parseBody(request, doctorSchema)
        const item = await createDoctor(body)
        return created(toDoctorResponse(item))
    } catch (error) {
        return handleError(error)
    }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        requireRole(DOCTOR_ROLES)(request)
        const { id } = await params
        const body = await parseBody(request, doctorSchema.partial())
        const item = await updateDoctor(id, body)
        return ok(toDoctorResponse(item))
    } catch (error) {
        return handleError(error)
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        requireRole(DOCTOR_ROLES)(request)
        const { id } = await params
        await deleteDoctor(id)
        return noContent()
    } catch (error) {
        return handleError(error)
    }
}
