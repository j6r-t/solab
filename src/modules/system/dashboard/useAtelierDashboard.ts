import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import type { AtelierDashboardData } from './atelier-dashboard.service'

export type { AtelierDashboardData }

export function useAtelierDashboard() {
    return useQuery({
        queryKey: ['dashboard', 'atelier'],
        queryFn: () => api.get<AtelierDashboardData>('/api/dashboard/atelier'),
    })
}
