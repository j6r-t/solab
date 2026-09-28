'use client'

import { useState } from 'react'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { useDebounce } from '@/lib/hooks/useDebounce'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Receipt, Search, ShoppingCart, FileBarChart, Loader2 } from 'lucide-react'
import { OrderForm, type OrderFormData } from '@/modules/sales/orders/OrderForm'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/dates'
import { fetchBillingRecords } from './billing.api'
import { useBilling } from './useBilling'
import { createOrder } from '@/modules/sales/orders/orders.api'
import { toast } from 'sonner'
import type { BillingRecord } from './billing.types'
import { BillingInvoiceDialog } from './BillingInvoiceDialog'
import { BillingReportDialog } from './BillingReportDialog'

const paymentColors: Record<string, 'default' | 'secondary' | 'destructive'> = {
    fullyPaid: 'default',
    partiallyPaid: 'secondary',
    unpaid: 'destructive',
}

export function BillingPage() {
    const { t } = useTranslation()
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [selected, setSelected] = useState<BillingRecord | null>(null)
    const [quickSaleOpen, setQuickSaleOpen] = useState(false)
    const [reportOpen, setReportOpen] = useState(false)
    const [reportPeriod, setReportPeriod] = useState<'today' | 'week' | 'month'>('month')
    const [reportData, setReportData] = useState<BillingRecord[] | null>(null)
    const [reportLoading, setReportLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const debouncedSearch = useDebounce(search, 300)

    const { data, isLoading: loading, refetch: reFetch } = useBilling({ search: debouncedSearch || undefined, status: statusFilter || undefined })
    const records = data ?? []

    const typeLabel = (type: string) => {
        const labels: Record<string, string> = { standard: 'Standard', remounting: 'Remounting', direct_sale: 'Direct Sale' }
        return labels[type] || type
    }

    function getPeriodRange(period: 'today' | 'week' | 'month'): { start: Date; end: Date } {
        const now = new Date()
        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
        if (period === 'today') {
            const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
            return { start, end }
        }
        if (period === 'week') {
            const dayOfWeek = now.getDay()
            const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1
            const monday = new Date(now)
            monday.setDate(now.getDate() - diff)
            monday.setHours(0, 0, 0, 0)
            return { start: monday, end }
        }
        const start = new Date(now.getFullYear(), now.getMonth(), 1)
        return { start, end }
    }

    async function loadReport(period: 'today' | 'week' | 'month') {
        setReportLoading(true)
        setReportPeriod(period)
        const { start, end } = getPeriodRange(period)
        try {
            const data = await fetchBillingRecords({ start: start.toISOString(), end: end.toISOString() })
            setReportData(data)
        } catch {
            toast.error('Failed to load report')
        } finally {
            setReportLoading(false)
        }
    }

    function openReport(period: 'today' | 'week' | 'month') {
        loadReport(period)
        setReportOpen(true)
    }

    async function handleQuickSale(data: OrderFormData) {
        setSaving(true)
        try {
            await createOrder(data)
            toast.success(t('billing.quickSaleSuccess'))
            setQuickSaleOpen(false)
            await reFetch()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Quick sale failed')
        } finally {
            setSaving(false)
        }
    }

    const showEmptyState = !loading && records.length === 0 && !debouncedSearch
    const showNoResults = !loading && records.length === 0 && debouncedSearch

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
                <h1 className="text-2xl font-bold">{t('nav.billing')}</h1>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => openReport('month')}>
                        <FileBarChart className="h-4 w-4 mr-2" />
                        {t('nav.reports')}
                    </Button>
                    <Dialog open={quickSaleOpen} onOpenChange={setQuickSaleOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <ShoppingCart className="h-4 w-4 mr-2" />
                                {t('billing.quickSale')}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>{t('billing.quickSale')}</DialogTitle>
                            </DialogHeader>
                            <OrderForm
                                onSubmit={handleQuickSale}
                                onCancel={() => setQuickSaleOpen(false)}
                                saving={saving}
                                forcedOrderType="direct_sale"
                            />
                        </DialogContent>
                    </Dialog>
                </div>
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
                    <option value="ready">{t('orders.ready')}</option>
                    <option value="completed">{t('common.completed')}</option>
                    <option value="cancelled">{t('common.cancelled')}</option>
                </select>
            </div>

            {loading && records.length === 0 ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            ) : showEmptyState ? (
                <div className="border-2 border-dashed border-muted-foreground/20 rounded-xl flex flex-col items-center justify-center py-16 px-8 text-center max-w-[600px] mx-auto">
                    <Receipt className="w-12 h-12 text-muted-foreground/50 mb-6" />
                    <h2 className="text-lg font-medium text-foreground mb-2">{t('empty.noInvoices')}</h2>
                    <p className="text-sm text-muted-foreground mb-6 max-w-sm leading-relaxed">{t('empty.noInvoicesDesc')}</p>
                </div>
            ) : showNoResults ? (
                <div className="border-2 border-dashed border-muted-foreground/20 rounded-xl flex flex-col items-center justify-center py-16 px-8 text-center max-w-[600px] mx-auto">
                    <Search className="w-12 h-12 text-muted-foreground/50 mb-6" />
                    <h2 className="text-lg font-medium text-foreground mb-2">{t('common.noResults')}</h2>
                </div>
            ) : (
                <div className="border rounded-xl bg-card overflow-x-auto overflow-y-auto max-h-[340px]">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-muted border-b sticky top-0 z-10">
                                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t('billing.number')}</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t('orders.client')}</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t('orders.type')}</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t('billing.date')}</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t('orders.total')}</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t('orders.balance')}</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t('orders.status')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {records.map((r) => {
                                const balance = parseFloat(r.balance)
                                return (
                                    <tr key={r.id} className="cursor-pointer row-hover" onClick={() => setSelected(r)}>
                                        <td className="py-3 px-4 font-medium">#{r.orderNumber}</td>
                                        <td className="py-3 px-4 font-medium">{r.client.name} {r.client.familyName}</td>
                                        <td className="py-3 px-4 text-sm">{typeLabel(r.orderType)}</td>
                                        <td className="py-3 px-4 text-sm">{formatDate(r.createdAt)}</td>
                                        <td className="py-3 px-4 text-sm">{formatCurrency(r.totalAmount)}</td>
                                        <td className="py-3 px-4 text-sm">
                                            {balance === 0
                                                ? '—'
                                                : <span className={balance > 0 ? 'text-destructive' : ''}>{formatCurrency(balance)}</span>}
                                        </td>
                                        <td className="py-3 px-4">
                                            <Badge variant={paymentColors[r.paymentStatus] || 'outline'}>
                                                {t(`orders.${r.paymentStatus}`)}
                                            </Badge>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <BillingInvoiceDialog selected={selected} onClose={() => setSelected(null)} />

            <BillingReportDialog
                open={reportOpen}
                onOpenChange={(o) => { if (!o) { setReportData(null); setReportOpen(false) } }}
                reportPeriod={reportPeriod}
                reportData={reportData}
                reportLoading={reportLoading}
                onPeriodChange={(p) => loadReport(p)}
            />
        </div>
    )
}
