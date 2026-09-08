import { NextRequest } from 'next/server'
import { ok, created, noContent } from '@/lib/api/response'
import { handleError } from '@/lib/middlewares/errorHandler'
import { parseBody, parseQuery } from '@/lib/api/parse'
import { parsePagination, paginated } from '@/lib/api/pagination'
import { requireRole } from '@/lib/api/auth'
import { prescriptionSchema } from './prescription.schema'
import { listPrescriptions, createPrescription, updatePrescription, deletePrescription } from './prescription.service'
import { toPrescriptionResponse } from '@/modules/sales/prescriptions/mappers/prescription.mapper'

const PRESCRIPTION_ROLES = ['admin', 'shop']

export async function GET(request: NextRequest) {
    try {
        requireRole(PRESCRIPTION_ROLES)(request)
        const { page, limit } = parsePagination(request)
        const { clientId, doctorId } = parseQuery(request, 'clientId', 'doctorId')
        const prescriptions = await listPrescriptions({ clientId, doctorId })
        return ok(paginated(prescriptions.map(toPrescriptionResponse), page, limit))
    } catch (error) {
        return handleError(error)
    }
}

export async function POST(request: NextRequest) {
    try {
        requireRole(PRESCRIPTION_ROLES)(request)
        const data = await parseBody(request, prescriptionSchema)
        const prescription = await createPrescription(data)
        return created(toPrescriptionResponse(prescription))
    } catch (error) {
        return handleError(error)
    }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        requireRole(PRESCRIPTION_ROLES)(request)
        const { id } = await params
        const data = await parseBody(request, prescriptionSchema.partial())
        const prescription = await updatePrescription(id, data)
        return ok(toPrescriptionResponse(prescription))
    } catch (error) {
        return handleError(error)
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        requireRole(PRESCRIPTION_ROLES)(request)
        const { id } = await params
        await deletePrescription(id)
        return noContent()
    } catch (error) {
        return handleError(error)
    }
}
