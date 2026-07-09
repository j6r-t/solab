import type { OrderListItemDto, OrderDetailDto } from '@/dtos/orders/order.dto'

function toStr(val: any): string {
    if (val == null) return '0'
    if (typeof val === 'string') return val
    if (typeof val === 'number') return val.toString()
    return String(val)
}

export function toOrderListItem(order: any): OrderListItemDto {
    const totalPaid = order.payments?.reduce((s: number, p: any) => s + parseFloat(toStr(p.amount)), 0) || 0
    const total = parseFloat(toStr(order.totalAmount))
    return {
        id: order.id,
        orderNumber: order.orderNumber,
        clientId: order.clientId,
        totalAmount: total.toString(),
        totalPaid: totalPaid.toString(),
        paymentStatus: totalPaid >= total ? 'fullyPaid' : totalPaid > 0 ? 'partiallyPaid' : 'unpaid',
        status: order.status,
        orderType: order.orderType,
        createdAt: order.createdAt,
        client: order.client,
    }
}

export function toOrderDetail(order: any): OrderDetailDto {
    const totalPaid = order.payments?.reduce((s: number, p: any) => s + parseFloat(toStr(p.amount)), 0) || 0
    const total = parseFloat(toStr(order.totalAmount))
    return {
        id: order.id,
        orderNumber: order.orderNumber,
        clientId: order.clientId,
        totalAmount: total.toString(),
        totalPaid: totalPaid.toString(),
        paymentStatus: totalPaid >= total ? 'fullyPaid' : totalPaid > 0 ? 'partiallyPaid' : 'unpaid',
        orderType: order.orderType,
        status: order.status,
        createdAt: order.createdAt,
        client: order.client,
        items: (order.items || []).map((i: any) => ({
            id: i.id,
            productId: i.productId || null,
            lensBlankId: i.lensBlankId || null,
            name: i.name || null,
            quantity: i.quantity,
            unitPrice: toStr(i.unitPrice),
            sellingPrice: i.sellingPrice != null ? toStr(i.sellingPrice) : null,
            product: i.product || null,
            lensBlank: i.lensBlank || null,
        })),
        payments: (order.payments || []).map((p: any) => ({
            id: p.id,
            amount: toStr(p.amount),
            type: p.type,
            createdAt: p.createdAt,
        })),
        repairs: (order.workOrders || []).map((r: any) => ({
            id: r.id,
            type: r.type,
            price: toStr(r.price),
            status: r.status,
            expectedCompletionDate: r.expectedCompletionDate,
            repairService: r.repairService || null,
        })),
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
