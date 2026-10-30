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

const VALID_VIEWS = new Set<string>([
    'dashboard', 'clients', 'client-detail', 'client-new', 'stock', 'stock-detail',
    'stock-new', 'stock-scan', 'orders', 'order-new', 'order-detail', 'billing',
    'billing-detail', 'cheques', 'reports', 'settings', 'doctors', 'fournisseurs',
    'optician-shops', 'qrcode', 'import', 'purchase-invoices', 'lens-blanks',
    'atelier-work-orders', 'invoices', 'audit-logs',
])

export interface ViewStateParams {
    view: ViewName
    params: Record<string, string>
}

/** Parse ?view=...&params from a location.search string; unknown views fall back to dashboard. */
export function viewFromSearch(search: string): ViewStateParams {
    try {
        const sp = new URLSearchParams(search)
        const raw = sp.get('view')
        const view = raw && VALID_VIEWS.has(raw) ? (raw as ViewName) : 'dashboard'
        const params: Record<string, string> = {}
        sp.forEach((v, k) => {
            if (k !== 'view') params[k] = v
        })
        return { view, params }
    } catch {
        return { view: 'dashboard', params: {} }
    }
}

/** Build the canonical URL for a view; dashboard is the bare app root. */
function searchFromView(view: ViewName, params: Record<string, string>): string {
    const sp = new URLSearchParams(params)
    if (view !== 'dashboard') sp.set('view', view)
    const qs = sp.toString()
    return qs ? `/?${qs}` : '/'
}

function pushUrl(url: string, replace = false) {
    try {
        const current = window.location.pathname + window.location.search
        if (current === url) return
        if (replace) window.history.replaceState(null, '', url)
        else window.history.pushState(null, '', url)
    } catch {
        // Non-browser context (prerender/tests): URL stays untouched.
    }
}

interface ViewState {
  currentView: ViewName
  viewParams: Record<string, string>
  history: ViewName[]
  setView: (view: ViewName, params?: Record<string, string>) => void
  /** Adopt the view from the URL (initial load, browser Back/Forward) without touching the URL. */
  syncFromUrl: (view: ViewName, params?: Record<string, string>) => void
  goBack: () => void
  reset: () => void
}

const initial =
  typeof window !== 'undefined'
    ? viewFromSearch(window.location.search)
    : { view: 'dashboard' as ViewName, params: {} }

export const useViewStore = create<ViewState>()((set, get) => ({
  currentView: initial.view,
  viewParams: initial.params,
  history: [initial.view],
  setView: (view, params = {}) => {
    set((state) => ({
      currentView: view,
      viewParams: params,
      history: [...state.history, view],
    }))
    pushUrl(searchFromView(view, params))
  },
  syncFromUrl: (view, params = {}) =>
    set((state) => ({
      currentView: view,
      viewParams: params,
      history: [...state.history, view],
    })),
  goBack: () => {
    const { history } = get()
    if (history.length > 1 && typeof window !== 'undefined' && window.history.length > 1) {
      // Real browser history — the popstate listener in the root page adopts the previous view.
      window.history.back()
    } else {
      // Deep-linked entry with no in-app history: fall back to the dashboard.
      set({ currentView: 'dashboard', viewParams: {}, history: ['dashboard'] })
      pushUrl('/', true)
    }
  },
  reset: () => {
    set({ currentView: 'dashboard', viewParams: {}, history: ['dashboard'] })
    pushUrl('/', true)
  },
}))
