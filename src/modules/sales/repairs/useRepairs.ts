import { useQuery } from '@tanstack/react-query'
import { fetchRepairs, type RepairItem } from './repairs.api'

export function useRepairs<T = RepairItem[]>(params?: { search?: string; status?: string; source?: string }) {
    return useQuery({
        queryKey: ['repairs', params],
        queryFn: () => fetchRepairs<T>(params),
    })
}
