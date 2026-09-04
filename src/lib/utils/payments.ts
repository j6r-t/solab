export interface InstrumentPaymentLike {
    amount: number | string
    method?: string | null
    cheque?: { status?: string | null } | null
}

export type InstrumentSide = 'client' | 'supplier'

const CLEARED_STATUS: Record<InstrumentSide, string> = {
    client: 'cashed',
    supplier: 'paid',
}

export function isCashMethod(method?: string | null): boolean {
    return !method || method === 'cash' || method === 'card'
}

export function isClearedInstrument(payment: InstrumentPaymentLike, side: InstrumentSide = 'client'): boolean {
    if (isCashMethod(payment.method)) return true
    return payment.cheque?.status === CLEARED_STATUS[side]
}

function toAmount(value: number | string): number {
    const n = typeof value === 'number' ? value : parseFloat(value)
    return Number.isNaN(n) ? 0 : n
}

export function effectivePaymentTotal(payments?: InstrumentPaymentLike[] | null, side: InstrumentSide = 'client'): number {
    return (payments ?? [])
        .filter((p) => isClearedInstrument(p, side))
        .reduce((s, p) => s + toAmount(p.amount), 0)
}

export function pendingInstrumentTotal(payments?: InstrumentPaymentLike[] | null, side: InstrumentSide = 'client'): number {
    return (payments ?? [])
        .filter((p) => {
            if (isCashMethod(p.method)) return false
            const status = p.cheque?.status
            if (status === CLEARED_STATUS[side] || status === 'bounced') return false
            return true
        })
        .reduce((s, p) => s + toAmount(p.amount), 0)
}
