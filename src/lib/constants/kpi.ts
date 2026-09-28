// Single source of truth for every KPI threshold (reports, dashboard, stock badges, notifications).
// Never inline threshold literals at call sites — import from here so dashboard and reports always agree.

// One day in milliseconds (shared time unit for window arithmetic)
export const DAY_MS = 24 * 60 * 60 * 1000

// A product OR lens blank is "low stock" at or below this quantity (label: "quantité ≤ 3")
export const LOW_STOCK_MAX_QTY = 3

// Sold-units lookback: products with zero sales in this window are "dead stock"
export const DEAD_STOCK_WINDOW_DAYS = 90
// Weeks-of-cover velocity uses the same 90-day sold-units window...
export const SALES_VELOCITY_WINDOW_DAYS = DEAD_STOCK_WINDOW_DAYS
// ...converted to a weekly rate over ~13 weeks
export const SALES_VELOCITY_WEEKS = 13

// A client with no completed order in this many months is "dormant"
export const DORMANT_CLIENT_MONTHS = 6

// Revenue share of the top 10% spending clients (Pareto)
export const PARETO_TOP_DECILE = 0.1

// Order-value distribution cut-offs: <200, 200–499, 500–999, ≥1000
export const ORDER_VALUE_BUCKETS = [200, 500, 1000] as const

// Backlog aging cut-offs in days: ≤3, 4–7, 8–14, >14
export const BACKLOG_AGING_BUCKETS_DAYS = [3, 7, 14] as const

// Cheque collection stats lookback (avg days-to-cash, bounce rate) — rolling calendar months ≈ 365 days
export const COLLECTIONS_WINDOW_MONTHS = 12

// Monthly revenue / work-order trend span
export const MONTHLY_TREND_MONTHS = 12
// Weekly throughput chart span (atelier)
export const WEEKLY_THROUGHPUT_WEEKS = 12

// Standard short-list size (top clients, recent orders, revenue by optician, low-blank preview, top products per category, top broken blanks)
export const TOP_LIST_SIZE = 5
// Extended ranking size (doctor ranking, dormant clients, supplier balances)
export const RECOMMENDED_TOP_LIST_SIZE = 10
// Lens-usage ranking size (most-consumed blanks)
export const TOP_USED_BLANKS_SIZE = 8
// Blanks per shop in the per-optician top-blanks list (most-used blanks by shop)
export const TOP_BLANKS_PER_SHOP = 3

// Completed orders needed for a client to count as "repeat" (label: "≥ 2 orders")
export const REPEAT_CLIENT_MIN_ORDERS = 2

// Restock suggestions: products at/below this quantity, list capped at RESTOCK_LIST_SIZE rows
export const RESTOCK_LIST_MAX_QTY = 3
export const RESTOCK_LIST_SIZE = 15

// Due-cheques popup: "upcoming" horizon in days
export const CHEQUE_ALERT_DAYS = 3
// Notification bell: pending cheques falling due within this many days
export const PENDING_CHEQUES_WINDOW_DAYS = 7

// Stock filter/badge thresholds, derived from the KPI source of truth
export const STOCK_THRESHOLDS = { lowStock: LOW_STOCK_MAX_QTY } as const
