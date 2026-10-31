'use client'

import { useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { MobileNav } from './MobileNav'
import { DueChequesAlert } from '@/modules/sales/cheques/DueChequesAlert'

export function AppShell({ children }: { children: React.ReactNode }) {
    // "/" or Ctrl+K focuses the current view's search input — the one
    // accelerator counter staff reach for most.
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement | null
            const typing = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
            if ((e.key === '/' && !typing) || (e.key?.toLowerCase() === 'k' && (e.ctrlKey || e.metaKey))) {
                const inputs = Array.from(document.querySelectorAll('input[type="text"], input[type="search"], input:not([type])'))
                const search = inputs.find((i) => {
                    const el = i as HTMLInputElement
                    return el.offsetParent !== null && !el.closest('[role="dialog"]')
                }) as HTMLInputElement | undefined
                if (search) {
                    e.preventDefault()
                    search.focus()
                    search.select()
                }
            }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [])

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Header />
            <div className="flex flex-1">
                <Sidebar />
                <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6 overflow-auto">
                    {children}
                </main>
            </div>
            <MobileNav />
            <DueChequesAlert />
        </div>
    )
}