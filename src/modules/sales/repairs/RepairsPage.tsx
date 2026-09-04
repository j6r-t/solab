'use client'

import { useState } from 'react'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { useDebounce } from '@/lib/hooks/useDebounce'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { RepairCreateDialog } from './RepairCreateDialog'
import { useRepairs } from './useRepairs'
import { Wrench, Search, CheckCircle, Clock, AlertTriangle, Loader2, Plus, Store } from 'lucide-react'
import { toast } from 'sonner'

interface RepairItem {
    id: string
    type: string
    status: string
    servicePrice: string
    source: 'internal' | 'optician'
    expectedCompletionDate: string
    createdAt: string
    repairService: { name: string; defaultPrice: string } | null
    opticianShop: { id: string; name: string } | null
    order: {
        id: string
        orderNumber: number
        client: { id: string; name: string; familyName: string; phone: string }
    } | null
}

interface OpticianShop {
    id: string
    name: string
    phone: string
    address: string | null
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
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [sourceFilter, setSourceFilter] = useState('')
    const debouncedSearch = useDebounce(search, 300)
    const { data: repairsData, isLoading: loading, refetch: reFetch } = useRepairs({ search: debouncedSearch, status: statusFilter, source: sourceFilter })
    const repairs = (repairsData ?? []) as unknown as RepairItem[]
    const [createOpen, setCreateOpen] = useState(false)
    const [shops, setShops] = useState<OpticianShop[]>([])
    const [saving, setSaving] = useState(false)
    const [formShopId, setFormShopId] = useState('')
    const [formServiceId, setFormServiceId] = useState('')
    const [formPrice, setFormPrice] = useState('')
    const [formDate, setFormDate] = useState('')
    const [repairServices, setRepairServices] = useState<{ id: string; name: string; defaultPrice: string }[]>([])

    async function markComplete(repairId: string) {
        try {
            const res = await fetch(`/api/repairs/${repairId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'completed' }),
            })
            if (!res.ok) throw new Error('Failed to complete repair')
            toast.success(t('repairs.markedComplete'))
            await reFetch()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to complete repair')
        }
    }

    async function openCreate() {
        setFormShopId('')
        setFormServiceId('')
        setFormPrice('')
        setFormDate(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0])
        setCreateOpen(true)
        try {
            const [shopsRes, servicesRes] = await Promise.all([
                fetch('/api/optician-shops'),
                fetch('/api/repair-services'),
            ])
            if (shopsRes.ok) { const j = await shopsRes.json(); setShops(j.data ?? j) }
            if (servicesRes.ok) { const j = await servicesRes.json(); setRepairServices(j.data ?? j) }
        } catch {}
    }

    async function handleCreate() {
        if (!formShopId) return toast.error('Select an optician shop')
        if (!formPrice) return toast.error('Price is required')
        setSaving(true)
        try {
            const service = repairServices.find((s) => s.id === formServiceId)
            const res = await fetch('/api/repairs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    opticianShopId: formShopId,
                    type: service?.name || '',
                    servicePrice: parseFloat(formPrice),
                    expectedCompletionDate: formDate,
                    repairServiceId: formServiceId || undefined,
                }),
            })
            if (!res.ok) {
                const body = await res.json()
                throw new Error(body.message || 'Failed to create repair')
            }
            toast.success('Repair created')
            setCreateOpen(false)
            await reFetch()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to create repair')
        } finally {
            setSaving(false)
        }
    }

    const showEmptyState = !loading && repairs.length === 0 && !debouncedSearch
    const showNoResults = !loading && repairs.length === 0 && debouncedSearch

    return (
        <div className="space-y-6 max-w-[900px]">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-[22px] font-medium">{t('nav.repairs')}</h1>
                    <p className="text-sm text-muted-foreground mt-1">{t('repairs.description')}</p>
                </div>
                <Button onClick={openCreate}>
                    <Plus className="h-4 w-4 mr-2" />
                    <Store className="h-4 w-4 mr-1" />
                    Optician Repair
                </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by client or optician..."
                        className="pl-10 h-10"
                    />
                </div>
                <Select value={sourceFilter} onValueChange={(v) => setSourceFilter(v)}>
                    <SelectTrigger className="w-[160px] h-10">
                        <SelectValue placeholder={t('common.all')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="">{t('common.all')}</SelectItem>
                        <SelectItem value="internal">Our shop</SelectItem>
                        <SelectItem value="optician">Optician</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-40 h-10">
                        <SelectValue placeholder={t('common.all')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="">{t('common.all')}</SelectItem>
                        <SelectItem value="pending">{t('common.pending')}</SelectItem>
                        <SelectItem value="completed">{t('common.completed')}</SelectItem>
                    </SelectContent>
                </Select>
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
                                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Source / Client</th>
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
                                const isOptician = repair.source === 'optician'
                                return (
                                    <tr key={repair.id} className="row-hover">
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                {isOptician ? (
                                                    <>
                                                        <Badge variant="outline" className="text-[10px] h-5 px-1.5 gap-1 shrink-0">
                                                            <Store className="h-3 w-3" />
                                                            Optician
                                                        </Badge>
                                                        <div className="min-w-0">
                                                            <p className="font-medium text-foreground truncate">
                                                                {repair.opticianShop?.name || 'Unknown shop'}
                                                            </p>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Badge variant="outline" className="text-[10px] h-5 px-1.5 gap-1 shrink-0">
                                                            <Wrench className="h-3 w-3" />
                                                            Internal
                                                        </Badge>
                                                        <div className="min-w-0">
                                                            <p className="font-medium text-foreground truncate">
                                                                {repair.order?.client?.name} {repair.order?.client?.familyName}
                                                            </p>
                                                            {repair.order && (
                                                                <p className="text-xs text-muted-foreground">#{repair.order.orderNumber}</p>
                                                            )}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
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

            <RepairCreateDialog
                open={createOpen}
                onOpenChange={setCreateOpen}
                onSubmit={handleCreate}
                saving={saving}
                repairServices={repairServices}
                formShopId={formShopId}
                onFormShopIdChange={setFormShopId}
                formServiceId={formServiceId}
                onFormServiceIdChange={setFormServiceId}
                formPrice={formPrice}
                onFormPriceChange={setFormPrice}
                formDate={formDate}
                onFormDateChange={setFormDate}
                opticianShops={shops}
            />
        </div>
    )
}
