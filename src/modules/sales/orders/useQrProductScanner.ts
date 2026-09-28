'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import { Html5Qrcode } from 'html5-qrcode'
import { lookupQRCode } from '@/modules/system/qrcode/qrcode.api'
import type { Product } from './order-form.types'

export function useQrProductScanner(onScan: (product: Product) => void) {
    const [qrScanOpen, setQrScanOpen] = useState(false)
    const [qrScanning, setQrScanning] = useState(false)
    const [qrError, setQrError] = useState('')
    const qrReaderId = 'qr-reader-scanner'
    const html5QrRef = useRef<unknown>(null)
    const mountedRef = useRef(false)

    const addItem = useCallback((product: Product) => {
        onScan(product)
    }, [onScan])

    useEffect(() => {
        mountedRef.current = true
        return () => { mountedRef.current = false }
    }, [])

    useEffect(() => {
        if (!qrScanOpen) return
        let cancelled = false
        let reader: Html5Qrcode | null = null

        // html5-qrcode's stop() throws SYNCHRONOUSLY when the scanner was never
        // started (e.g. camera permission cancelled) — .catch() can't help.
        function safeStopScanner(target: Html5Qrcode | null) {
            if (!target) return
            try {
                target.stop().catch(() => {})
            } catch {
                /* scanner not running — nothing to stop */
            }
        }

        async function handleQrScan(result: string) {
            setQrScanning(false)
            try {
                const data = await lookupQRCode(result)
                if (!data.product) { toast.error('Product not found'); return }
                addItem(data.product)
                toast.success(`${data.product.name} added`)
                setQrScanOpen(false)
            } catch {
                toast.error('Failed to look up QR code')
            }
        }

        async function start() {
            try {
                reader = new Html5Qrcode(qrReaderId)
                html5QrRef.current = reader
                if (cancelled || !mountedRef.current) { safeStopScanner(reader); return }
                setQrScanning(true)
                await reader.start(
                    { facingMode: 'environment' },
                    { fps: 10, qrbox: { width: 250, height: 250 } },
                    (decodedText: string) => {
                        if (!cancelled && mountedRef.current) {
                            cancelled = true
                            safeStopScanner(reader)
                            handleQrScan(decodedText)
                        }
                    },
                    () => {},
                )
            } catch (err) {
                if (!cancelled && mountedRef.current) {
                    setQrError(err instanceof Error ? err.message : 'Camera access denied or not available')
                    setQrScanning(false)
                }
            }
        }

        const timer = setTimeout(start, 300)

        return () => {
            clearTimeout(timer)
            setQrScanning(false)
            setQrError('')
            safeStopScanner(reader)
            html5QrRef.current = null
        }
    }, [qrScanOpen, addItem])

    function openQrScan() {
        setQrScanOpen(true)
    }

    function closeQrScan() {
        setQrScanOpen(false)
        setQrScanning(false)
        setQrError('')
    }

    return { qrScanOpen, openQrScan, closeQrScan, qrScanning, qrError, qrReaderId }
}
