import {
    LayoutDashboard,
    Users,
    Package,
    ShoppingCart,
    Wrench,
    Receipt,
    BarChart3,
    Settings,
    Stethoscope,
    Truck,
    Store,
    Upload,
    ClipboardList,
    PackageOpen,
    History,
    Wallet,
    type LucideIcon,
} from 'lucide-react'
import type { ViewName } from '@/stores/view-store'

export interface NavItem {
    icon: LucideIcon
    view: ViewName
    labelKey: string
    roles: string[]
}

export interface NavGroup {
    labelKey: string
    icon: LucideIcon
    roles: string[]
    flattenRoles?: string[]
    items: NavItem[]
}

export const navGroups: NavGroup[] = [
    {
        labelKey: 'navGroups.home',
        icon: LayoutDashboard,
        roles: ['admin', 'shop', 'atelier'],
        items: [
            { icon: LayoutDashboard, view: 'dashboard', labelKey: 'dashboard', roles: ['admin', 'shop', 'atelier'] },
        ],
    },
    {
        labelKey: 'navGroups.clients',
        icon: Users,
        roles: ['admin', 'shop'],
        items: [
            { icon: Users, view: 'clients', labelKey: 'clients', roles: ['admin', 'shop'] },
            { icon: Stethoscope, view: 'doctors', labelKey: 'doctors', roles: ['admin', 'shop'] },
        ],
    },
    {
        labelKey: 'navGroups.stock',
        icon: Package,
        roles: ['admin', 'shop', 'atelier'],
        items: [
            { icon: Package, view: 'stock', labelKey: 'stock', roles: ['admin', 'shop'] },
            { icon: PackageOpen, view: 'lens-blanks', labelKey: 'lensBlanks', roles: ['admin', 'atelier'] },
        ],
    },
    {
        labelKey: 'navGroups.sales',
        icon: ShoppingCart,
        roles: ['admin', 'shop'],
        items: [
            { icon: ShoppingCart, view: 'orders', labelKey: 'orders', roles: ['admin', 'shop'] },
            { icon: Receipt, view: 'billing', labelKey: 'billing', roles: ['admin', 'shop'] },
            { icon: Wallet, view: 'cheques', labelKey: 'cheques', roles: ['admin', 'shop'] },
        ],
    },
    {
        labelKey: 'navGroups.atelier',
        icon: Wrench,
        roles: ['admin', 'atelier'],
        flattenRoles: ['atelier'],
        items: [
            { icon: Wrench, view: 'atelier-work-orders', labelKey: 'atelierWorkOrders', roles: ['admin', 'atelier'] },
            { icon: Store, view: 'optician-shops', labelKey: 'opticianShops', roles: ['admin', 'atelier'] },
        ],
    },
    {
        labelKey: 'navGroups.procurement',
        icon: Truck,
        roles: ['admin', 'shop', 'atelier'],
        flattenRoles: ['atelier'],
        items: [
            { icon: ClipboardList, view: 'purchase-invoices', labelKey: 'purchaseInvoices', roles: ['admin', 'shop', 'atelier'] },
            { icon: Truck, view: 'fournisseurs', labelKey: 'fournisseurs', roles: ['admin', 'shop', 'atelier'] },
        ],
    },
    {
        labelKey: 'navGroups.tools',
        icon: Settings,
        roles: ['admin', 'shop', 'atelier'],
        flattenRoles: ['atelier'],
        items: [
            { icon: BarChart3, view: 'reports', labelKey: 'reports', roles: ['admin', 'shop', 'atelier'] },
            { icon: History, view: 'audit-logs', labelKey: 'auditLogs', roles: ['admin'] },
            { icon: Upload, view: 'import', labelKey: 'import', roles: ['admin', 'shop'] },
            { icon: Settings, view: 'settings', labelKey: 'settings', roles: ['admin', 'shop', 'atelier'] },
        ],
    },
]

const SMART_DEFAULTS: Record<string, string[]> = {
    admin: [],
    shop: ['navGroups.sales', 'navGroups.stock'],
    atelier: ['navGroups.atelier', 'navGroups.stock'],
}

export const VIEW_ROLES: Record<ViewName, string[]> = {
    dashboard: ['admin', 'shop', 'atelier'],
    clients: ['admin', 'shop'],
    'client-detail': ['admin', 'shop'],
    'client-new': ['admin', 'shop'],
    stock: ['admin', 'shop'],
    'stock-detail': ['admin', 'shop'],
    'stock-new': ['admin', 'shop'],
    'stock-scan': ['admin', 'shop'],
    orders: ['admin', 'shop'],
    'order-new': ['admin', 'shop'],
    'order-detail': ['admin', 'shop'],
    billing: ['admin', 'shop'],
    'billing-detail': ['admin', 'shop'],
    cheques: ['admin', 'shop'],
    reports: ['admin', 'shop', 'atelier'],
    settings: ['admin', 'shop', 'atelier'],
    doctors: ['admin', 'shop'],
    fournisseurs: ['admin', 'shop', 'atelier'],
    'optician-shops': ['admin', 'atelier'],
    qrcode: ['admin', 'shop'],
    import: ['admin', 'shop'],
    'purchase-invoices': ['admin', 'shop', 'atelier'],
    'lens-blanks': ['admin', 'atelier'],
    'atelier-work-orders': ['admin', 'atelier'],
    'audit-logs': ['admin'],
}

export type NavEntry =
    | { type: 'group'; group: NavGroup }
    | { type: 'item'; item: NavItem }

export function getVisibleGroups(role: string): NavEntry[] {
    const result: NavEntry[] = []
    for (const group of navGroups) {
        if (!group.roles.includes(role)) continue
        const visibleItems = group.items.filter((i) => i.roles.includes(role))
        if (visibleItems.length === 0) continue

        if (group.flattenRoles?.includes(role)) {
            for (const item of visibleItems) {
                result.push({ type: 'item', item })
            }
        } else {
            result.push({ type: 'group', group: { ...group, items: visibleItems } })
        }
    }
    return result
}

export function getDefaultCollapsed(role: string): Record<string, boolean> {
    const expanded = SMART_DEFAULTS[role] || SMART_DEFAULTS.admin
    const result: Record<string, boolean> = {}
    for (const group of navGroups) {
        result[group.labelKey] = !expanded.includes(group.labelKey)
    }
    return result
}

export function findGroupForView(view: ViewName): NavGroup | undefined {
    return navGroups.find((g) => g.items.some((i) => i.view === view))
}
