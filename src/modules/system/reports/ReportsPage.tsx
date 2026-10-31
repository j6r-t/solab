'use client'

import { Component, useEffect, useRef, useState, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useReports, type ShopReportData, type AtelierReportData } from './useReports'
import { ShopReports } from './ShopReports'
import { AtelierReports } from './AtelierReports'

/** A failed or crashed report shows a retryable card, never a white screen. */
function ReportLoadFailed({ onRetry, busy }: { onRetry: () => void; busy?: boolean }) {
    const { t } = useTranslation()
    return (
        <div className="space-y-6 max-w-6xl">
            <Card>
                <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                    <AlertTriangle className="h-8 w-8 text-amber-600" />
                    <div>
                        <p className="font-medium">{t('reports.loadFailed')}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{t('reports.loadFailedDesc')}</p>
                    </div>
                    <Button onClick={onRetry} disabled={busy}>
                        <RefreshCw className={`h-4 w-4 ${busy ? 'animate-spin' : ''}`} />
                        {t('reports.retry')}
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}

/**
 * Render errors (e.g. a stale cached payload missing a newer field) are
 * reported to the page, which swaps the view for the retry card — the
 * boundary itself holds no state, so a clean remount needs no reset.
 */
class ReportErrorBoundary extends Component<{ onError: () => void; children: ReactNode }> {
    componentDidCatch(error: unknown) {
        console.error('[reports] render failed', error)
        this.props.onError()
    }

    render() {
        return this.props.children
    }
}

export function ReportsPage() {
    const { user } = useAuthStore()
    const entity = user?.role === 'atelier' ? 'atelier' : 'shop'
    const [period, setPeriod] = useState('month')
    const [renderFailed, setRenderFailed] = useState(false)

    const { data, isError, isFetching, refetch } = useReports({ period, entity })
    const report = data ?? null

    // A fresh payload after a failure (retry or background refetch) gets
    // another chance before the fallback settles back in.
    const lastData = useRef(data)
    useEffect(() => {
        if (data && data !== lastData.current) {
            lastData.current = data
            setRenderFailed(false)
        }
    }, [data])

    if (isError || renderFailed) {
        return <ReportLoadFailed onRetry={() => void refetch()} busy={isFetching} />
    }

    const reportView = entity === 'atelier'
        ? <AtelierReports data={report as AtelierReportData} period={period} setPeriod={setPeriod} />
        : <ShopReports data={report as ShopReportData} period={period} setPeriod={setPeriod} />

    return <ReportErrorBoundary onError={() => setRenderFailed(true)}>{reportView}</ReportErrorBoundary>
}
