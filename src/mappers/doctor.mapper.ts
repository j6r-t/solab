import type { DoctorResponse } from '@/dtos/doctors/doctor.dto'

export function toDoctorResponse(doctor: { id: string; name: string; phone: string; address: string | null; specialization: string | null; createdAt: Date }): DoctorResponse {
    return {
        id: doctor.id,
        name: doctor.name,
        phone: doctor.phone,
        address: doctor.address,
        specialization: doctor.specialization,
        createdAt: doctor.createdAt,
    }
}
