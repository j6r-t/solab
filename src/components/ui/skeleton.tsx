import * as React from 'react'

import { cn } from '@/lib/utils/cn'

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={cn('animate-pulse rounded-lg bg-muted', className)} {...props} />
}

function ListSkeleton({ rows = 6, className }: { rows?: number; className?: string }) {
    return (
        <div className={cn('space-y-2', className)} aria-busy="true" aria-live="polite">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-28" />
                    </div>
                    <Skeleton className="h-8 w-20" />
                </div>
            ))}
        </div>
    )
}

export { Skeleton, ListSkeleton }
