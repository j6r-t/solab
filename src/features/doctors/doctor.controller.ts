import { NextRequest } from 'next/server'
import { ok, created, noContent } from '@/lib/api/response'
import { handleError } from '@/middlewares/errorHandler'
import { parseBody, parseQuery } from '@/lib/api/parse'
import { listDoctors, createDoctor, updateDoctor, deleteDoctor } from './doctor.service'
import { toDoctorResponse } from '@/mappers/doctor.mapper'
import type { CreateDoctorInput, UpdateDoctorInput } from '@/dtos/doctors/doctor.dto'

export async function GET(request: NextRequest) {
    try {
        const { search } = parseQuery(request, 'search')
        const items = await listDoctors({ search })
        return ok(items.map(toDoctorResponse))
    } catch (error) {
        return handleError(error)
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await parseBody<CreateDoctorInput>(request)
        const item = await createDoctor(body)
        return created(toDoctorResponse(item))
    } catch (error) {
        return handleError(error)
    }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const body = await parseBody<UpdateDoctorInput>(request)
        const item = await updateDoctor(id, body)
        return ok(toDoctorResponse(item))
    } catch (error) {
        return handleError(error)
    }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        await deleteDoctor(id)
        return noContent()
    } catch (error) {
        return handleError(error)
    }
}
