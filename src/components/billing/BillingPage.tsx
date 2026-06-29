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
            const params = new URLSearchParams()
            if (debouncedSearch) params.set('search', debouncedSearch)
            if (statusFilter) params.set('status', statusFilter)
            const res = await fetch(`/api/billing?${params}`)
            if (res.ok) setRecords(await res.json())
            setLoading(false)
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
        const { client, items, payments, repairs, totalAmount, totalPaid, balance, paymentStatus, createdAt } = selected
        const isFullyPaid = paymentStatus === 'fullyPaid'
        const itemRows = items.map((i) =>
            `<tr><td style="padding:8px 12px">${i.productName} (${i.brand})</td><td style="padding:8px 12px;text-align:center">${i.quantity}</td><td style="padding:8px 12px;text-align:right">${formatCurrency(i.unitPrice)}</td><td style="padding:8px 12px;text-align:right;font-weight:600">${formatCurrency((parseFloat(i.unitPrice) * i.quantity).toFixed(3))}</td></tr>`
        ).join('')
        const repairRows = repairs.map((r) =>
            `<tr><td style="padding:8px 12px">${r.type}</td><td style="padding:8px 12px;text-align:center">1</td><td style="padding:8px 12px;text-align:right">${formatCurrency(r.price)}</td><td style="padding:8px 12px;text-align:right;font-weight:600">${formatCurrency(r.price)}</td></tr>`
        ).join('')
        const paymentRows = payments.map((p) =>
            `<tr><td style="padding:8px 12px">${p.type === 'deposit' ? 'Deposit' : p.type === 'balance' ? 'Balance' : 'Full Payment'}</td><td style="padding:8px 12px;text-align:right">${formatCurrency(p.amount)}</td><td style="padding:8px 12px">${new Date(p.createdAt).toLocaleDateString('en-US')}</td></tr>`
        ).join('')
        const subtotal = items.reduce((s, i) => s + parseFloat(i.unitPrice) * i.quantity, 0)
        const repairTotal = repairs.reduce((s, r) => s + parseFloat(r.price), 0)
        const grand = subtotal + repairTotal
        printWindow.document.write(`<!DOCTYPE html><html><head><title>Invoice - Sofien Optic</title>
            <style>
                *{margin:0;padding:0;box-sizing:border-box}
                body{font-family:'Segoe UI',Arial,sans-serif;max-width:700px;margin:0 auto;padding:40px 32px;color:#1a1a2e}
                .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;padding-bottom:24px;border-bottom:2px solid #1a1a2e}
                .shop h1{font-size:22px;font-weight:700;color:#1a1a2e}
                .shop p{font-size:13px;color:#666;margin-top:2px}
                .invoice-meta{text-align:right;font-size:13px}
                .invoice-meta h2{font-size:18px;font-weight:600;margin-bottom:4px}
                .invoice-meta p{color:#555;line-height:1.6}
                .bill-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:28px}
                .bill-grid .label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#888;margin-bottom:6px}
                .bill-grid .name{font-size:15px;font-weight:500;color:#1a1a2e;margin-bottom:4px}
                .bill-grid .detail{font-size:13px;color:#555;line-height:1.6}
                table{width:100%;border-collapse:collapse;margin-bottom:20px}
                th{padding:12px;text-align:left;font-size:13px;font-weight:600;color:#555;border-top:1px solid #ddd;border-bottom:1px solid #ddd}
                th:last-child{text-align:right}
                td{padding:12px;border-bottom:1px solid #eee;font-size:13px}
                td:last-child{text-align:right;font-weight:600}
                .summary{width:300px;margin-left:auto;margin-bottom:24px}
                .summary .row{display:flex;justify-content:space-between;padding:8px 0;font-size:13px;color:#555}
                .summary .total{border-top:2px solid #1a1a2e;padding-top:10px;margin-top:4px;font-size:16px;font-weight:600;color:#1a1a2e}
                .paid-box{display:flex;align-items:center;gap:8px;padding:12px 16px;background:#f0fdf4;border-radius:8px;border-left:3px solid #16a34a;font-size:13px;font-weight:500;color:#166534;margin-bottom:24px}
                .footer{text-align:center;margin-top:32px;padding-top:16px;border-top:1px solid #e0e0e0;font-size:11px;color:#999}
                @media print{button{display:none}}
</style></head><body>
            <div class="header">
                <div class="shop"><h1>Sofien Optic</h1><p>Tunis, Tunisia<br>ID: 1234567890</p></div>
                <div class="invoice-meta"><h2>Invoice #ORD-${('0000' + selected.orderNumber).slice(-4)}</h2><p>Issued ${formatDate(createdAt)}</p></div>
            </div>
            <div class="bill-grid">
                <div>
                    <div class="label">BILL TO</div>
                    <div class="name">${client.name} ${client.familyName}</div>
                    <div class="detail">Phone: ${client.phone}</div>
                </div>
                <div>
                    <div class="label">SHOP DETAILS</div>
                    <div class="name">Sofien Optic</div>
                    <div class="detail">Tunis, TN<br>ID: 1234567890</div>
                </div>
            </div>
            ${(items.length || repairs.length) ? `<table><thead><tr><th style="width:45%">Description</th><th style="width:12%;text-align:center">Qty</th><th style="width:20%;text-align:right">Unit price</th><th style="width:23%;text-align:right">Total</th></tr></thead><tbody>${itemRows}${repairRows}</tbody></table>` : ''}
            <div class="summary">
                <div class="row"><span>Subtotal</span><span>${formatCurrency(grand.toFixed(3))}</span></div>
                <div class="row"><span>Tax (0%)</span><span>0.000 TND</span></div>
                <div class="row total"><span>Total due</span><span>${formatCurrency(totalAmount)}</span></div>
            </div>
            ${isFullyPaid ? `<div class="paid-box"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>Paid in full on ${formatDate(createdAt)}</div>` : ''}
            ${paymentRows ? `<div><h4 style="font-size:13px;font-weight:600;margin-bottom:8px;color:#1a1a2e">Payment History</h4><table><thead><tr><th>Type</th><th style="text-align:right">Amount</th><th>Date</th></tr></thead><tbody>${paymentRows}</tbody></table></div>` : ''}
            <div class="footer">Sofien Optic — Thank you for your trust</div>
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
                    {selected && (
                        <div className="py-4">
                            {/* Header: invoice number + date + buttons */}
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <DialogTitle className="text-[22px] font-medium">
                                        Invoice #ORD-{('0000' + selected.orderNumber).slice(-4)}
                                    </DialogTitle>
                                    <p className="text-sm text-muted-foreground mt-1">Issued {formatDate(selected.createdAt)}</p>
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

                            {/* Invoice Card */}
                            <div className="border rounded-xl bg-card p-6 space-y-6">

                                {/* Bill To & Shop Details */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <p className="text-[11px] font-bold uppercase tracking-[0.5px] text-muted-foreground mb-1.5">BILL TO</p>
                                        <p className="text-[15px] font-medium text-foreground mb-1">{selected.client.name} {selected.client.familyName}</p>
                                        <div className="text-sm text-muted-foreground leading-relaxed">
                                            <p>Phone: {selected.client.phone}</p>
                                            {selected.client.address && <p>Address: {selected.client.address}</p>}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-bold uppercase tracking-[0.5px] text-muted-foreground mb-1.5">SHOP DETAILS</p>
                                        <p className="text-[15px] font-medium text-foreground mb-1">Sofien Optic</p>
                                        <div className="text-sm text-muted-foreground leading-relaxed">
                                            <p>Tunis, TN</p>
                                            <p>ID: 1234567890</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Line Items Table */}
                                {(selected.items.length > 0 || selected.repairs.length > 0) && (
                                    <div>
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-y">
                                                    <th className="text-left py-3 text-sm font-medium text-muted-foreground" style={{width:'45%'}}>Description</th>
                                                    <th className="text-right py-3 text-sm font-medium text-muted-foreground" style={{width:'12%'}}>Qty</th>
                                                    <th className="text-right py-3 text-sm font-medium text-muted-foreground" style={{width:'20%'}}>Unit price</th>
                                                    <th className="text-right py-3 text-sm font-medium text-muted-foreground" style={{width:'23%'}}>Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {selected.items.map((item, i) => (
                                                    <tr key={i} className="text-sm">
                                                        <td className="py-3 text-foreground font-medium">{item.productName} <span className="text-muted-foreground font-normal">({item.brand})</span></td>
                                                        <td className="py-3 text-right">{item.quantity}</td>
                                                        <td className="py-3 text-right">{formatCurrency(item.unitPrice)}</td>
                                                        <td className="py-3 text-right font-semibold">{formatCurrency((parseFloat(item.unitPrice) * item.quantity).toFixed(3))}</td>
                                                    </tr>
                                                ))}
                                                {selected.repairs.map((r, i) => (
                                                    <tr key={`repair-${i}`} className="text-sm">
                                                        <td className="py-3 text-foreground font-medium">{r.type}</td>
                                                        <td className="py-3 text-right">1</td>
                                                        <td className="py-3 text-right">{formatCurrency(r.price)}</td>
                                                        <td className="py-3 text-right font-semibold">{formatCurrency(r.price)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {/* Summary Totals */}
                                <div className="flex justify-end">
                                    <div className="w-full sm:w-[300px] space-y-2">
                                        <div className="flex justify-between text-sm text-muted-foreground border-b pb-2">
                                            <span>Subtotal</span>
                                            <span>{formatCurrency(selected.totalAmount)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm text-muted-foreground">
                                            <span>Tax (0%)</span>
                                            <span>0.000 TND</span>
                                        </div>
                                        <div className="flex justify-between text-base font-semibold text-foreground border-t-2 pt-2.5">
                                            <span>Total due</span>
                                            <span>{formatCurrency(selected.totalAmount)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Status */}
                                {selected.paymentStatus === 'fullyPaid' && (
                                    <div className="flex items-center gap-2.5 p-3 rounded-lg border-l-[3px] border-l-green-600 bg-green-50 dark:bg-green-950/20 text-sm font-medium text-green-700 dark:text-green-400">
                                        <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                                        Paid in full on {formatDate(selected.createdAt)}
                                    </div>
                                )}

                                {/* Payment History */}
                                {selected.payments.length > 0 && (
                                    <div>
                                        <p className="text-sm font-semibold text-foreground mb-2">Payment History</p>
                                        <div className="space-y-1">
                                            {selected.payments.map((p, i) => (
                                                <div key={i} className="flex justify-between p-2.5 bg-muted/30 rounded-lg border text-xs">
                                                    <span>{p.type === 'deposit' ? 'Deposit' : p.type === 'balance' ? 'Balance Payment' : 'Full Payment'} — {new Date(p.createdAt).toLocaleDateString('en-US')}</span>
                                                    <span className="font-medium">{formatCurrency(p.amount)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
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

                            <div className="max-h-64 overflow-y-auto border rounded-lg">
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
