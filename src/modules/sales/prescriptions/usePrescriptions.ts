import { useQuery } from '@tanstack/react-query'
import { fetchPrescriptions } from './prescriptions.api'

export function usePrescriptions(params?: { search?: string; clientId?: string }) {
    return useQuery({
        queryKey: ['prescriptions', params],
        queryFn: () => fetchPrescriptions(params?.clientId ? { clientId: params.clientId } : undefined),
    })
}
