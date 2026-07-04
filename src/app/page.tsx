'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/stores/auth-store'
import { useViewStore } from '@/stores/view-store'
import { AppShell } from '@/components/layouts/AppShell'
import { DashboardPage } from '@/features/dashboard/dashboardPage'
import { ClientsPage } from '@/features/clients/ClientsPage'
import { StockPage } from '@/features/stock/StockPage'
import { PrescriptionsPage } from '@/features/prescriptions/PrescriptionsPage'
import { OrdersPage } from '@/features/orders/OrdersPage'
import { RepairsPage } from '@/features/repairs/RepairsPage'
import { BillingPage } from '@/features/billing/BillingPage'
import { ReportsPage } from '@/features/reports/ReportsPage'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { DoctorsPage } from '@/features/doctors/DoctorsPage'
import { FournisseursPage } from '@/features/fournisseurs/FournisseursPage'
import { QRCodePage } from '@/features/qrcode/QRCodePage'

const views: Record<string, React.FC> = {
  dashboard: DashboardPage,
  clients: ClientsPage,
  stock: StockPage,
  prescriptions: PrescriptionsPage,
  orders: OrdersPage,
  repairs: RepairsPage,
  billing: BillingPage,
  reports: ReportsPage,
  settings: SettingsPage,
  doctors: DoctorsPage,
  fournisseurs: FournisseursPage,
  qrcode: QRCodePage,
}

export default function Home() {
  const { isAuthenticated } = useAuthStore()
  const { currentView } = useViewStore()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push('/login')
    }
  }, [mounted, isAuthenticated, router])

  if (!mounted || !isAuthenticated) {
    return null
  }

  const PageComponent = views[currentView] || DashboardPage

  return (
    <AppShell>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentView}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          <PageComponent />
        </motion.div>
      </AnimatePresence>
    </AppShell>
  )
}
