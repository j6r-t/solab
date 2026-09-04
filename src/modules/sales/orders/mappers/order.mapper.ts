import type { OrderListItemDto, OrderDetailDto } from '@/modules/sales/orders/dtos/order.dto'
import type { Prisma } from '@prisma/client'
import { effectivePaymentTotal, pendingInstrumentTotal } from '@/lib/utils/payments'

type Numeric = Prisma.Decimal | string | number | null

interface OrderClientInput {
    id: string
    name: string
    familyName: string
    phone: string
    address?: string | null
}

interface OrderItemInput {
    id: string
    productId?: string | null
    lensBlankId?: string | null
    name?: string | null
    quantity: number
    unitPrice: Numeric
    sellingPrice?: Numeric
    product?: { id?: string; name?: string | null; brand?: string | null; model?: string | null; category?: string | null } | null
    lensBlank?: { id?: string; brand?: string | null; lensType?: string | null; material?: string | null; thickness?: string | null } | null
}

interface OrderPaymentInput {
    id: string
    amount: Numeric
    type: string
    method?: string | null
    createdAt: Date
    cheque?: { status?: string | null } | null
}

interface NormalizedPayment {
    amount: string
    method?: string | null
    cheque?: { status?: string | null } | null
}

interface WorkOrderServiceInput {
    id: string
    price: Numeric
    repairService?: { id: string; name: string | null } | null
}

interface WorkOrderInput {
    id: string
    status: string
    servicePrice: Numeric
    expectedCompletionDate?: Date | null
    workOrderServices?: WorkOrderServiceInput[]
}

interface PrescriptionInput {
    id: string
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
    doctor?: { id: string; name: string } | null
}

interface OrderInput {
    id: string
    orderNumber: number
    clientId: string
    totalAmount: Numeric
    status: string
    orderType: string
    createdAt: Date
    turnaroundDays?: number | null
    client: OrderClientInput
    items?: OrderItemInput[]
    payments?: OrderPaymentInput[]
    workOrders?: WorkOrderInput[]
    prescription?: PrescriptionInput | null
}

function toStr(val: Numeric): string {
    if (val == null) return '0'
    if (typeof val === 'string') return val
    if (typeof val === 'number') return val.toString()
    return String(val)
}

function toNumber(val: Numeric): number {
    return parseFloat(toStr(val)) || 0
}

function normalizePayments(payments?: OrderPaymentInput[]): NormalizedPayment[] {
    return (payments ?? []).map((p) => ({ amount: toStr(p.amount), method: p.method, cheque: p.cheque }))
}

export function toOrderListItem(order: OrderInput): OrderListItemDto {
    const payments = normalizePayments(order.payments)
    const totalPaid = effectivePaymentTotal(payments, 'client')
    const pendingAmount = pendingInstrumentTotal(payments, 'client')
    const total = toNumber(order.totalAmount)
    return {
        id: order.id,
        orderNumber: order.orderNumber,
        clientId: order.clientId,
        totalAmount: total.toString(),
        totalPaid: totalPaid.toString(),
        pendingAmount: pendingAmount.toString(),
        paymentStatus: totalPaid >= total ? 'fullyPaid' : totalPaid > 0 ? 'partiallyPaid' : 'unpaid',
        status: order.status,
        orderType: order.orderType,
        createdAt: order.createdAt,
        client: order.client,
    }
}

export function toOrderDetail(order: OrderInput): OrderDetailDto {
    const payments = normalizePayments(order.payments)
    const totalPaid = effectivePaymentTotal(payments, 'client')
    const pendingAmount = pendingInstrumentTotal(payments, 'client')
    const total = toNumber(order.totalAmount)
    return {
        id: order.id,
        orderNumber: order.orderNumber,
        clientId: order.clientId,
        totalAmount: total.toString(),
        totalPaid: totalPaid.toString(),
        pendingAmount: pendingAmount.toString(),
        paymentStatus: totalPaid >= total ? 'fullyPaid' : totalPaid > 0 ? 'partiallyPaid' : 'unpaid',
        orderType: order.orderType,
        status: order.status,
        createdAt: order.createdAt,
        client: { ...order.client, address: order.client.address ?? null },
        items: (order.items ?? []).map((i) => ({
            id: i.id,
            productId: i.productId || null,
            lensBlankId: i.lensBlankId || null,
            name: i.name || null,
            quantity: i.quantity,
            unitPrice: toStr(i.unitPrice),
            sellingPrice: i.sellingPrice != null ? toStr(i.sellingPrice) : null,
            product: i.product
                ? {
                    id: i.product.id ?? '',
                    name: i.product.name ?? '',
                    brand: i.product.brand ?? '',
                    model: i.product.model ?? '',
                    category: i.product.category ?? '',
                }
                : null,
            lensBlank: i.lensBlank
                ? {
                    id: i.lensBlank.id ?? '',
                    brand: i.lensBlank.brand ?? '',
                    lensType: i.lensBlank.lensType ?? '',
                    material: i.lensBlank.material ?? '',
                    thickness: i.lensBlank.thickness ?? '',
                }
                : null,
        })),
        payments: (order.payments ?? []).map((p) => ({
            id: p.id,
            amount: toStr(p.amount),
            type: p.type,
            createdAt: p.createdAt,
            cheque: p.cheque ? { status: p.cheque.status || '' } : null,
        })),
        repairs: (order.workOrders ?? []).flatMap((r) => {
            const services = r.workOrderServices ?? []
            if (services.length > 0) {
                return services.map((s) => ({
                    id: s.id,
                    type: s.repairService?.name || 'repair',
                    price: toStr(s.price),
                    status: r.status,
                    expectedCompletionDate: r.expectedCompletionDate ?? null,
                    repairService: s.repairService ? { id: s.repairService.id, name: s.repairService.name || '' } : null,
                }))
            }
            return [{
                id: r.id,
                type: 'repair',
                price: toStr(r.servicePrice),
                status: r.status,
                expectedCompletionDate: r.expectedCompletionDate ?? null,
                repairService: null,
            }]
        }),
        prescription: order.prescription
            ? {
                id: order.prescription.id,
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
                doctor: order.prescription.doctor || null,
            }
            : null,
        turnaroundDays: order.turnaroundDays || null,
    }
}
