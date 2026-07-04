'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from '@/hooks/useTranslation'
import { useDebounce } from '@/hooks/useDebounce'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Receipt, Search, Printer, ShoppingCart, FileBarChart, Calendar, DollarSign, Download, CheckCircle, Loader2 } from 'lucide-react'
import { OrderForm, type OrderFormData } from '@/components/orders/OrderForm'
import { formatCurrency } from '@/lib/currency'
import { toast } from 'sonner'

interface InvoiceItem {
    productName: string
    brand: string
    quantity: number
    unitPrice: string
}

interface InvoicePayment {
    amount: string
    type: string
    createdAt: string
}

interface InvoiceRepair {
    type: string
    price: string
}

interface InvoicePrescription {
    sphRight: string
    cylRight: string
    axisRight: number
    addRight: string
    pdRight: number
    sphLeft: string
    cylLeft: string
    axisLeft: number
    addLeft: string
    pdLeft: number
    dateWritten: string | null
    doctorName: string | null
}

interface BillingRecord {
    id: string
    orderNumber: number
    client: { name: string; familyName: string; phone: string; address?: string | null }
    totalAmount: string
    totalPaid: string
    balance: string
    paymentStatus: string
    status: string
    orderType: string
    createdAt: string
    items: InvoiceItem[]
    payments: InvoicePayment[]
    repairs: InvoiceRepair[]
    turnaroundDays: number | null
    prescription: InvoicePrescription | null
}

const paymentColors: Record<string, 'default' | 'secondary' | 'destructive'> = {
    fullyPaid: 'default',
    partiallyPaid: 'secondary',
    unpaid: 'destructive',
}

