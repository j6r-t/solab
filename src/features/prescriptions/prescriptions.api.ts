'use client'

import { api } from '@/lib/api/client'

interface Prescription {
    id: string
    client: { id: string; name: string; familyName: string; phone: string }
    sphRight: string
    cylRight: string
    axisRight: number
    addRight: string
    pdRight: number
    sphLeft: string
    cylLeft: string
    axisLeft: number
    addLeft: string
    pdLeft: number
    doctor: { id: string; name: string } | null
    dateWritten: string | null
    createdAt: string
}

export type { Prescription }

export const fetchPrescriptions = (params?: { clientId?: string; doctorId?: string; includeClient?: string }) =>
    api.get<Prescription[]>('/api/prescriptions', params as Record<string, string | undefined>)

export const createPrescription = (data: any) =>
    api.post<Prescription>('/api/prescriptions', data)

export const updatePrescription = (id: string, data: any) =>
    api.patch<Prescription>(`/api/prescriptions/${id}`, data)

export const deletePrescription = (id: string) =>
    api.del(`/api/prescriptions/${id}`)
