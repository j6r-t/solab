'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from '@/hooks/useTranslation'
import { useDebounce } from '@/hooks/useDebounce'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Wrench, Search, CheckCircle, Clock, AlertTriangle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface RepairItem {
    id: string
    type: string
    status: string
    price: string
    expectedCompletionDate: string
    createdAt: string
    repairService: { name: string; defaultPrice: string } | null
    order: {
        id: string
        orderNumber: number
        client: { id: string; name: string; familyName: string; phone: string }
    }
}

function getDaysRemaining(dateStr: string): number {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const target = new Date(dateStr)
    target.setHours(0, 0, 0, 0)
    return Math.ceil((target.getTime() - today.getTime()) / (1000 * 3600 * 24))
}

function getTurnaroundBadge(days: number): { label: string; variant: 'destructive' | 'secondary' | 'default'; className: string; icon: typeof Clock } {
    if (days < 0) return { label: 'Overdue', variant: 'destructive', className: 'bg-status-pending text-status-pending border-status-pending', icon: AlertTriangle }
    if (days === 0) return { label: 'Due today', variant: 'destructive', className: 'bg-status-pending text-destructive border-status-pending', icon: Clock }
    if (days <= 2) return { label: `${days}d remaining`, variant: 'secondary', className: 'bg-status-pending text-status-pending border-status-pending', icon: Clock }
    return { label: `${days}d remaining`, variant: 'secondary', className: 'bg-status-ready text-status-ready border-status-ready', icon: Clock }
}

export function RepairsPage() {
    const { t } = useTranslation()
    const [repairs, setRepairs] = useState<RepairItem[]>([])
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [loading, setLoading] = useState(true)
    const debouncedSearch = useDebounce(search, 300)

    useEffect(() => {
        async function load() {
            setLoading(true)
            const params = new URLSearchParams()
            if (debouncedSearch) params.set('search', debouncedSearch)
            if (statusFilter) params.set('status', statusFilter)
            const res = await fetch(`/api/repairs?${params}`)
            if (res.ok) setRepairs(await res.json())
            setLoading(false)
        }
        load()
    }, [debouncedSearch, statusFilter])

    async function markComplete(repairId: string) {
        await fetch(`/api/repairs/${repairId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'completed' }),
        })
        const res = await fetch(`/api/repairs?status=${statusFilter}&search=${debouncedSearch}`)
        if (res.ok) setRepairs(await res.json())
        toast.success(t('repairs.markedComplete'))
    }

    const showEmptyState = !loading && repairs.length === 0 && !debouncedSearch
    const showNoResults = !loading && repairs.length === 0 && debouncedSearch

    return (
        <div className="space-y-6 max-w-[900px]">
            <div>
                <h1 className="text-[22px] font-medium">{t('nav.repairs')}</h1>
                <p className="text-sm text-muted-foreground mt-1">Track repairs and client notifications</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by client name..."
                        className="pl-10 h-10"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="h-10 px-3 rounded-md border bg-background text-sm"
                >
                    <option value="">{t('common.all')}</option>
                    <option value="pending">{t('common.pending')}</option>
                    <option value="completed">{t('common.completed')}</option>
                </select>
            </div>

            {loading && repairs.length === 0 ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-6 w-6 animate-spinner text-muted-foreground" />
                </div>
            ) : showEmptyState ? (
                <div className="border-2 border-dashed border-muted-foreground/20 rounded-xl flex flex-col items-center justify-center py-16 px-8 text-center max-w-[600px] mx-auto">
                    <Wrench className="w-12 h-12 text-muted-foreground/50 mb-6" />
                    <h2 className="text-lg font-medium text-foreground mb-2">{t('empty.noRepairs')}</h2>
                    <p className="text-sm text-muted-foreground mb-6 max-w-sm leading-relaxed">{t('empty.noRepairsDesc')}</p>
                </div>
            ) : showNoResults ? (
                <div className="border-2 border-dashed border-muted-foreground/20 rounded-xl flex flex-col items-center justify-center py-16 px-8 text-center max-w-[600px] mx-auto">
                    <Search className="w-12 h-12 text-muted-foreground/50 mb-6" />
                    <h2 className="text-lg font-medium text-foreground mb-2">{t('common.noResults')}</h2>
                </div>
            ) : (
                <div className="border rounded-xl bg-card overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-muted/30 border-b">
                                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t('orders.client')}</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t('repairs.type')}</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t('orders.status')}</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Due Date</th>
                                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {repairs.map((repair) => {
                                const days = getDaysRemaining(repair.expectedCompletionDate)
                                const badge = getTurnaroundBadge(days)
                                const BadgeIcon = badge.icon
                                return (
                                    <tr key={repair.id} className="row-hover">
                                        <td className="py-3 px-4">
                                            <p className="font-medium text-foreground">
                                                {repair.order.client.name} {repair.order.client.familyName}
                                            </p>
                                            <p className="text-xs text-muted-foreground">#{repair.order.orderNumber}</p>
                                        </td>
                                        <td className="py-3 px-4 text-sm text-muted-foreground">
                                            {repair.repairService?.name || repair.type}
                                        </td>
                                        <td className="py-3 px-4">
                                            {repair.status === 'pending' ? (
                                                <Badge variant="outline" className={`${badge.className} gap-1.5 text-xs font-medium`}>
                                                    <BadgeIcon className="h-3.5 w-3.5" />
                                                    {badge.label}
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="bg-status-completed text-status-completed border-status-completed gap-1.5 text-xs font-medium">
                                                    <CheckCircle className="h-3.5 w-3.5" />
                                                    {t('common.completed')}
                                                </Badge>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-sm">
                                            {new Date(repair.expectedCompletionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            {repair.status === 'pending' && (
                                                <Button size="sm" onClick={() => markComplete(repair.id)}>
                                                    <CheckCircle className="h-4 w-4 mr-1" />
                                                    {t('common.completed')}
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
