'use client'

import { api } from '@/lib/api/client'

interface RepairItem {
    id: string
    type: string
    status: string
    price: string
    expectedCompletionDate: string
    createdAt: string
    repairService: { name: string; defaultPrice: string } | null
    order: {
        id: string
        orderNumber: number
        client: { id: string; name: string; familyName: string; phone: string }
    }
}

export type { RepairItem }

export const fetchRepairs = <T = RepairItem[]>(params?: { search?: string; status?: string; source?: string }) =>
    api.get<T>('/api/repairs', params as Record<string, string | undefined>)

export const updateRepairStatus = (id: string, status: string) =>
    api.patch(`/api/repairs/${id}`, { status })
