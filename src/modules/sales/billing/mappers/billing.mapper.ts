import type { BillingResponse } from '@/modules/sales/billing/dtos/billing.dto'
import type { Prisma } from '@prisma/client'
import { effectivePaymentTotal, pendingInstrumentTotal } from '@/lib/utils/payments'

type Numeric = Prisma.Decimal | string | number | null

interface BillingClientInput {
    name?: string | null
    familyName?: string | null
    phone?: string | null
    address?: string | null
}

interface BillingItemInput {
    quantity: number
    unitPrice: Numeric
    product?: { name?: string | null; brand?: string | null } | null
}

interface BillingChequeInput {
    number?: string | null
    bankName?: string | null
    status?: string | null
    dueDate?: Date | null
}

interface BillingPaymentInput {
    amount: Numeric
    type: string
    method?: string | null
    createdAt: Date
    cheque?: BillingChequeInput | null
}

interface BillingPrescriptionInput {
    sphRight: Numeric
    cylRight: Numeric
    axisRight: number
    addRight: Numeric
    pdRight: number
    sphLeft: Numeric
    cylLeft: Numeric
    axisLeft: number
    addLeft: Numeric
    pdLeft: number
    dateWritten?: Date | null
    doctor?: { name?: string | null } | null
}

interface WorkOrderServiceInput {
    price: Numeric
    repairService?: { name?: string | null } | null
}

interface BillingWorkOrderInput {
    servicePrice: Numeric
    workOrderServices?: WorkOrderServiceInput[]
}

interface BillingOrderInput {
    id: string
    orderNumber: number
    totalAmount: Numeric
    status: string
    orderType: string
    createdAt: Date
    turnaroundDays?: number | null
    client?: BillingClientInput | null
    items?: BillingItemInput[]
    payments?: BillingPaymentInput[]
    workOrders?: BillingWorkOrderInput[]
    prescription?: BillingPrescriptionInput | null
}

function toStr(val: Numeric): string {
    if (val == null) return '0'
    if (typeof val === 'string') return val
    if (typeof val === 'number') return val.toString()
    return String(val)
}

export function toBillingResponse(order: BillingOrderInput): BillingResponse {
    const payments = (order.payments ?? []).map((p) => ({ amount: toStr(p.amount), method: p.method, cheque: p.cheque }))
    const totalPaid = effectivePaymentTotal(payments, 'client')
    const pendingAmount = pendingInstrumentTotal(payments, 'client')
    const total = parseFloat(toStr(order.totalAmount))
    return {
        id: order.id,
        orderNumber: order.orderNumber,
        client: {
            name: order.client?.name || '',
            familyName: order.client?.familyName || '',
            phone: order.client?.phone || '',
            address: order.client?.address || null,
        },
        totalAmount: total.toString(),
        totalPaid: totalPaid.toString(),
        pendingAmount: pendingAmount.toString(),
        balance: (total - totalPaid).toFixed(3),
        paymentStatus: totalPaid >= total ? 'fullyPaid' : totalPaid > 0 ? 'partiallyPaid' : 'unpaid',
        status: order.status,
        orderType: order.orderType,
        createdAt: order.createdAt,
        items: (order.items ?? []).map((i) => ({
            productName: i.product?.name || '',
            brand: i.product?.brand || '',
            quantity: i.quantity,
            unitPrice: toStr(i.unitPrice),
        })),
        payments: (order.payments ?? []).map((p) => ({
            amount: toStr(p.amount),
            type: p.type,
            method: p.method || 'cash',
            createdAt: p.createdAt,
            cheque: p.cheque
                ? {
                    number: p.cheque.number || '',
                    bankName: p.cheque.bankName ?? null,
                    status: p.cheque.status || '',
                    dueDate: p.cheque.dueDate ?? null,
                }
                : null,
        })),
        repairs: (order.workOrders ?? []).flatMap((r) => {
            const services = r.workOrderServices ?? []
            if (services.length > 0) {
                return services.map((s) => ({
                    type: s.repairService?.name || 'repair',
                    price: toStr(s.price),
                }))
            }
            return [{ type: 'repair', price: toStr(r.servicePrice) }]
        }),
        turnaroundDays: order.turnaroundDays ?? null,
        prescription: order.prescription
            ? {
                sphRight: toStr(order.prescription.sphRight),
                cylRight: toStr(order.prescription.cylRight),
                axisRight: order.prescription.axisRight,
                addRight: toStr(order.prescription.addRight),
                pdRight: order.prescription.pdRight,
                sphLeft: toStr(order.prescription.sphLeft),
                cylLeft: toStr(order.prescription.cylLeft),
                axisLeft: order.prescription.axisLeft,
                addLeft: toStr(order.prescription.addLeft),
                pdLeft: order.prescription.pdLeft,
                dateWritten: order.prescription.dateWritten ?? null,
                doctorName: order.prescription.doctor?.name || null,
            }
            : null,
    }
}
