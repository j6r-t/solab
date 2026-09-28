import { BadRequestError } from '@/lib/errors'

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

export const OVERPAY_MESSAGE = 'Payment exceeds remaining balance'

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
    // Complements effectivePaymentTotal: uncleared instruments hold budget
    // against the balance, except bounced/cancelled ones which can never pay.
    return (payments ?? [])
        .filter((p) => !isClearedInstrument(p, side) && p.cheque?.status !== 'bounced' && p.cheque?.status !== 'cancelled')
        .reduce((s, p) => s + toAmount(p.amount), 0)
}

export type AmountLike = number | string | { toString(): string }

export function assertWithinTotal(input: {
    totalAmount: AmountLike
    effectivePaid: AmountLike
    pendingTotal: AmountLike
    newAmount: AmountLike
    label?: string
}): void {
    const projected = Number(input.effectivePaid) + Number(input.pendingTotal) + Number(input.newAmount)
    if (projected > Number(input.totalAmount) + 0.001) {
        throw new BadRequestError(input.label ? `${input.label}: ${OVERPAY_MESSAGE}` : OVERPAY_MESSAGE)
    }
}
