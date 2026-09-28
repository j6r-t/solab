'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileBarChart, DollarSign, Printer } from 'lucide-react'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { formatCurrency } from '@/lib/utils/currency'
import { printReport } from './billing.print'
import type { BillingRecord } from './billing.types'

interface Props {
    open: boolean
    onOpenChange: (open: boolean) => void
    reportPeriod: 'today' | 'week' | 'month'
    reportData: BillingRecord[] | null
    reportLoading: boolean
    onPeriodChange: (period: 'today' | 'week' | 'month') => void
}

export function BillingReportDialog({ open, onOpenChange, reportPeriod, reportData, reportLoading, onPeriodChange }: Props) {
    const { t } = useTranslation()

    const reportTotals = reportData ? reportData.reduce(
        (acc, r) => ({
            revenue: acc.revenue + parseFloat(r.totalAmount),
            paid: acc.paid + parseFloat(r.totalPaid),
            balance: acc.balance + parseFloat(r.balance),
            count: acc.count + 1,
        }),
        { revenue: 0, paid: 0, balance: 0, count: 0 }
    ) : null

    const typeLabel = (type: string) => {
        const labels: Record<string, string> = { standard: 'Standard', remounting: 'Remounting', direct_sale: 'Direct Sale' }
        return labels[type] || type
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
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
                            {(['today', 'week', 'month'] as const).map((p) => (
                                <Button key={p} size="sm" variant="outline" onClick={() => onPeriodChange(p)} className={reportPeriod === p ? 'border-primary text-primary' : ''}>
                                    {t(`reports.${p === 'week' ? 'thisWeek' : p === 'month' ? 'thisMonth' : 'today'}`)}
                                </Button>
                            ))}
                            <div className="flex-1" />
                            <Button size="sm" onClick={() => printReport(reportData, reportPeriod, typeLabel)}>
                                <Printer className="h-4 w-4 mr-1" />
                                {t('billing.print')}
                            </Button>
                        </div>

                        <div className="border rounded-lg overflow-x-auto overflow-y-auto max-h-[340px]">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-muted sticky top-0 z-10">
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
    )
}