export function BillingPage() {
    const { t } = useTranslation()
    const [records, setRecords] = useState<BillingRecord[]>([])
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [selected, setSelected] = useState<BillingRecord | null>(null)
    const [quickSaleOpen, setQuickSaleOpen] = useState(false)
    const [reportOpen, setReportOpen] = useState(false)
    const [reportPeriod, setReportPeriod] = useState<'today' | 'week' | 'month'>('month')
    const [reportData, setReportData] = useState<BillingRecord[] | null>(null)
    const [reportLoading, setReportLoading] = useState(false)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const debouncedSearch = useDebounce(search, 300)

    useEffect(() => {
        async function load() {
            setLoading(true)
            try {
                const params = new URLSearchParams()
                if (debouncedSearch) params.set('search', debouncedSearch)
                if (statusFilter) params.set('status', statusFilter)
                const res = await fetch(`/api/billing?${params}`)
                if (!res.ok) {
                    const body = await res.json()
                    throw new Error(body.error || 'Failed to fetch invoices')
                }
                setRecords(await res.json())
            } catch (error) {
                console.error('Failed to fetch billing records:', error)
                toast.error(error instanceof Error ? error.message : 'Failed to load invoices')
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [debouncedSearch, statusFilter])

    function formatDate(dateStr: string): string {
        return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
    }

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
            const res = await fetch(`/api/billing?start=${start.toISOString()}&end=${end.toISOString()}`)
            if (res.ok) {
                const data = await res.json()
                setReportData(data)
            }
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

    const reportTotals = reportData ? reportData.reduce(
        (acc, r) => ({
            revenue: acc.revenue + parseFloat(r.totalAmount),
            paid: acc.paid + parseFloat(r.totalPaid),
            balance: acc.balance + parseFloat(r.balance),
            count: acc.count + 1,
        }),
        { revenue: 0, paid: 0, balance: 0, count: 0 }
    ) : null

    function printInvoice() {
        const printWindow = window.open('', '_blank')
        if (!printWindow || !selected) return
        const { client, items, payments, repairs, totalAmount, totalPaid, balance, createdAt, turnaroundDays, prescription } = selected
        const prescriptionDate = prescription?.dateWritten ? new Date(prescription.dateWritten).toLocaleDateString('fr-TN', { day: 'numeric', month: 'numeric', year: 'numeric' }) : null
        const deposit = payments.find((p) => p.type === 'deposit')
        const designation = items.map((i) => `${i.productName}${i.brand ? ` (${i.brand})` : ''}`).join(', ')
        const promiseDate = turnaroundDays
            ? new Date(new Date(createdAt).getTime() + turnaroundDays * 86400000).toLocaleDateString('fr-TN', { day: 'numeric', month: 'numeric', year: 'numeric' })
            : ''
        const rxRows = prescription
            ? `
              <tr><td style="padding:8px 6px;text-align:center;font-weight:600">OD</td><td style="padding:8px 6px;text-align:center">${prescription.sphRight}</td><td style="padding:8px 6px;text-align:center">${prescription.cylRight}</td><td style="padding:8px 6px;text-align:center">${prescription.axisRight}</td><td style="padding:8px 6px;text-align:center">${prescription.addRight}</td><td style="padding:8px 6px;text-align:center">${prescription.pdRight}</td><td style="padding:8px 6px;text-align:center"></td></tr>
              <tr><td style="padding:8px 6px;text-align:center;font-weight:600">OG</td><td style="padding:8px 6px;text-align:center">${prescription.sphLeft}</td><td style="padding:8px 6px;text-align:center">${prescription.cylLeft}</td><td style="padding:8px 6px;text-align:center">${prescription.axisLeft}</td><td style="padding:8px 6px;text-align:center">${prescription.addLeft}</td><td style="padding:8px 6px;text-align:center">${prescription.pdLeft}</td><td style="padding:8px 6px;text-align:center"></td></tr>`
            : ''
        printWindow.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Facture - Sofien Optic</title>
            <style>
                *{margin:0;padding:0;box-sizing:border-box}
                body{font-family:'Segoe UI',Arial,sans-serif;max-width:750px;margin:0 auto;padding:32px;color:#000}
                .shop-name{font-size:24px;font-weight:bold;color:#37b34a;letter-spacing:-0.5px;text-align:center}
                .shop-name span{color:#37b34a}
                .shop-name .ptic{font-size:24px;font-weight:bold;color:#37b34a;margin-left:-4px}
                .divider{height:2px;background:#37b34a;margin:12px 0 20px}
                .fields-grid{display:flex;gap:40px;margin-bottom:20px}
                .fields-grid .col{flex:1}
                .field-row{display:flex;align-items:baseline;margin-bottom:10px;font-size:13px}
                .field-row .label{font-weight:600;white-space:nowrap;min-width:115px}
                .field-row .dots{flex:1;border-bottom:1px dotted #999;margin:0 4px;height:1em}
                .field-row .value{font-weight:500;white-space:nowrap;font-size:13px}
                .rx-table{width:100%;border-collapse:collapse;margin:16px 0 10px;font-size:13px}
                .rx-table th{padding:8px 6px;text-align:center;font-weight:600;border:1px solid #000;background:#f5f5f5}
                .rx-table td{padding:8px 6px;text-align:center;border:1px solid #000}
                .footer-divider{height:2px;background:#37b34a;margin:20px 0 12px}
                .footer-text{text-align:center;font-size:11px;color:#555;line-height:1.6}
                .footer-text .shop{font-weight:600;color:#37b34a}
                @media print{button{display:none}body{padding:16px}}
</style></head><body>
            <div class="shop-name">Sofiene <span class="ptic">ptic</span></div>
            <div class="divider"></div>
            <div class="fields-grid">
                <div class="col">
                    <div class="field-row"><span class="label">Date:</span><span class="dots"></span><span class="value">${formatDate(createdAt)}</span></div>
                    <div class="field-row"><span class="label">N &amp; P:</span><span class="dots"></span><span class="value">${client.name} ${client.familyName}</span></div>
                    <div class="field-row"><span class="label">N de Tel:</span><span class="dots"></span><span class="value">${client.phone}</span></div>
                    <div class="field-row"><span class="label">Designation:</span><span class="dots"></span><span class="value">${designation || '—'}</span></div>
                    ${prescriptionDate ? `<div class="field-row"><span class="label">Date Ordonnance:</span><span class="dots"></span><span class="value">${prescriptionDate}</span></div>` : ''}
                    ${prescription?.doctorName ? `<div class="field-row"><span class="label">Medecin:</span><span class="dots"></span><span class="value">${prescription.doctorName}</span></div>` : ''}
                </div>
                <div class="col">
                    <div class="field-row"><span class="label">Prix:</span><span class="dots"></span><span class="value">${formatCurrency(totalAmount)}</span></div>
                    <div class="field-row"><span class="label">Acompte:</span><span class="dots"></span><span class="value">${deposit ? formatCurrency(deposit.amount) : '—'}</span></div>
                    <div class="field-row"><span class="label">Reste:</span><span class="dots"></span><span class="value">${formatCurrency(balance)}</span></div>
                    <div class="field-row"><span class="label">Date promise:</span><span class="dots"></span><span class="value">${promiseDate || '—'}</span></div>
                </div>
            </div>
            <table class="rx-table">
                <thead><tr><th style="width:12%">OD/OG</th><th style="width:14%">Sph</th><th style="width:14%">Cyl</th><th style="width:14%">Axe</th><th style="width:14%">Add</th><th style="width:16%">Ep</th><th style="width:16%">H</th></tr></thead>
                <tbody>${rxRows || '<tr><td colspan="7" style="padding:16px;text-align:center;color:#999">Aucune ordonnance</td></tr>'}</tbody>
            </table>
            <div class="footer-divider"></div>
            <div class="footer-text">
                Rue de la liberte M&rsquo;himidia en face Ooredoo<br>
                <span class="shop">Sofiene Optic</span><br>
                24.398.692 &mdash; 24.248.632
            </div>
            </body></html>`)
        printWindow.document.close()
    }

    function printReport() {
        if (!reportData || !reportTotals) return
        const printWindow = window.open('', '_blank')
        if (!printWindow) return
        const periodLabel = reportPeriod === 'today' ? 'Today' : reportPeriod === 'week' ? 'This Week' : 'This Month'
        const orderRows = reportData.map((r) =>
            `<tr><td style="padding:6px 10px">#${r.orderNumber}</td><td style="padding:6px 10px">${r.client.name} ${r.client.familyName}</td><td style="padding:6px 10px">${typeLabel(r.orderType)}</td><td style="padding:6px 10px;text-align:right">${formatCurrency(r.totalAmount)}</td><td style="padding:6px 10px;text-align:right">${formatCurrency(r.totalPaid)}</td></tr>`
        ).join('')
        printWindow.document.write(`<!DOCTYPE html><html><head><title>Report ${periodLabel} — Sofien Optic</title>
            <style>
                *{margin:0;padding:0;box-sizing:border-box}
                body{font-family:'Segoe UI',Arial,sans-serif;max-width:800px;margin:0 auto;padding:32px 24px;color:#1a1a2e}
                .header{display:flex;align-items:center;gap:16px;margin-bottom:24px;padding-bottom:16px;border-bottom:3px solid #519651}
                .logo{width:40px;height:40px;background:#519651;border-radius:10px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:20px;font-weight:bold;flex-shrink:0}
                .shop-name{font-size:20px;font-weight:700;color:#519651}
                h2{font-size:16px;margin-bottom:16px;color:#555}
                table{width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px}
                th{background:#519651;color:#fff;padding:8px 10px;text-align:left;font-weight:600}
                td{padding:8px 10px;border-bottom:1px solid #e8e8e8}
                .summary{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px}
                .summary-card{padding:16px;border-radius:8px;text-align:center}
                .summary-card .value{font-size:20px;font-weight:700;margin-top:4px}
                .summary-card.revenue{background:#f0f9f0;border:1px solid #c8e6c9;color:#519651}
                .summary-card.paid{background:#f0f4ff;border:1px solid #c8d6f0;color:#2563eb}
                .summary-card.count{background:#fef3e6;border:1px solid #fde0c0;color:#d97706}
                .footer{text-align:center;margin-top:24px;padding-top:12px;border-top:1px solid #e0e0e0;font-size:11px;color:#999}
                @media print{button{display:none}}
</style></head><body>
            <div class="header">
                <div class="logo">SO</div>
                <div><div class="shop-name">Sofien Optic</div></div>
            </div>
            <h2>Report — ${periodLabel}</h2>
            <div class="summary">
                <div class="summary-card revenue"><div>Revenue</div><div class="value">${formatCurrency(reportTotals.revenue.toFixed(3))}</div></div>
                <div class="summary-card paid"><div>Collected</div><div class="value">${formatCurrency(reportTotals.paid.toFixed(3))}</div></div>
                <div class="summary-card count"><div>Orders</div><div class="value">${reportTotals.count}</div></div>
            </div>
            <table><thead><tr><th>#</th><th>Client</th><th>Type</th><th>Total</th><th>Paid</th></tr></thead><tbody>${orderRows}</tbody></table>
            <div class="footer">Sofien Optic — Report generated ${new Date().toLocaleDateString('en-US')}</div>
            </body></html>`)
        printWindow.document.close()
    }

    async function handleQuickSale(data: OrderFormData) {
        setSaving(true)
        try {
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })
            if (!res.ok) {
                const body = await res.json()
                throw new Error(JSON.stringify(body.error))
            }
            toast.success(t('billing.quickSaleSuccess'))
            await delay(1500)
            setQuickSaleOpen(false)
            const params = new URLSearchParams()
            if (debouncedSearch) params.set('search', debouncedSearch)
            if (statusFilter) params.set('status', statusFilter)
            const refresh = await fetch(`/api/billing?${params}`)
            if (refresh.ok) setRecords(await refresh.json())
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Quick sale failed')
        } finally {
            setSaving(false)
        }
    }

    function delay(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms))
    }

    const showEmptyState = !loading && records.length === 0 && !debouncedSearch
    const showNoResults = !loading && records.length === 0 && debouncedSearch

    return (
        <div className="space-y-4 max-w-[900px]">
            <div className="flex items-center justify-between flex-wrap gap-2">
                <h1 className="text-2xl font-bold">{t('nav.billing')}</h1>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => openReport('today')}>
                        <Calendar className="h-4 w-4 mr-2" />
                        {t('reports.today')}
                    </Button>
                    <Button variant="outline" onClick={() => openReport('week')}>
                        <FileBarChart className="h-4 w-4 mr-2" />
                        {t('reports.thisWeek')}
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
                    <Loader2 className="h-6 w-6 animate-spinner text-muted-foreground" />
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
                <div className="space-y-2">
                    {records.map((r) => (
                        <button
                            key={r.id}
                            onClick={() => setSelected(r)}
                            className="w-full flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent transition-colors text-left row-alternate row-hover"
                        >
                            <div>
                                <p className="font-medium">#{r.orderNumber} — {r.client.name} {r.client.familyName}</p>
                                <p className="text-xs text-muted-foreground">{typeLabel(r.orderType)} · {r.items.length} articles · {formatDate(r.createdAt)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="text-right text-sm">
                                    <p className="font-medium">{formatCurrency(r.totalAmount)}</p>
                                    {r.balance !== '0.000' && (
                                        <p className="text-xs text-muted-foreground">{t('orders.balance')}: {formatCurrency(r.balance)}</p>
                                    )}
                                </div>
                                <Badge variant={paymentColors[r.paymentStatus] || 'outline'}>
                                    {t(`orders.${r.paymentStatus}`)}
                                </Badge>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* Invoice Detail Dialog */}
            <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
                <DialogContent className="w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    {selected && (() => {
                        const s = selected
                        const deposit = s.payments.find((p) => p.type === 'deposit')
                        const designation = s.items.map((i) => `${i.productName}${i.brand ? ` (${i.brand})` : ''}`).join(', ')
                        const promiseDate = s.turnaroundDays
                            ? new Date(new Date(s.createdAt).getTime() + s.turnaroundDays * 86400000).toLocaleDateString('fr-TN', { day: 'numeric', month: 'numeric', year: 'numeric' })
                            : null
                        return (
                        <div className="py-4">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <p className="text-[22px] font-bold" style={{color:'#37b34a'}}>Sofiene ptic</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">Facture #{s.orderNumber} &mdash; {formatDate(s.createdAt)}</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={printInvoice}>
                                        <Download className="h-4 w-4 mr-1.5" />
                                        Export PDF
                                    </Button>
                                    <Button size="sm" className="gap-1.5" onClick={() => { printInvoice(); setTimeout(() => window.open('', '_blank')?.print(), 500) }}>
                                        <Printer className="h-4 w-4 mr-1.5" />
                                        Print
                                    </Button>
                                </div>
                            </div>

                            <div className="border rounded-xl bg-card p-5 space-y-5">
                                {/* Two-column fields */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-2.5 text-sm">
                                    <div className="space-y-2.5">
                                        <div className="flex items-baseline gap-2">
                                            <span className="font-semibold shrink-0 w-24">Date:</span>
                                            <span className="flex-1 border-b border-dotted border-muted-foreground/40 min-w-0" />
                                            <span>{formatDate(s.createdAt)}</span>
                                        </div>
                                        <div className="flex items-baseline gap-2">
                                            <span className="font-semibold shrink-0 w-24">N &amp; P:</span>
                                            <span className="flex-1 border-b border-dotted border-muted-foreground/40 min-w-0" />
                                            <span>{s.client.name} {s.client.familyName}</span>
                                        </div>
                                        <div className="flex items-baseline gap-2">
                                            <span className="font-semibold shrink-0 w-24">N de Tel:</span>
                                            <span className="flex-1 border-b border-dotted border-muted-foreground/40 min-w-0" />
                                            <span>{s.client.phone}</span>
                                        </div>
                                        <div className="flex items-baseline gap-2">
                                            <span className="font-semibold shrink-0 w-24">Designation:</span>
                                            <span className="flex-1 border-b border-dotted border-muted-foreground/40 min-w-0" />
                                            <span className="text-right max-w-[200px] truncate" title={designation}>{designation || '—'}</span>
                                        </div>
                                        {s.prescription?.dateWritten && (
                                        <div className="flex items-baseline gap-2">
                                            <span className="font-semibold shrink-0 w-24">Date Ordonnance:</span>
                                            <span className="flex-1 border-b border-dotted border-muted-foreground/40 min-w-0" />
                                            <span>{new Date(s.prescription.dateWritten).toLocaleDateString('fr-TN', { day: 'numeric', month: 'numeric', year: 'numeric' })}</span>
                                        </div>
                                        )}
                                        {s.prescription?.doctorName && (
                                        <div className="flex items-baseline gap-2">
                                            <span className="font-semibold shrink-0 w-24">Medecin:</span>
                                            <span className="flex-1 border-b border-dotted border-muted-foreground/40 min-w-0" />
                                            <span>{s.prescription.doctorName}</span>
                                        </div>
                                        )}
                                    </div>
                                    <div className="space-y-2.5">
                                        <div className="flex items-baseline gap-2">
                                            <span className="font-semibold shrink-0 w-24">Prix:</span>
                                            <span className="flex-1 border-b border-dotted border-muted-foreground/40 min-w-0" />
                                            <span>{formatCurrency(s.totalAmount)}</span>
                                        </div>
                                        <div className="flex items-baseline gap-2">
                                            <span className="font-semibold shrink-0 w-24">Acompte:</span>
                                            <span className="flex-1 border-b border-dotted border-muted-foreground/40 min-w-0" />
                                            <span>{deposit ? formatCurrency(deposit.amount) : '—'}</span>
                                        </div>
                                        <div className="flex items-baseline gap-2">
                                            <span className="font-semibold shrink-0 w-24">Reste:</span>
                                            <span className="flex-1 border-b border-dotted border-muted-foreground/40 min-w-0" />
                                            <span>{formatCurrency(s.balance)}</span>
                                        </div>
                                        <div className="flex items-baseline gap-2">
                                            <span className="font-semibold shrink-0 w-24">Date promise:</span>
                                            <span className="flex-1 border-b border-dotted border-muted-foreground/40 min-w-0" />
                                            <span>{promiseDate || '—'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Prescription Table */}
                                {s.prescription ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm border-collapse">
                                            <thead>
                                                <tr className="border border-foreground/20 bg-muted/50">
                                                    <th className="p-2 text-center font-semibold border-r border-foreground/20 w-[12%]">OD/OG</th>
                                                    <th className="p-2 text-center font-semibold border-r border-foreground/20 w-[14%]">Sph</th>
                                                    <th className="p-2 text-center font-semibold border-r border-foreground/20 w-[14%]">Cyl</th>
                                                    <th className="p-2 text-center font-semibold border-r border-foreground/20 w-[14%]">Axe</th>
                                                    <th className="p-2 text-center font-semibold border-r border-foreground/20 w-[14%]">Add</th>
                                                    <th className="p-2 text-center font-semibold border-r border-foreground/20 w-[16%]">Ep</th>
                                                    <th className="p-2 text-center font-semibold w-[16%]">H</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr className="border-x border-foreground/20">
                                                    <td className="p-2 text-center font-semibold border-r border-foreground/20">OD</td>
                                                    <td className="p-2 text-center border-r border-foreground/20">{s.prescription.sphRight}</td>
                                                    <td className="p-2 text-center border-r border-foreground/20">{s.prescription.cylRight}</td>
                                                    <td className="p-2 text-center border-r border-foreground/20">{s.prescription.axisRight}</td>
                                                    <td className="p-2 text-center border-r border-foreground/20">{s.prescription.addRight}</td>
                                                    <td className="p-2 text-center border-r border-foreground/20">{s.prescription.pdRight}</td>
                                                    <td className="p-2 text-center"></td>
                                                </tr>
                                                <tr className="border border-foreground/20">
                                                    <td className="p-2 text-center font-semibold border-r border-foreground/20">OG</td>
                                                    <td className="p-2 text-center border-r border-foreground/20">{s.prescription.sphLeft}</td>
                                                    <td className="p-2 text-center border-r border-foreground/20">{s.prescription.cylLeft}</td>
                                                    <td className="p-2 text-center border-r border-foreground/20">{s.prescription.axisLeft}</td>
                                                    <td className="p-2 text-center border-r border-foreground/20">{s.prescription.addLeft}</td>
                                                    <td className="p-2 text-center border-r border-foreground/20">{s.prescription.pdLeft}</td>
                                                    <td className="p-2 text-center"></td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground italic text-center py-3">Aucune ordonnance</p>
                                )}

                                {/* Footer */}
                                <div className="border-t-2 pt-4 text-center text-xs text-muted-foreground leading-relaxed" style={{borderColor:'#37b34a'}}>
                                    <p>Rue de la liberte M&rsquo;himidia en face Ooredoo</p>
                                    <p className="font-semibold" style={{color:'#37b34a'}}>Sofiene Optic</p>
                                    <p>24.398.692 &mdash; 24.248.632</p>
                                </div>
                            </div>
                        </div>
                        )
                    })()}
                </DialogContent>
            </Dialog>

            {/* Period Report Dialog */}
            <Dialog open={reportOpen} onOpenChange={(o) => { if (!o) setReportData(null); setReportOpen(o) }}>
                <DialogContent className="w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileBarChart className="h-5 w-5 text-primary" />
                            {t('nav.billing')} — {reportPeriod === 'today' ? t('reports.today') : reportPeriod === 'week' ? t('reports.thisWeek') : t('reports.thisMonth')}
                        </DialogTitle>
                    </DialogHeader>
                    {reportLoading ? (
                        <p className="text-center py-8 text-muted-foreground">{t('common.loading')}</p>
                    ) : reportData && reportTotals ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-3">
                                <Card className="border-primary/20 bg-primary/[0.03]">
                                    <CardHeader className="pb-2 pt-3 px-3">
                                        <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                                            <DollarSign className="h-3 w-3 text-primary" />
                                            {t('dashboard.totalRevenue')}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="px-3 pb-3">
                                        <p className="text-lg font-bold text-primary">{formatCurrency(reportTotals.revenue.toFixed(3))}</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2 pt-3 px-3">
                                        <CardTitle className="text-xs text-muted-foreground">{t('orders.paid')}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="px-3 pb-3">
                                        <p className="text-lg font-bold">{formatCurrency(reportTotals.paid.toFixed(3))}</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2 pt-3 px-3">
                                        <CardTitle className="text-xs text-muted-foreground">{t('orders.total')}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="px-3 pb-3">
                                        <p className="text-lg font-bold">{reportTotals.count}</p>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => openReport('today')} className={reportPeriod === 'today' ? 'border-primary text-primary' : ''}>
                                    {t('reports.today')}
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => openReport('week')} className={reportPeriod === 'week' ? 'border-primary text-primary' : ''}>
                                    {t('reports.thisWeek')}
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => openReport('month')} className={reportPeriod === 'month' ? 'border-primary text-primary' : ''}>
                                    {t('reports.thisMonth')}
                                </Button>
                                <div className="flex-1" />
                                <Button size="sm" onClick={printReport}>
                                    <Printer className="h-4 w-4 mr-1" />
                                    {t('billing.print')}
                                </Button>
                            </div>

                            <div className="max-h-64 overflow-y-auto overflow-x-auto border rounded-lg">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50 sticky top-0">
                                        <tr>
                                            <th className="text-left p-2.5 font-medium text-xs text-muted-foreground uppercase">N°</th>
                                            <th className="text-left p-2.5 font-medium text-xs text-muted-foreground uppercase">{t('orders.client')}</th>
                                            <th className="text-left p-2.5 font-medium text-xs text-muted-foreground uppercase">{t('orders.type')}</th>
                                            <th className="text-right p-2.5 font-medium text-xs text-muted-foreground uppercase">{t('orders.total')}</th>
                                            <th className="text-right p-2.5 font-medium text-xs text-muted-foreground uppercase">{t('orders.paid')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {reportData.map((r) => (
                                            <tr key={r.id} className="hover:bg-muted/20">
                                                <td className="p-2.5 font-medium">#{r.orderNumber}</td>
                                                <td className="p-2.5">{r.client.name} {r.client.familyName}</td>
                                                <td className="p-2.5 text-muted-foreground">{typeLabel(r.orderType)}</td>
                                                <td className="p-2.5 text-right font-medium">{formatCurrency(r.totalAmount)}</td>
                                                <td className="p-2.5 text-right">{formatCurrency(r.totalPaid)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : null}
                </DialogContent>
            </Dialog>
        </div>
    )
}
