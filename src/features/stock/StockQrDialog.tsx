'use client'

import { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { Printer, Loader2 } from 'lucide-react'
import type { StockProduct } from './stock.api'
import QRCodeLib from 'qrcode'
import { toast } from 'sonner'

interface Props {
    product: StockProduct | null
    onClose: () => void
}

const BASE = 60
const STRAP_W = BASE / 6
const STRAP_H = BASE * 1.5
const TOTAL_H = STRAP_H + BASE
const PAD = BASE * 0.08
const QR_SZ = BASE * 0.7
const QR_X = (BASE - QR_SZ) / 2
const QR_Y = STRAP_H + (BASE - QR_SZ) * 0.35
const BRACKET_SIZE = 7
const BRACKET_STROKE = 1.6
const REF_FONT_SIZE = 0.8

function tagOutlinePath(): string {
    const sl = (BASE - STRAP_W) / 2
    const sr = sl + STRAP_W
    return `M ${sl},0 L ${sr},0 L ${sr},${STRAP_H} L ${BASE},${STRAP_H} L ${BASE},${TOTAL_H} L 0,${TOTAL_H} L 0,${STRAP_H} L ${sl},${STRAP_H} Z`
}

function bracketPaths(): string[] {
    const qrR = QR_X + QR_SZ
    const qrB = QR_Y + QR_SZ
    const bs = BRACKET_SIZE
    return [
        // top-left
        `M ${QR_X},${QR_Y} L ${QR_X + bs},${QR_Y} M ${QR_X},${QR_Y} L ${QR_X},${QR_Y + bs}`,
        // top-right
        `M ${qrR},${QR_Y} L ${qrR - bs},${QR_Y} M ${qrR},${QR_Y} L ${qrR},${QR_Y + bs}`,
        // bottom-left
        `M ${QR_X},${qrB} L ${QR_X + bs},${qrB} M ${QR_X},${qrB} L ${QR_X},${qrB - bs}`,
        // bottom-right
        `M ${qrR},${qrB} L ${qrR - bs},${qrB} M ${qrR},${qrB} L ${qrR},${qrB - bs}`,
    ]
}

function buildPrintSvg(qrDataUrl: string, code: string): string {
    const brackets = bracketPaths()
    return `<svg viewBox="0 0 ${BASE} ${TOTAL_H}" xmlns="http://www.w3.org/2000/svg" width="${BASE}mm" height="${TOTAL_H}mm">
  <path d="${tagOutlinePath()}" fill="#fff" stroke="#000" stroke-width="0.5" stroke-linejoin="round" />
  <image href="${qrDataUrl}" x="${QR_X}" y="${QR_Y}" width="${QR_SZ}" height="${QR_SZ}" />
  ${brackets.map(d => `<path d="${d}" fill="none" stroke="#000" stroke-width="${BRACKET_STROKE}" stroke-linecap="round" stroke-linejoin="round" />`).join('\n  ')}
  <text x="${BASE / 2}" y="${TOTAL_H - PAD}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="${REF_FONT_SIZE}mm" font-weight="700">ref: ${code}</text>
</svg>`
}

export function StockQrDialog({ product, onClose }: Props) {
    const { t } = useTranslation()
    const [qrDataUrl, setQrDataUrl] = useState<string>('')
    const [generating, setGenerating] = useState(false)

    useEffect(() => {
        if (product?.qrcode?.code) {
            setGenerating(true)
            QRCodeLib.toDataURL(product.qrcode.code, {
                width: 400,
                margin: 1,
                color: { dark: '#000', light: '#fff' },
                errorCorrectionLevel: 'M',
            })
                .then(setQrDataUrl)
                .catch(() => setQrDataUrl(''))
                .finally(() => setGenerating(false))
        } else {
            setQrDataUrl('')
        }
    }, [product])

    const handlePrint = useCallback(() => {
        if (!product || !qrDataUrl) return
        const code = product.qrcode?.code || ''

        const svgContent = buildPrintSvg(qrDataUrl, code)

        const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>QR Label — ${product.name}</title>
<style>
  @page { size: auto; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    display: flex; align-items: center; justify-content: center;
    min-height: 100vh; background: #7F7F7F;
  }
</style>
</head>
<body>
${svgContent}
</body>
</html>`

        const win = window.open('', '_blank', 'width=500,height=800')
        if (win) {
            win.document.write(html)
            win.document.close()
            win.focus()
            setTimeout(() => {
                try { win.print() } catch { /* user may cancel */ }
            }, 400)
        } else {
            toast.error('Please allow popups for this site to print labels.')
        }
    }, [product, qrDataUrl])

    const previewScale = 3

    return (
        <Dialog open={!!product} onOpenChange={(open) => { if (!open) onClose() }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{t('stock.qrCode')} — {product?.name}</DialogTitle>
                </DialogHeader>
                {product?.qrcode?.code && (
                    <div className="flex flex-col items-center gap-4 py-4">
                        <div className="bg-[#7F7F7F] p-6 rounded-lg w-full flex items-center justify-center overflow-auto">
                            {generating ? (
                                <Loader2 className="h-6 w-6 animate-spinner text-white" />
                            ) : qrDataUrl ? (
                                <svg
                                    viewBox={`0 0 ${BASE} ${TOTAL_H}`}
                                    width={BASE * previewScale}
                                    style={{ display: 'block' }}
                                >
                                    <path d={tagOutlinePath()} fill="#fff" stroke="#000" strokeWidth="0.5" strokeLinejoin="round" />
                                    <image href={qrDataUrl} x={QR_X} y={QR_Y} width={QR_SZ} height={QR_SZ} />
                                    {bracketPaths().map((d, i) => (
                                        <path key={i} d={d} fill="none" stroke="#000" strokeWidth={BRACKET_STROKE} strokeLinecap="round" strokeLinejoin="round" />
                                    ))}
                                    <text x={BASE / 2} y={TOTAL_H - PAD} textAnchor="middle" fontFamily="Arial,Helvetica,sans-serif" fontSize={`${REF_FONT_SIZE}mm`} fontWeight="700">
                                        ref: {product.qrcode.code}
                                    </text>
                                </svg>
                            ) : (
                                <p className="text-sm text-white">Failed to generate QR code</p>
                            )}
                        </div>

                        <Button onClick={handlePrint} disabled={generating || !qrDataUrl}>
                            <Printer className="h-4 w-4 mr-2" />
                            Print Label
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
