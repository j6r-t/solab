'use client'

import { useEffect, useSyncExternalStore } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/stores/auth-store'
import { useViewStore } from '@/stores/view-store'
import { AppShell } from '@/components/layouts/AppShell'
import { DashboardPage } from '@/modules/system/dashboard/DashboardPage'
import { ClientsPage } from '@/modules/partners/clients/ClientsPage'
import { ClientDetailPage } from '@/modules/partners/clients/ClientDetailPage'
import { StockPage } from '@/modules/inventory/stock/StockPage'
import { PrescriptionsPage } from '@/modules/sales/prescriptions/PrescriptionsPage'
import { OrdersPage } from '@/modules/sales/orders/OrdersPage'
import { RepairsPage } from '@/modules/sales/repairs/RepairsPage'
import { BillingPage } from '@/modules/sales/billing/BillingPage'
import { ChequesPage } from '@/modules/sales/cheques/ChequesPage'
import { ReportsPage } from '@/modules/system/reports/ReportsPage'
import { SettingsPage } from '@/modules/system/settings/SettingsPage'
import { DoctorsPage } from '@/modules/partners/doctors/DoctorsPage'
import { FournisseursPage } from '@/modules/partners/fournisseurs/FournisseursPage'
import { OpticianShopsPage } from '@/modules/partners/optician-shops/OpticianShopsPage'
import { QRCodePage } from '@/modules/system/qrcode/QRCodePage'
import { ImportPage } from '@/modules/system/import/ImportPage'
import { PurchaseInvoicesPage } from '@/modules/inventory/purchase-invoices/PurchaseInvoicesPage'
import { LensBlanksPage } from '@/modules/inventory/lens-blanks/LensBlanksPage'
import { AtelierWorkOrdersPage } from '@/modules/sales/atelier-work-orders/AtelierWorkOrdersPage'
import { AuditLogsPage } from '@/modules/system/audit/AuditLogsPage'

const views: Record<string, React.FC> = {
  dashboard: DashboardPage,
  clients: ClientsPage,
  'client-detail': ClientDetailPage,
  stock: StockPage,
  prescriptions: PrescriptionsPage,
  orders: OrdersPage,
  repairs: RepairsPage,
  billing: BillingPage,
  cheques: ChequesPage,
  reports: ReportsPage,
  settings: SettingsPage,
  doctors: DoctorsPage,
  fournisseurs: FournisseursPage,
  'optician-shops': OpticianShopsPage,
  qrcode: QRCodePage,
  import: ImportPage,
  'purchase-invoices': PurchaseInvoicesPage,
  'lens-blanks': LensBlanksPage,
  'atelier-work-orders': AtelierWorkOrdersPage,
  'audit-logs': AuditLogsPage,
}

const emptySubscribe = () => () => {}

export default function Home() {
  const { isAuthenticated } = useAuthStore()
  const { currentView } = useViewStore()
  const router = useRouter()
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false)

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push('/en/login') // Use locale-based route
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
