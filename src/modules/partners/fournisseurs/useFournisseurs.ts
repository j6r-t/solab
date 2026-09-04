import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchFournisseurs } from './fournisseurs.api'
import { api } from '@/lib/api/client'

export function useFournisseurs(params?: { search?: string; entity?: string }) {
    return useQuery({
        queryKey: ['fournisseurs', params],
        queryFn: () => fetchFournisseurs(params),
    })
}

export function useDeleteFournisseur() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (id: string) => api.del(`/api/fournisseurs/${id}`),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['fournisseurs'] }) },
    })
}
