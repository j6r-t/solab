'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from '@/hooks/useTranslation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Wrench, Search, CheckCircle, Clock, AlertTriangle } from 'lucide-react'
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

export function RepairsPage() {
    const { t } = useTranslation()
    const [repairs, setRepairs] = useState<RepairItem[]>([])
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('')

    useEffect(() => {
        async function load() {
            const params = new URLSearchParams()
            if (search) params.set('search', search)
            if (statusFilter) params.set('status', statusFilter)
            const res = await fetch(`/api/repairs?${params}`)
            if (res.ok) setRepairs(await res.json())
        }
        load()
    }, [search, statusFilter])

    async function markComplete(repairId: string) {
        await fetch(`/api/repairs/${repairId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'completed' }),
        })
        const res = await fetch(`/api/repairs?status=${statusFilter}&search=${search}`)
        if (res.ok) setRepairs(await res.json())
        toast.success(t('repairs.markedComplete'))
    }

    function isOverdue(date: string): boolean {
        return new Date(date) < new Date()
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">{t('nav.repairs')}</h1>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t('common.search')}
                        className="pl-10"
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

            <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {t('repairs.byCompletionDate')}
            </p>

            {repairs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 rounded-xl empty-state-gradient text-muted-foreground">
                    <Wrench className="h-12 w-12 mb-4 opacity-50" />
                    <p>{t('repairs.noRepairs')}</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {repairs.map((repair) => (
                        <div key={repair.id} className="flex items-center justify-between p-4 rounded-lg border bg-card row-alternate">
                            <div>
                                <p className="font-medium">
                                    {repair.order.client.name} {repair.order.client.familyName}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {repair.repairService?.name || repair.type}
                                </p>
                                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {new Date(repair.expectedCompletionDate).toLocaleDateString()}
                                    </span>
                                    <span>#{repair.order.orderNumber}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {repair.status === 'pending' && (
                                    <>
                                        {isOverdue(repair.expectedCompletionDate) ? (
                                            <Badge variant="destructive" className="flex items-center gap-1">
                                                <AlertTriangle className="h-3 w-3" />
                                                {t('repairs.overdue')}
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary" className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {t('common.pending')}
                                            </Badge>
                                        )}
                                        <Button size="sm" onClick={() => markComplete(repair.id)}>
                                            <CheckCircle className="h-4 w-4 mr-1" />
                                            {t('common.completed')}
                                        </Button>
                                    </>
                                )}
                                {repair.status === 'completed' && (
                                    <Badge variant="default" className="flex items-center gap-1">
                                        <CheckCircle className="h-3 w-3" />
                                        {t('common.completed')}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
