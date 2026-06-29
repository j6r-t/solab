'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslation } from '@/hooks/useTranslation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Receipt, Search, Printer, ShoppingCart, FileBarChart, Calendar, DollarSign } from 'lucide-react'
import { OrderForm, type OrderFormData } from '@/components/orders/OrderForm'
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
    const invoiceRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        async function load() {
            const params = new URLSearchParams()
            if (search) params.set('search', search)
            if (statusFilter) params.set('status', statusFilter)
            const res = await fetch(`/api/billing?${params}`)
            if (res.ok) setRecords(await res.json())
        }
        load()
    }, [search, statusFilter])

    function formatTND(amount: string): string {
        return parseFloat(amount).toFixed(3) + ' TND'
    }

    function formatDate(dateStr: string): string {
        return new Date(dateStr).toLocaleDateString('fr-TN', { day: 'numeric', month: 'short', year: 'numeric' })
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
            `<tr><td style="padding:6px 10px">${i.productName} (${i.brand})</td><td style="padding:6px 10px;text-align:center">${i.quantity}</td><td style="padding:6px 10px;text-align:right">${formatTND(i.unitPrice)}</td></tr>`
        ).join('')
        const repairRows = repairs.map((r) =>
            `<tr><td style="padding:6px 10px">${r.type}</td><td style="padding:6px 10px;text-align:center">1</td><td style="padding:6px 10px;text-align:right">${formatTND(r.price)}</td></tr>`
        ).join('')
        const paymentRows = payments.map((p) =>
            `<tr><td style="padding:6px 10px">${p.type === 'deposit' ? 'Acompte' : p.type === 'balance' ? 'Solde' : 'Paiement complet'}</td><td style="padding:6px 10px;text-align:right">${formatTND(p.amount)}</td><td style="padding:6px 10px">${new Date(p.createdAt).toLocaleDateString('fr-TN')}</td></tr>`
        ).join('')
        printWindow.document.write(`<!DOCTYPE html><html><head><title>Facture Sofien Optic</title>
            <style>
                *{margin:0;padding:0;box-sizing:border-box}
                body{font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;color:#1a1a2e}
                .header{display:flex;align-items:center;gap:16px;margin-bottom:28px;padding-bottom:20px;border-bottom:3px solid #519651}
                .logo{width:48px;height:48px;background:#519651;border-radius:12px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:24px;font-weight:bold;flex-shrink:0}
                .shop-name{font-size:22px;font-weight:700;color:#519651}
                .shop-sub{font-size:12px;color:#666}
                .meta{display:flex;justify-content:space-between;margin-bottom:20px;font-size:13px;color:#555}
                .meta strong{color:#1a1a2e}
                table{width:100%;border-collapse:collapse;margin-bottom:16px;font-size:13px}
                th{background:#519651;color:#fff;padding:8px 10px;text-align:left;font-weight:600}
                td{padding:8px 10px;border-bottom:1px solid #e8e8e8}
                tr:last-child td{border-bottom:none}
                .totals-box{margin-top:20px;padding:16px;background:#f0f9f0;border-radius:8px;border:1px solid #c8e6c9}
                .totals-box .row{display:flex;justify-content:space-between;padding:4px 0;font-size:13px}
                .totals-box .grand-total{font-size:16px;font-weight:700;color:#519651;border-top:2px solid #519651;padding-top:8px;margin-top:8px}
                .payment-history{margin-top:20px}
                .payment-history h4{font-size:13px;font-weight:600;margin-bottom:8px;color:#519651}
                .footer{text-align:center;margin-top:32px;padding-top:16px;border-top:1px solid #e0e0e0;font-size:11px;color:#999}
                .print-btn{display:block;width:fit-content;margin:20px auto;padding:10px 32px;background:#519651;color:#fff;border:none;border-radius:8px;font-size:14px;cursor:pointer}
                .print-btn:hover{background:#3d7a3d}
                .balance-due{color:#dc2626;font-weight:600}
                @media print{.print-btn{display:none;}}
            </style></head><body>
            <button class="print-btn" onclick="window.print()">Imprimer</button>
            <div class="header">
                <div class="logo">SO</div>
                <div>
                    <div class="shop-name">Sofien Optic</div>
                    <div class="shop-sub">Tunis, Tunisie</div>
                </div>
            </div>
            <div class="meta">
                <div><strong>Client :</strong> ${client.name} ${client.familyName}<br><strong>Tél :</strong> ${client.phone}${client.address ? `<br><strong>Adresse :</strong> ${client.address}` : ''}</div>
                <div style="text-align:right"><strong>Date :</strong> ${new Date(createdAt).toLocaleDateString('fr-TN')}</div>
            </div>
            ${items.length ? `<table><thead><tr><th>Article</th><th>Qté</th><th>Prix</th></tr></thead><tbody>${itemRows}</tbody></table>` : ''}
            ${repairs.length ? `<table><thead><tr><th>Service</th><th>Qté</th><th>Prix</th></tr></thead><tbody>${repairRows}</tbody></table>` : ''}
            <div class="totals-box">
                <div class="row"><span>Total</span><strong>${formatTND(totalAmount)}</strong></div>
                <div class="row"><span>Payé</span><span>${formatTND(totalPaid)}</span></div>
                ${!isFullyPaid ? `<div class="row"><span>Reste à payer</span><span class="balance-due">${formatTND(balance)}</span></div>` : '<div class="row"><span>Statut</span><span style="color:#519651;font-weight:600">Payé</span></div>'}
            </div>
            ${paymentRows ? `<div class="payment-history"><h4>Historique des paiements</h4><table><thead><tr><th>Type</th><th>Montant</th><th>Date</th></tr></thead><tbody>${paymentRows}</tbody></table></div>` : ''}
            <div class="footer">Sofien Optic — Merci de votre confiance</div>
            </body></html>`)
        printWindow.document.close()
    }

    function printReport() {
        if (!reportData || !reportTotals) return
        const printWindow = window.open('', '_blank')
        if (!printWindow) return
        const periodLabel = reportPeriod === 'today' ? "Aujourd'hui" : reportPeriod === 'week' ? 'Cette semaine' : 'Ce mois'
        const orderRows = reportData.map((r) =>
            `<tr><td style="padding:6px 10px">#${r.orderNumber}</td><td style="padding:6px 10px">${r.client.name} ${r.client.familyName}</td><td style="padding:6px 10px">${typeLabel(r.orderType)}</td><td style="padding:6px 10px;text-align:right">${formatTND(r.totalAmount)}</td><td style="padding:6px 10px;text-align:right">${formatTND(r.totalPaid)}</td></tr>`
        ).join('')
        printWindow.document.write(`<!DOCTYPE html><html><head><title>Rapport ${periodLabel} — Sofien Optic</title>
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
                .print-btn{display:block;width:fit-content;margin:20px auto;padding:10px 32px;background:#519651;color:#fff;border:none;border-radius:8px;font-size:14px;cursor:pointer}
                @media print{.print-btn{display:none}}
            </style></head><body>
            <button class="print-btn" onclick="window.print()">Imprimer</button>
            <div class="header">
                <div class="logo">SO</div>
                <div><div class="shop-name">Sofien Optic</div></div>
            </div>
            <h2>Rapport — ${periodLabel}</h2>
            <div class="summary">
                <div class="summary-card revenue"><div>Chiffre d'affaires</div><div class="value">${formatTND(reportTotals.revenue.toFixed(3))}</div></div>
                <div class="summary-card paid"><div>Total encaissé</div><div class="value">${formatTND(reportTotals.paid.toFixed(3))}</div></div>
                <div class="summary-card count"><div>Nombre de commandes</div><div class="value">${reportTotals.count}</div></div>
            </div>
            <table><thead><tr><th>N°</th><th>Client</th><th>Type</th><th>Total</th><th>Payé</th></tr></thead><tbody>${orderRows}</tbody></table>
            <div class="footer">Sofien Optic — Rapport généré le ${new Date().toLocaleDateString('fr-TN')}</div>
            </body></html>`)
        printWindow.document.close()
    }

    async function handleQuickSale(data: OrderFormData) {
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
            setQuickSaleOpen(false)
            const params = new URLSearchParams()
            if (search) params.set('search', search)
            if (statusFilter) params.set('status', statusFilter)
            const refresh = await fetch(`/api/billing?${params}`)
            if (refresh.ok) setRecords(await refresh.json())
            toast.success(t('billing.quickSaleSuccess'))
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Quick sale failed')
        }
    }

    return (
        <div className="space-y-4">
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
                        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>{t('billing.quickSale')}</DialogTitle>
                            </DialogHeader>
                            <OrderForm
                                onSubmit={handleQuickSale}
                                onCancel={() => setQuickSaleOpen(false)}
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

            {records.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 rounded-xl empty-state-gradient text-muted-foreground">
                    <Receipt className="h-12 w-12 mb-4 opacity-50" />
                    <p>{t('billing.noInvoices')}</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {records.map((r) => (
                        <button
                            key={r.id}
                            onClick={() => setSelected(r)}
                            className="w-full flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent transition-colors text-left row-alternate"
                        >
                            <div>
                                <p className="font-medium">#{r.orderNumber} — {r.client.name} {r.client.familyName}</p>
                                <p className="text-xs text-muted-foreground">{typeLabel(r.orderType)} · {r.items.length} articles · {formatDate(r.createdAt)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="text-right text-sm">
                                    <p className="font-medium">{formatTND(r.totalAmount)}</p>
                                    {r.balance !== '0.000' && (
                                        <p className="text-xs text-muted-foreground">{t('orders.balance')}: {formatTND(r.balance)}</p>
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
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{t('nav.billing')} #{selected?.orderNumber}</DialogTitle>
                    </DialogHeader>
                    {selected && (
                        <div ref={invoiceRef} className="space-y-4 text-sm">
                            <div className="text-center border-b pb-3">
                                <div className="flex items-center justify-center gap-3 mb-1">
                                    <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg shrink-0">
                                        SO
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-lg text-primary">Sofien Optic</p>
                                        <p className="text-xs text-muted-foreground">Tunis, Tunisie</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <p className="text-muted-foreground text-xs">{t('orders.client')}</p>
                                    <p className="font-medium">{selected.client.name} {selected.client.familyName}</p>
                                    <p className="text-xs text-muted-foreground">{selected.client.phone}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-muted-foreground text-xs">{t('billing.date')}</p>
                                    <p>{formatDate(selected.createdAt)}</p>
                                </div>
                            </div>

                            {selected.items.length > 0 && (
                                <div>
                                    <p className="font-semibold mb-1 text-primary text-xs uppercase tracking-wider">{t('orders.items')}</p>
                                    <div className="space-y-1">
                                        {selected.items.map((item, i) => (
                                            <div key={i} className="flex justify-between p-2.5 bg-muted/30 rounded-lg border">
                                                <span className="font-medium">{item.productName} <span className="font-normal text-muted-foreground">({item.brand})</span> <span className="text-muted-foreground">×{item.quantity}</span></span>
                                                <span>{formatTND(item.unitPrice)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selected.repairs.length > 0 && (
                                <div>
                                    <p className="font-semibold mb-1 text-primary text-xs uppercase tracking-wider">{t('nav.repairs')}</p>
                                    <div className="space-y-1">
                                        {selected.repairs.map((r, i) => (
                                            <div key={i} className="flex justify-between p-2.5 bg-muted/30 rounded-lg border">
                                                <span>{r.type}</span>
                                                <span>{formatTND(r.price)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="rounded-lg border border-primary/20 bg-primary/[0.03] p-4 space-y-1.5">
                                <div className="flex justify-between font-semibold text-base">
                                    <span>{t('orders.total')}</span>
                                    <span className="text-primary">{formatTND(selected.totalAmount)}</span>
                                </div>
                                <div className="flex justify-between text-muted-foreground">
                                    <span>{t('orders.paid')}</span>
                                    <span>{formatTND(selected.totalPaid)}</span>
                                </div>
                                {selected.balance !== '0.000' && (
                                    <div className="flex justify-between text-destructive font-medium">
                                        <span>{t('orders.balance')}</span>
                                        <span>{formatTND(selected.balance)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center pt-1">
                                    <span className="text-muted-foreground">{t('orders.payment')}</span>
                                    <Badge variant={paymentColors[selected.paymentStatus]}>{t(`orders.${selected.paymentStatus}`)}</Badge>
                                </div>
                            </div>

                            {selected.payments.length > 0 && (
                                <div>
                                    <p className="font-semibold mb-1 text-primary text-xs uppercase tracking-wider">{t('orders.paymentHistory')}</p>
                                    <div className="space-y-1">
                                        {selected.payments.map((p, i) => (
                                            <div key={i} className="flex justify-between p-2.5 bg-muted/30 rounded-lg border text-xs">
                                                <span>{p.type === 'deposit' ? t('orders.deposit') : p.type === 'balance' ? t('orders.balancePayment') : t('orders.full')} — {formatDate(p.createdAt)}</span>
                                                <span className="font-medium">{formatTND(p.amount)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <Button size="sm" variant="default" className="w-full gap-2" onClick={printInvoice}>
                                <Printer className="h-4 w-4" />
                                {t('billing.print')}
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Period Report Dialog */}
            <Dialog open={reportOpen} onOpenChange={(o) => { if (!o) setReportData(null); setReportOpen(o) }}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                                        <p className="text-lg font-bold text-primary">{formatTND(reportTotals.revenue.toFixed(3))}</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2 pt-3 px-3">
                                        <CardTitle className="text-xs text-muted-foreground">{t('orders.paid')}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="px-3 pb-3">
                                        <p className="text-lg font-bold">{formatTND(reportTotals.paid.toFixed(3))}</p>
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
                                                <td className="p-2.5 text-right font-medium">{formatTND(r.totalAmount)}</td>
                                                <td className="p-2.5 text-right">{formatTND(r.totalPaid)}</td>
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
