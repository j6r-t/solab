export interface OrderListItem {
    id: string
    orderNumber: number
    clientId: string
    totalAmount: string
    totalPaid: string
    paymentStatus: string
    status: string
    orderType: string
    createdAt: Date
    client: { id: string; name: string; familyName: string; phone: string }
}

export function toOrderListItem(order: any): OrderListItem {
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

export interface OrderDetail {
    id: string
    orderNumber: number
    clientId: string
    totalAmount: string
    orderType: string
    status: string
    createdAt: Date
    client: any
    items: any[]
    payments: any[]
    repairs: any[]
    prescription: any
}
