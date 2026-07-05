import type { PrescriptionResponse } from '@/dtos/prescriptions/prescription.dto'

export function toPrescriptionResponse(prescription: any): PrescriptionResponse {
    return {
        id: prescription.id,
        clientId: prescription.clientId,
        sphRight: prescription.sphRight.toString(),
        cylRight: prescription.cylRight.toString(),
        axisRight: prescription.axisRight,
        addRight: prescription.addRight.toString(),
        pdRight: prescription.pdRight,
        sphLeft: prescription.sphLeft.toString(),
        cylLeft: prescription.cylLeft.toString(),
        axisLeft: prescription.axisLeft,
        addLeft: prescription.addLeft.toString(),
        pdLeft: prescription.pdLeft,
        doctorId: prescription.doctorId || null,
        doctor: prescription.doctor || null,
        dateWritten: prescription.dateWritten || null,
        client: prescription.client || null,
        createdAt: prescription.createdAt,
    }
}
