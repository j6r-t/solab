'use client'

import { api } from '@/lib/api/client'

interface StockProduct {
    id: string
    name: string
    brand: string
    model: string
    category: string
    price: string
    costPrice: string | null
    quantity: number
    thickness: string | null
    lensType: string | null
    material: string | null
    coating: string | null
    sph: string | null
    cyl: string | null
    add: string | null
    createdAt: string
    fournisseur: { id: string; name: string } | null
    _count: { orderItems: number }
    qrcode: { code: string } | null
}

export type { StockProduct }

export const fetchStockProducts = (params?: {
    search?: string
    category?: string
    stockStatus?: string
    brand?: string
    lensType?: string
    fournisseurId?: string
}) => api.get<StockProduct[]>('/api/stock', params as Record<string, string | undefined>)

export const createStockProduct = (data: any) =>
    api.post<StockProduct>('/api/stock', data)

export const updateStockProduct = (id: string, data: any) =>
    api.patch<StockProduct>(`/api/stock/${id}`, data)

export const deleteStockProduct = (id: string) =>
    api.del(`/api/stock/${id}`)
