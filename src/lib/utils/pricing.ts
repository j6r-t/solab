import { TAX_RATE } from '@/lib/constants'

/**
 * Compute the price including VAT (TTC) from a pre-tax price.
 * Rounds to 3 decimals — TND millimes convention used across the app.
 * Same math as the migration backfill and prisma/seed.mjs (kept in sync manually).
 */
export function computePriceAfterTax(price: number | string, rate: number = TAX_RATE): number {
  const num = typeof price === 'string' ? parseFloat(price) : price
  if (!Number.isFinite(num)) return 0
  return Math.round(num * (1 + rate) * 1000) / 1000
}
