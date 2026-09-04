import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import type { Client } from './client.api'

export function useClients(params?: { search?: string; gender?: string }) {
    return useQuery({
        queryKey: ['clients', params],
        queryFn: () => api.get<Client[]>('/api/clients', params as Record<string, string | undefined>),
    })
}

export function useClient(id: string) {
    return useQuery({
        queryKey: ['clients', id],
        queryFn: () => api.get<Client>(`/api/clients/${id}`),
        enabled: !!id,
    })
}

export function useCreateClient() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (data: Record<string, unknown>) => api.post<Client>('/api/clients', data),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['clients'] }) },
    })
}

export function useUpdateClient() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => api.patch<Client>(`/api/clients/${id}`, data),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['clients'] }) },
    })
}

export function useDeleteClient() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (id: string) => api.del(`/api/clients/${id}`),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['clients'] }) },
    })
}