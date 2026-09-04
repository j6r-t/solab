import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchDoctors } from './doctors.api'
import { api } from '@/lib/api/client'

export function useDoctors(params?: { search?: string }) {
    return useQuery({
        queryKey: ['doctors', params],
        queryFn: () => fetchDoctors(params),
    })
}

export function useDeleteDoctor() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (id: string) => api.del(`/api/doctors/${id}`),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['doctors'] }) },
    })
}
