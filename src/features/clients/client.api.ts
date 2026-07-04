'use client'

import { api } from '@/lib/api/client'

interface Client {
    id: string
    name: string
    familyName: string
    phone: string
    address: string | null
    gender: 'male' | 'female' | null
    createdAt: string
}

export type { Client }

export const fetchClients = (params?: { search?: string; gender?: string }) =>
    api.get<Client[]>('/api/clients', params as Record<string, string | undefined>)

export const fetchClientById = (id: string) =>
    api.get<Client>(`/api/clients/${id}`)

export const createClient = (data: any) =>
    api.post<Client>('/api/clients', data)

export const updateClient = (id: string, data: any) =>
    api.patch<Client>(`/api/clients/${id}`, data)

export const deleteClient = (id: string) =>
    api.del(`/api/clients/${id}`)
