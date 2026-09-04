import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchCheques, updateChequeStatus } from './cheques.api'

export function useCheques(params?: { status?: string; entityType?: string }) {
    return useQuery({
        queryKey: ['cheques', params],
        queryFn: () => fetchCheques(params),
    })
}

export function useUpdateChequeStatus() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) => updateChequeStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cheques'] })
            queryClient.invalidateQueries({ queryKey: ['billing'] })
            queryClient.invalidateQueries({ queryKey: ['orders'] })
        },
    })
}
