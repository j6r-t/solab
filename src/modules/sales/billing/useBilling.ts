import { useQuery } from '@tanstack/react-query'
import { fetchBillingRecords } from './billing.api'

export function useBilling(params?: { status?: string; search?: string; start?: string; end?: string }) {
    return useQuery({
        queryKey: ['billing', params],
        queryFn: () => fetchBillingRecords(params),
    })
}
