'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import { TUNISIAN_BANKS } from '@/lib/constants/banks'

const FALLBACK_BANKS = [...TUNISIAN_BANKS].sort((a, b) => a.localeCompare(b))

/**
 * Managed bank list from Settings (/api/banks), sorted by name.
 * Falls back to the hardcoded TUNISIAN_BANKS constant when the fetch fails or
 * returns an empty list, so cheque/traite payment forms are never blocked.
 */
export function useBanks() {
    const { data, isLoading } = useQuery({
        queryKey: ['banks'],
        queryFn: async (): Promise<string[]> => {
            try {
                const items = await api.get<{ id: string; name: string }[]>('/api/banks')
                const names = (items ?? []).map((b) => b.name).filter(Boolean)
                return names.length > 0 ? [...new Set(names)].sort((a, b) => a.localeCompare(b)) : FALLBACK_BANKS
            } catch {
                return FALLBACK_BANKS
            }
        },
        staleTime: 5 * 60 * 1000,
    })

    return { banks: data ?? FALLBACK_BANKS, isLoading }
}
