'use client'

import { useState } from 'react'
import { Button } from './button'
import { ConfirmDialog } from './confirm-dialog'
import { Download } from 'lucide-react'
import { useTranslation } from '@/lib/hooks/useTranslation'

interface Props {
    url: string
}

export function ExportButton({ url }: Props) {
    const { t } = useTranslation()
    const [open, setOpen] = useState(false)

    return (
        <>
            <Button variant="outline" onClick={() => setOpen(true)}>
                <Download className="h-4 w-4 mr-2" />
                {t('common.export')}
            </Button>
            <ConfirmDialog
                open={open}
                onOpenChange={setOpen}
                title={t('common.export')}
                description="Are you sure you want to export all data?"
                confirmLabel={t('common.export')}
                onConfirm={() => {
                    const a = document.createElement('a')
                    a.href = url
                    a.download = ''
                    a.click()
                    setOpen(false)
                }}
            />
        </>
    )
}
