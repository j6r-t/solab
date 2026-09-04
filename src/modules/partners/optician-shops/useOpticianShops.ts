import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchOpticianShops } from './optician-shops.api'
import { api } from '@/lib/api/client'
import type { OpticianShopItem } from './optician-shops.api'

export function useOpticianShops(params?: { search?: string }) {
    return useQuery({
        queryKey: ['optician-shops', params],
        queryFn: () => fetchOpticianShops(params),
    })
}

export function useCreateOpticianShop() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (data: { name: string; phone: string; address?: string | null; notes?: string | null }) =>
            api.post<OpticianShopItem>('/api/optician-shops', data),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['optician-shops'] }) },
    })
}

export function useUpdateOpticianShop() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: { name?: string; phone?: string; address?: string | null; notes?: string | null } }) =>
            api.patch<OpticianShopItem>(`/api/optician-shops/${id}`, data),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['optician-shops'] }) },
    })
}

export function useDeleteOpticianShop() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (id: string) => api.del(`/api/optician-shops/${id}`),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['optician-shops'] }) },
    })
}