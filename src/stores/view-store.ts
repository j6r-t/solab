import { create } from 'zustand'

export type ViewName =
  | 'dashboard'
  | 'clients'
  | 'client-detail'
  | 'client-new'
  | 'stock'
  | 'stock-detail'
  | 'stock-new'
  | 'stock-scan'
  | 'orders'
  | 'order-new'
  | 'order-detail'
  | 'billing'
  | 'billing-detail'
  | 'cheques'
  | 'reports'
  | 'settings'
  | 'doctors'
  | 'fournisseurs'
  | 'optician-shops'
  | 'qrcode'
  | 'import'
  | 'purchase-invoices'
  | 'lens-blanks'
  | 'atelier-work-orders'
  | 'invoices'
  | 'audit-logs'

interface ViewState {
  currentView: ViewName
  viewParams: Record<string, string>
  history: ViewName[]
  setView: (view: ViewName, params?: Record<string, string>) => void
  goBack: () => void
  reset: () => void
}

export const useViewStore = create<ViewState>()((set, get) => ({
  currentView: 'dashboard',
  viewParams: {},
  history: ['dashboard'],
  setView: (view, params = {}) =>
    set((state) => ({
      currentView: view,
      viewParams: params,
      history: [...state.history, view],
    })),
  goBack: () => {
    const { history } = get()
    if (history.length <= 1) return
    const newHistory = history.slice(0, -1)
    set({
      currentView: newHistory[newHistory.length - 1],
      viewParams: {},
      history: newHistory,
    })
  },
  reset: () =>
    set({
      currentView: 'dashboard',
      viewParams: {},
      history: ['dashboard'],
    }),
}))