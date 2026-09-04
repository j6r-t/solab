import type { PrescriptionResponse } from '@/modules/sales/prescriptions/dtos/prescription.dto'
import type { Prisma } from '@prisma/client'

type Numeric = Prisma.Decimal | string | number | null

interface PrescriptionInput {
    id: string
    clientId: string
    sphRight: Numeric
    cylRight: Numeric
    axisRight: number
    addRight: Numeric
    pdRight: number
    sphLeft: Numeric
    cylLeft: Numeric
    axisLeft: number
    addLeft: Numeric
    pdLeft: number
    doctorId?: string | null
    doctor?: { id: string; name: string } | null
    dateWritten?: Date | null
    client?: { name: string; familyName: string; phone: string } | null
    createdAt: Date
}

function toStr(val: Numeric): string {
    if (val == null) return '0'
    if (typeof val === 'string') return val
    if (typeof val === 'number') return val.toString()
    return String(val)
}

export function toPrescriptionResponse(prescription: PrescriptionInput): PrescriptionResponse {
    return {
        id: prescription.id,
        clientId: prescription.clientId,
        sphRight: toStr(prescription.sphRight),
        cylRight: toStr(prescription.cylRight),
        axisRight: prescription.axisRight,
        addRight: toStr(prescription.addRight),
        pdRight: prescription.pdRight,
        sphLeft: toStr(prescription.sphLeft),
        cylLeft: toStr(prescription.cylLeft),
        axisLeft: prescription.axisLeft,
        addLeft: toStr(prescription.addLeft),
        pdLeft: prescription.pdLeft,
        doctorId: prescription.doctorId || null,
        doctor: prescription.doctor || null,
        dateWritten: prescription.dateWritten || null,
        client: prescription.client || null,
        createdAt: prescription.createdAt,
    }
}
