import { useQuery } from '@tanstack/react-query'
import {
    fetchConsolidatedInvoices,
    type ConsolidatedInvoice,
} from '@/modules/partners/consolidated-invoices/consolidated-invoices.api'

export function useConsolidatedInvoices(params?: { search?: string; status?: string; opticianShopId?: string }) {
    return useQuery<ConsolidatedInvoice[]>({
        queryKey: ['consolidated-invoices', params],
        queryFn: () => fetchConsolidatedInvoices(params),
    })
}
