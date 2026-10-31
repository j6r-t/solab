/**
 * Unit tests for consolidated-invoice.service.ts
 * Run with: npm test -- consolidated-invoice.service.test.ts
 *
 * Covers the payment allocation across source bills and the payment-time
 * sync: a consolidated payment must mirror shares onto the member bills
 * (via OpticianShopPayment rows) and re-run syncBillPaidState on each
 * source bill so their statuses and linked work orders follow.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// --- Mocks (before the service is imported) -------------------------------

const mocks = vi.hoisted(() => {
    const tx = {
        cheque: { create: vi.fn() },
        consolidatedPayment: { create: vi.fn() },
        opticianShopPayment: { create: vi.fn() },
    }
    return {
        tx,
        // Payments recorded on the invoice during the test — the service
        // re-reads them on its second findUnique to compute paidAmount/status.
        invoicePayments: [] as unknown[],
        dbFindUnique: vi.fn(),
        dbUpdate: vi.fn(),
        syncBillPaidState: vi.fn(),
    }
})

vi.mock('@/lib/database/db', () => ({
    db: {
        $transaction: (fn: (tx: unknown) => Promise<unknown>) => fn(mocks.tx),
        consolidatedInvoice: { findUnique: mocks.dbFindUnique, update: mocks.dbUpdate },
    },
}))

vi.mock('@/modules/system/audit', () => ({
    auditService: { log: vi.fn() },
}))

vi.mock('@/modules/partners/optician-shop-bills/optician-shop-bill.service', () => ({
    syncBillPaidState: mocks.syncBillPaidState,
}))

import { recordConsolidatedPayment, allocateConsolidatedPayment } from './consolidated-invoice.service'

const { tx, dbFindUnique, dbUpdate, syncBillPaidState } = mocks

// --- Fixtures --------------------------------------------------------------

// Two source bills: 60 + 40 = 100 consolidated total (grouped remainders).
const INVOICE = {
    id: 'inv-1',
    invoiceNumber: 'FAC-G-OP-001',
    totalAmount: '100',
    paidAmount: 0,
    status: 'unpaid',
    opticianShop: { id: 'shop-1', name: 'Optic Plus' },
    items: [
        { sourceBillId: 'bill-1', sourceBillNumber: 'FAC-1', amount: '60' },
        { sourceBillId: 'bill-2', sourceBillNumber: 'FAC-2', amount: '40' },
    ],
    payments: [],
}

beforeEach(() => {
    vi.clearAllMocks()
    mocks.invoicePayments.length = 0

    mocks.dbFindUnique.mockImplementation(() => Promise.resolve({ ...INVOICE, payments: [...mocks.invoicePayments] }))

    mocks.tx.consolidatedPayment.create.mockImplementation(({ data }: { data: { amount: number; method: string } }) => {
        mocks.invoicePayments.push({ amount: data.amount, method: data.method, cheque: null })
        return Promise.resolve({})
    })
    mocks.tx.opticianShopPayment.create.mockResolvedValue({})
    mocks.tx.cheque.create.mockResolvedValue({ id: 'cheque-1' })
    mocks.dbUpdate.mockImplementation(({ data }: { data: { paidAmount: number; status: string } }) =>
        Promise.resolve({ ...INVOICE, payments: [...mocks.invoicePayments], ...data })
    )
    mocks.syncBillPaidState.mockResolvedValue(undefined)
})

// --- allocateConsolidatedPayment (pure) ------------------------------------

describe('allocateConsolidatedPayment', () => {
    it('full payment gives each bill exactly its grouped amount', () => {
        expect(allocateConsolidatedPayment(100, [60, 40])).toEqual([60, 40])
    })

    it('partial payment is pro-rata and never exceeds a bill remainder', () => {
        expect(allocateConsolidatedPayment(30, [60, 40])).toEqual([18, 12])
        expect(allocateConsolidatedPayment(50, [60, 40])).toEqual([30, 20])
    })

    it('shares always sum exactly to the payment (rounding on the last item)', () => {
        const cases: [number, number[]][] = [
            [0.005, [1, 1, 1]],
            [7.777, [33.333, 66.667]],
            [3.333, [1, 1, 1, 1, 1]],
            [0.123, [100.005, 0.005]],
        ]
        for (const [amount, items] of cases) {
            const shares = allocateConsolidatedPayment(amount, items)
            const sum = Math.round(shares.reduce((s, a) => s + a, 0) * 1000) / 1000
            expect(sum).toBe(amount)
            shares.forEach((share, i) => {
                expect(share).toBeGreaterThanOrEqual(0)
                expect(share).toBeLessThanOrEqual(items[i] + 1e-9)
            })
        }
    })

    it('handles degenerate inputs', () => {
        expect(allocateConsolidatedPayment(10, [])).toEqual([])
        expect(allocateConsolidatedPayment(10, [0, 0])).toEqual([0, 0])
        expect(allocateConsolidatedPayment(0, [60, 40])).toEqual([0, 0])
        expect(allocateConsolidatedPayment(5, [10])).toEqual([5])
    })
})

// --- recordConsolidatedPayment sync ----------------------------------------

describe('recordConsolidatedPayment', () => {
    it('full payment mirrors exact remainders onto bills and syncs each one', async () => {
        const result = await recordConsolidatedPayment('inv-1', { amount: 100, method: 'cash' })

        // Invoice itself is fully paid
        expect(dbUpdate).toHaveBeenCalledWith(expect.objectContaining({ data: { paidAmount: 100, status: 'paid' } }))

        // One mirrored payment per source bill, totalling the payment
        expect(tx.opticianShopPayment.create).toHaveBeenCalledTimes(2)
        expect(tx.opticianShopPayment.create).toHaveBeenNthCalledWith(1, {
            data: expect.objectContaining({ billId: 'bill-1', amount: 60, method: 'cash' }),
        })
        expect(tx.opticianShopPayment.create).toHaveBeenNthCalledWith(2, {
            data: expect.objectContaining({ billId: 'bill-2', amount: 40, method: 'cash' }),
        })

        // Every source bill re-synced (bill status + work order)
        expect(syncBillPaidState).toHaveBeenCalledTimes(2)
        expect(syncBillPaidState).toHaveBeenCalledWith('bill-1')
        expect(syncBillPaidState).toHaveBeenCalledWith('bill-2')

        expect(result.status).toBe('paid')
    })

    it('partial payment mirrors pro-rata shares and keeps invoice partiallyPaid', async () => {
        const result = await recordConsolidatedPayment('inv-1', { amount: 30, method: 'cash' })

        expect(dbUpdate).toHaveBeenCalledWith(expect.objectContaining({ data: { paidAmount: 30, status: 'partiallyPaid' } }))
        expect(tx.opticianShopPayment.create).toHaveBeenCalledTimes(2)
        expect(tx.opticianShopPayment.create).toHaveBeenNthCalledWith(1, {
            data: expect.objectContaining({ billId: 'bill-1', amount: 18 }),
        })
        expect(tx.opticianShopPayment.create).toHaveBeenNthCalledWith(2, {
            data: expect.objectContaining({ billId: 'bill-2', amount: 12 }),
        })
        expect(syncBillPaidState).toHaveBeenCalledWith('bill-1')
        expect(syncBillPaidState).toHaveBeenCalledWith('bill-2')
        expect(result.status).toBe('partiallyPaid')
    })

    it('floors each share to millimes and lets the last item absorb the remainder', () => {
        // 1 TND split over three equal bills: 1/3 floors to 0.333 per bill
        expect(allocateConsolidatedPayment(1, [1, 1, 1])).toEqual([0.333, 0.333, 0.334])
    })
})
