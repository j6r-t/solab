export interface BillingResponse {
    id: string
    orderNumber: number
    client: any
    totalAmount: string
    totalPaid: string
    balance: string
    paymentStatus: string
    status: string
    orderType: string
    createdAt: Date
    items: { productName: string; brand: string; quantity: number; unitPrice: string }[]
    payments: { amount: string; type: string; createdAt: Date }[]
    repairs: { type: string; price: string }[]
    turnaroundDays: number | null
    prescription: any
}

export function toBillingResponse(order: any): BillingResponse {
    const totalPaid = order.payments?.reduce((s: number, p: any) => s + parseFloat(p.amount.toString()), 0) || 0
    const total = parseFloat(order.totalAmount.toString())
    return {
        id: order.id,
        orderNumber: order.orderNumber,
        client: order.client,
        totalAmount: total.toString(),
        totalPaid: totalPaid.toString(),
        balance: (total - totalPaid).toFixed(3),
        paymentStatus: totalPaid >= total ? 'fullyPaid' : totalPaid > 0 ? 'partiallyPaid' : 'unpaid',
        status: order.status,
        orderType: order.orderType,
        createdAt: order.createdAt,
        items: (order.items || []).map((i: any) => ({
            productName: i.product?.name || '',
            brand: i.product?.brand || '',
            quantity: i.quantity,
            unitPrice: i.unitPrice.toString(),
        })),
        payments: (order.payments || []).map((p: any) => ({
            amount: p.amount.toString(),
            type: p.type,
            createdAt: p.createdAt,
        })),
        repairs: (order.repairs || []).map((r: any) => ({
            type: r.type,
            price: r.price.toString(),
        })),
        turnaroundDays: order.turnaroundDays,
        prescription: order.prescription
            ? {
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
                dateWritten: order.prescription.dateWritten,
                doctorName: order.prescription.doctor?.name || null,
            }
            : null,
    }
}
