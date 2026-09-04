'use client'

import { api } from '@/lib/api/client'

interface RepairService {
    id: string
    name: string
    defaultPrice: string
}

interface NamedItem {
    id: string
    name: string
}

export type { RepairService, NamedItem }

export const fetchRepairServices = () =>
    api.get<RepairService[]>('/api/repair-services')

export const createRepairService = (data: { name: string; defaultPrice: string }) =>
    api.post<RepairService>('/api/repair-services', data)

export const updateRepairService = (id: string, data: { name: string; defaultPrice: string }) =>
    api.patch<RepairService>(`/api/repair-services/${id}`, data)

export const deleteRepairService = (id: string) =>
    api.del(`/api/repair-services/${id}`)

export const fetchNamedItems = (apiPath: string) =>
    api.get<NamedItem[]>(apiPath)

export const createNamedItem = (apiPath: string, data: { name: string }) =>
    api.post<NamedItem>(apiPath, data)

export const updateNamedItem = (apiPath: string, id: string, data: { name: string }) =>
    api.patch<NamedItem>(`${apiPath}/${id}`, data)

export const deleteNamedItem = (apiPath: string, id: string) =>
    api.del(`${apiPath}/${id}`)
