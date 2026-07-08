import type { OrderListItemDto, OrderDetailDto } from '@/dtos/orders/order.dto'

export function toOrderListItem(order: any): OrderListItemDto {
    const totalPaid = order.payments?.reduce((s: number, p: any) => s + parseFloat(p.amount.toString()), 0) || 0
    const total = parseFloat(order.totalAmount.toString())
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
    const totalPaid = order.payments?.reduce((s: number, p: any) => s + parseFloat(p.amount.toString()), 0) || 0
    const total = parseFloat(order.totalAmount.toString())
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
            unitPrice: i.unitPrice.toString(),
            product: i.product || null,
            lensBlank: i.lensBlank || null,
        })),
        payments: (order.payments || []).map((p: any) => ({
            id: p.id,
            amount: p.amount.toString(),
            type: p.type,
            createdAt: p.createdAt,
        })),
        repairs: (order.workOrders || []).map((r: any) => ({
            id: r.id,
            type: r.type,
            price: r.price.toString(),
            status: r.status,
            expectedCompletionDate: r.expectedCompletionDate,
            repairService: r.repairService || null,
        })),
        prescription: order.prescription
            ? {
                id: order.prescription.id,
                sphRight: order.prescription.sphRight.toString(),
                cylRight: order.prescription.cylRight.toString(),
                axisRight: order.prescription.axisRight,
                addRight: order.prescription.addRight.toString(),
                pdRight: order.prescription.pdRight,
                sphLeft: order.prescription.sphLeft.toString(),
                cylLeft: order.prescription.cylLeft.toString(),
                axisLeft: order.prescription.axisLeft,
                addLeft: order.prescription.addLeft.toString(),
                pdLeft: order.prescription.pdLeft,
                doctor: order.prescription.doctor || null,
            }
            : null,
        turnaroundDays: order.turnaroundDays || null,
    }
}
