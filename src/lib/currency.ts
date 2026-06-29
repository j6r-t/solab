export function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return num.toLocaleString('fr-TN', {
    currency: 'TND',
    style: 'currency',
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  })
}
