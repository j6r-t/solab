'use client'

import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Camera, Loader2, X } from 'lucide-react'

interface QrScanDialogProps {
    open: boolean
    onClose: () => void
    qrScanning: boolean
    qrError: string
    qrReaderId: string
    t: (key: string) => string
}

export function QrScanDialog({ open, onClose, qrScanning, qrError, qrReaderId, t }: QrScanDialogProps) {
    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Camera className="h-4 w-4" />
                        Scan QR Code
                    </DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center gap-3 py-2">
                    <div id={qrReaderId} className="w-full" />
                    {qrError && (
                        <p className="text-sm text-destructive text-center">{qrError}</p>
                    )}
                    {!qrScanning && !qrError && (
                        <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                            <Loader2 className="h-6 w-6 animate-spinner" />
                            <p className="text-sm">Starting camera...</p>
                        </div>
                    )}
                    <Button type="button" variant="outline" size="sm" onClick={onClose}>
                        <X className="h-4 w-4 mr-1" />
                        {t('common.cancel')}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
