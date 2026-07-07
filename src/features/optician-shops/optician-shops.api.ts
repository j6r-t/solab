'use client'

import { api } from '@/lib/api/client'

export interface OpticianShopItem {
    id: string
    name: string
    phone: string
    address: string | null
    notes: string | null
    createdAt: string
}

export const fetchOpticianShops = (params?: { search?: string }) =>
    api.get<OpticianShopItem[]>('/api/optician-shops', params as Record<string, string | undefined>)

export const createOpticianShop = (data: { name: string; phone: string; address?: string | null; notes?: string | null }) =>
    api.post<OpticianShopItem>('/api/optician-shops', data)

export const updateOpticianShop = (id: string, data: { name?: string; phone?: string; address?: string | null; notes?: string | null }) =>
    api.patch<OpticianShopItem>(`/api/optician-shops/${id}`, data)

export const deleteOpticianShop = (id: string) =>
    api.del(`/api/optician-shops/${id}`)
