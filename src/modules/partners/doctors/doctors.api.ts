'use client'

import { api } from '@/lib/api/client'

interface Doctor {
    id: string
    name: string
    phone: string
    address: string | null
    specialization: string | null
    _count: { prescriptions: number }
}

interface PatientPrescription {
    id: string
    client: { name: string; familyName: string; phone: string }
    createdAt: string
}

export type { Doctor, PatientPrescription }

export const fetchDoctors = (params?: { search?: string }) =>
    api.get<Doctor[]>('/api/doctors', params as Record<string, string | undefined>)

export const createDoctor = (data: { name: string; phone: string; address: string; specialization: string }) =>
    api.post<Doctor>('/api/doctors', data)

export const updateDoctor = (id: string, data: { name: string; phone: string; address: string; specialization: string }) =>
    api.patch<Doctor>(`/api/doctors/${id}`, data)

export const deleteDoctor = (id: string) =>
    api.del(`/api/doctors/${id}`)

export const fetchDoctorPatients = (doctorId: string) =>
    api.get<PatientPrescription[]>('/api/prescriptions', { doctorId, includeClient: 'true' })
