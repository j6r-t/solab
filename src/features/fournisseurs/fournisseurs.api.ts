'use client'

import { api } from '@/lib/api/client'

interface Fournisseur {
    id: string
    name: string
    phone: string
    address: string | null
    email: string | null
    taxId: string | null
    _count: { products: number }
}

interface FournisseurProduct {
    id: string
    name: string
    brand: string
    model: string
    category: string | null
    price: string
    quantity: number
    _count: { orderItems: number }
}

export type { Fournisseur, FournisseurProduct }

export const fetchFournisseurs = (params?: { search?: string; entity?: string }) =>
    api.get<Fournisseur[]>('/api/fournisseurs', params as Record<string, string | undefined>)

export const createFournisseur = (data: { name: string; phone: string; address: string }) =>
    api.post<Fournisseur>('/api/fournisseurs', data)

export const updateFournisseur = (id: string, data: { name: string; phone: string; address: string }) =>
    api.patch<Fournisseur>(`/api/fournisseurs/${id}`, data)

export const deleteFournisseur = (id: string) =>
    api.del(`/api/fournisseurs/${id}`)

export const fetchFournisseurProducts = (fournisseurId: string) =>
    api.get<FournisseurProduct[]>('/api/stock', { fournisseurId })
