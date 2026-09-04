import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchOrders } from './orders.api'
import { api } from '@/lib/api/client'

export function useOrders(params?: { search?: string; status?: string; clientId?: string }) {
    return useQuery({
        queryKey: ['orders', params],
        queryFn: () => fetchOrders(params),
    })
}

export function useDeleteOrder() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (id: string) => api.del(`/api/orders/${id}`),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['orders'] }) },
    })
}