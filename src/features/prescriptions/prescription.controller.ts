import { NextRequest } from 'next/server'
import { ok, created, noContent } from '@/lib/api/response'
import { handleError } from '@/lib/api/error-handler'
import { parseBody, parseQuery } from '@/lib/api/parse'
import { prescriptionSchema } from './prescription.schema'
import { listPrescriptions, createPrescription, updatePrescription, deletePrescription } from './prescription.service'
import { toPrescriptionResponse } from './prescription.dto'

export async function GET(request: NextRequest) {
    try {
        const { clientId, doctorId } = parseQuery(request, 'clientId', 'doctorId')
        const prescriptions = await listPrescriptions({ clientId, doctorId })
        return ok(prescriptions.map(toPrescriptionResponse))
    } catch (error) {
        return handleError(error)
    }
}

export async function POST(request: NextRequest) {
    try {
        const data = await parseBody(request, prescriptionSchema)
        const prescription = await createPrescription(data)
        return created(toPrescriptionResponse(prescription))
    } catch (error) {
        return handleError(error)
    }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const data = await parseBody(request, prescriptionSchema.partial())
        const prescription = await updatePrescription(id, data)
        return ok(toPrescriptionResponse(prescription))
    } catch (error) {
        return handleError(error)
    }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        await deletePrescription(id)
        return noContent()
    } catch (error) {
        return handleError(error)
    }
}
