'use client'

import { QueryClient, QueryClientProvider, QueryCache } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useState } from 'react'
import { useAuthStore } from '@/stores/auth-store'

function makeQueryClient() {
    return new QueryClient({
        queryCache: new QueryCache({
            onError: (error) => {
                if (!useAuthStore.getState().isAuthenticated) return
                toast.error(error instanceof Error ? error.message : 'Failed to load data')
            },
        }),
        defaultOptions: {
            queries: {
                staleTime: 30 * 1000,
                retry: 1,
                refetchOnWindowFocus: false,
            },
        },
    })
}

export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(makeQueryClient)
    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    )
}
