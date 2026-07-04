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

export const fetchRepairs = (params?: { search?: string; status?: string }) =>
    api.get<RepairItem[]>('/api/repairs', params as Record<string, string | undefined>)

export const updateRepairStatus = (id: string, status: string) =>
    api.patch(`/api/repairs/${id}`, { status })
