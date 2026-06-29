'use client'

import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { MobileNav } from './MobileNav'

export function AppShell({ children }: { children: React.ReactNode }) {
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
        </div>
    )
}