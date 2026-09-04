import { useQuery } from '@tanstack/react-query'
import { fetchStockProducts } from './stock.api'
import type { StockProduct } from './stock.api'

export type { StockProduct }

export function useStockProducts(params?: {
    search?: string
    category?: string
    stockStatus?: string
    brand?: string
    lensType?: string
    material?: string
    coating?: string
    thickness?: string
    sphFrom?: string
    sphTo?: string
    cylFrom?: string
    cylTo?: string
    addFrom?: string
    addTo?: string
    fournisseurId?: string
    excludeCategory?: string
}) {
    return useQuery({
        queryKey: ['stock', params],
        queryFn: () => fetchStockProducts(params),
    })
}