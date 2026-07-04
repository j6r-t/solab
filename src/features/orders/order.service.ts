import { orderRepo, clientRepo, productRepo, paymentRepo, stockAdjustmentRepo } from '@/lib/database/repositories'
import { db } from '@/lib/database/db'
import { Prisma } from '@prisma/client'
import { BadRequestError, NotFoundError } from '@/errors'

function generateOrderNumber(): Promise<number> {
    return db.$transaction(async (tx) => {
        const last = await tx.order.findFirst({ orderBy: { orderNumber: 'desc' } })
        return (last?.orderNumber ?? 0) + 1
    })
}

export async function listOrders(params?: { status?: string; search?: string }) {
    const where: Prisma.OrderWhereInput = {}
    if (params?.status) where.status = params.status as any
    if (params?.search) {
        where.client = {
            OR: [
                { name: { contains: params.search } },
                { familyName: { contains: params.search } },
            ],
        }
    }

    return orderRepo.findMany({
        where,
        include: {
            client: { select: { id: true, name: true, familyName: true, phone: true } },
            items: { include: { product: { select: { name: true, brand: true } } } },
            payments: true,
            repairs: { include: { repairService: true } },
            prescription: true,
        },
        orderBy: { createdAt: 'desc' },
    }) as any
}

export async function getOrderById(id: string) {
    const order = await orderRepo.findUnique({
        where: { id },
        include: {
            client: { select: { id: true, name: true, familyName: true, phone: true, address: true } },
            items: {
                include: {
                    product: { select: { id: true, name: true, brand: true, model: true, category: true } },
                },
            },
            payments: { orderBy: { createdAt: 'asc' } },
            repairs: { include: { repairService: true } },
            prescription: true,
        },
    })
    if (!order) throw new NotFoundError('Order not found')
    return order
}

export async function createOrder(data: {
    clientId: string
    orderType?: string
    items?: { productId: string; quantity: number; unitPrice?: number }[]
    payments?: { amount: number; type: string }[]
    repairs?: { type: string; price: number; expectedCompletionDate?: string; repairServiceId?: string }[]
    prescriptionId?: string
    turnaroundDays?: number
}) {
    const { clientId, orderType, items, payments, repairs, prescriptionId, turnaroundDays } = data

    if (!clientId) throw new BadRequestError('Client is required')

    const client = await clientRepo.findUnique({ where: { id: clientId } })
    if (!client) throw new NotFoundError('Client not found')

    let totalAmount = 0
    const orderItemsData: { productId: string; quantity: number; unitPrice: number }[] = []

    if (items && items.length > 0) {
        for (const item of items) {
            const product = await productRepo.findUnique({ where: { id: item.productId } })
            if (!product) throw new NotFoundError(`Product ${item.productId} not found`)
            if (product.quantity < item.quantity) {
                throw new BadRequestError(`Insufficient stock for ${product.name}`)
            }
            const price = item.unitPrice || parseFloat(product.price.toString())
            totalAmount += price * item.quantity
            orderItemsData.push({ productId: item.productId, quantity: item.quantity, unitPrice: price })
        }
    }

    const orderNumber = await generateOrderNumber()

    let repairTotal = 0
    if (repairs && repairs.length > 0) {
        for (const r of repairs) {
            repairTotal += r.price || 0
        }
    }
    totalAmount += repairTotal

    const order = await orderRepo.create({
        data: {
            orderNumber,
            clientId,
            totalAmount,
            orderType: (orderType || 'standard') as any,
            status: orderType === 'direct_sale' ? 'completed' : 'pending',
            prescriptionId: prescriptionId || null,
            turnaroundDays: turnaroundDays || null,
            items: orderItemsData.length > 0 ? { create: orderItemsData } : undefined,
            payments: payments && payments.length > 0
                ? { create: payments.map((p) => ({ amount: p.amount, type: p.type as any })) }
                : undefined,
            repairs: repairs && repairs.length > 0
                ? {
                    create: repairs.map((r) => ({
                        type: r.type as any,
                        price: r.price,
                        status: 'pending' as any,
                        expectedCompletionDate: new Date(r.expectedCompletionDate || Date.now()),
                        repairServiceId: r.repairServiceId || null,
                    })),
                }
                : undefined,
        },
        include: {
            client: { select: { id: true, name: true, familyName: true, phone: true } },
            items: { include: { product: { select: { name: true, brand: true } } } },
            payments: true,
            repairs: { include: { repairService: true } },
            prescription: true,
        },
    })

    if (items && items.length > 0) {
        for (const item of items) {
            await productRepo.update({
                where: { id: item.productId },
                data: { quantity: { decrement: item.quantity } },
            })
            await stockAdjustmentRepo.create({
                data: { productId: item.productId, quantity: -item.quantity, reason: 'sale' },
            })
        }
    }

    return order
}

export async function updateOrderStatus(id: string, status: string) {
    if (status === 'ready') {
        return orderRepo.update({ where: { id }, data: { status: 'ready' } })
    }

    if (status === 'completed') {
        return orderRepo.update({ where: { id }, data: { status: 'completed' } })
    }

    if (status === 'cancelled') {
        const order: any = await orderRepo.findUnique({ where: { id }, include: { items: true } })
        if (!order) throw new NotFoundError('Order not found')
        for (const item of order.items) {
            await productRepo.update({
                where: { id: item.productId },
                data: { quantity: { increment: item.quantity } },
            })
        }
        return orderRepo.update({ where: { id }, data: { status: 'cancelled' } })
    }

    throw new BadRequestError('No valid updates')
}

export async function addOrderPayments(id: string, payments: { amount: number; type: string }[]) {
    if (!payments?.length) throw new BadRequestError('No valid updates')

    for (const payment of payments) {
        await paymentRepo.create({ data: { orderId: id, amount: payment.amount, type: payment.type as any } })
    }

    const order: any = await orderRepo.findUnique({ where: { id }, include: { payments: true } })
    if (order) {
        const totalPaid = order.payments.reduce((s: number, p: any) => s + parseFloat(p.amount.toString()), 0)
        if (totalPaid >= parseFloat(order.totalAmount.toString())) {
            await orderRepo.update({ where: { id }, data: { status: 'completed' } })
        }
    }

    return { success: true }
}

export async function deleteOrder(id: string) {
    const order: any = await orderRepo.findUnique({ where: { id }, include: { items: true } })
    if (!order) throw new NotFoundError('Order not found')

    for (const item of order.items) {
        await productRepo.update({
            where: { id: item.productId },
            data: { quantity: { increment: item.quantity } },
        })
    }

    await orderRepo.delete({ where: { id } })
}
