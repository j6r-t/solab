/**
 * Canonical money formatting for the whole app. Tunisia prices TND with three
 * decimals (millimes), so every amount on screen must read the same way:
 * grouped thousands, dot decimals, " TND" suffix — e.g. "260.000 TND",
 * "1,120.000 TND". Never hand-roll `${x.toFixed(3)} TND` at a call-site;
 * route it through here (or formatCurrencyShort for compact KPI tiles).
 */
const THREE_DECIMALS = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
})

function toNumber(amount: number | string): number {
  return typeof amount === 'string' ? parseFloat(amount) : amount
}

export function formatCurrency(amount: number | string): string {
  const num = toNumber(amount)
  if (!Number.isFinite(num)) return '—'
  return `${THREE_DECIMALS.format(num)} TND`
}

/**
 * Same grouped 3-decimal amount without the " TND" suffix — only for i18n
 * templates whose translation string already carries the unit ("{total} TND").
 */
export function formatAmount(amount: number | string): string {
  const num = toNumber(amount)
  if (!Number.isFinite(num)) return '—'
  return THREE_DECIMALS.format(num)
}

/**
 * Compact variant for tight tiles (dashboard KPIs). Same util, same currency,
 * just abbreviated magnitudes: "260.000 TND" up to 10K, then "12.5K TND",
 * "1.2M TND".
 */
function compact(num: number): string {
  const rounded = Math.round(num * 10) / 10
  return Number.isInteger(rounded) ? `${rounded}` : `${rounded.toFixed(1)}`
}

export function formatCurrencyShort(amount: number | string): string {
  const num = toNumber(amount)
  if (!Number.isFinite(num)) return '—'
  const abs = Math.abs(num)
  if (abs >= 1_000_000) return `${compact(num / 1_000_000)}M TND`
  if (abs >= 10_000) return `${compact(num / 1_000)}K TND`
  return formatCurrency(num)
}
