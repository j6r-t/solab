import { orderRepo, clientRepo, productRepo, paymentRepo, stockAdjustmentRepo, lensBlankRepo } from '@/lib/database/repositories'
import { db } from '@/lib/database/db'
import { Prisma, OrderType, OrderStatus, PaymentType, PaymentMethod, ChequeType, ChequeEntityType, AtelierWorkOrderStatus, WorkOrderSource } from '@prisma/client'
import { BadRequestError, NotFoundError } from '@/lib/errors'
import { auditService } from '@/modules/system/audit'
import { effectivePaymentTotal, isCashMethod } from '@/lib/utils/payments'

type OrderWithItems = {
    items: { lensBlankId?: string | null; productId?: string | null; quantity: number }[];
    payments?: { amount: Prisma.Decimal | number }[];
    totalAmount: Prisma.Decimal | number;
}

type PaymentInput = {
    amount: number
    type: string
    method?: string
    chequeId?: string
    dueDate?: string
    cheque?: { number: string; bankName?: string; type?: string; dueDate: string }
}

function paymentCreateData(p: PaymentInput) {
    const method = (p.method as PaymentMethod) || 'cash'
    const dueDate = p.cheque ? new Date(p.cheque.dueDate) : p.dueDate ? new Date(p.dueDate) : null
    return {
        amount: p.amount,
        type: p.type as PaymentType,
        method,
        dueDate,
        ...(p.cheque
            ? {
                cheque: {
                    create: {
                        number: p.cheque.number,
                        type: (p.cheque.type || 'standard') as ChequeType,
                        bankName: p.cheque.bankName || null,
                        amount: p.amount,
                        dueDate: new Date(p.cheque.dueDate),
                        entityType: 'client_payment' as ChequeEntityType,
                    },
                },
            }
            : { cheque: p.chequeId ? { connect: { id: p.chequeId } } : undefined }),
    }
}

function generateOrderNumber(): Promise<number> {
    return db.$transaction(async (tx) => {
        const last = await tx.order.findFirst({ orderBy: { orderNumber: 'desc' } })
        return (last?.orderNumber ?? 0) + 1
    })
}

export async function listOrders(params?: { status?: string; search?: string; clientId?: string }) {
    const where: Prisma.OrderWhereInput = {}
    if (params?.status) where.status = params.status as OrderStatus
    if (params?.clientId) where.clientId = params.clientId
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
            items: {
                include: {
                    product: { select: { name: true, brand: true } },
                    lensBlank: { select: { id: true, brand: true, lensType: true } },
                },
            },
            payments: { include: { cheque: { select: { status: true } } } },
            workOrders: { include: { workOrderServices: { include: { repairService: true } } } },
            prescription: true,
        },
        orderBy: { createdAt: 'desc' },
    })
}

export async function getOrderById(id: string) {
    const order = await orderRepo.findUnique({
        where: { id },
        include: {
            client: { select: { id: true, name: true, familyName: true, phone: true, address: true } },
            items: {
                include: {
                    product: { select: { id: true, name: true, brand: true, model: true, category: true } },
                    lensBlank: { select: { id: true, brand: true, lensType: true, material: true, thickness: true, sellingPrice: true } },
                },
            },
            payments: { orderBy: { createdAt: 'asc' }, include: { cheque: { select: { status: true } } } },
            workOrders: { include: { workOrderServices: { include: { repairService: true } } } },
            prescription: { include: { doctor: { select: { id: true, name: true } } } },
        },
    })
    if (!order) throw new NotFoundError('Order not found')
    return order
}

export async function createOrder(data: {
    clientId: string
    orderType?: string
    items?: { productId?: string; lensBlankId?: string; name?: string; quantity: number; unitPrice?: number; sellingPrice?: number }[]
    payments?: PaymentInput[]
    repairs?: { type: string; price: number; expectedCompletionDate?: string; repairServiceId?: string }[]
    prescriptionId?: string
    turnaroundDays?: number
}) {
    const { clientId, orderType, items, payments, repairs, prescriptionId, turnaroundDays } = data

    if (!clientId) throw new BadRequestError('Client is required')

    const client = await clientRepo.findUnique({ where: { id: clientId } })
    if (!client) throw new NotFoundError('Client not found')

    let totalAmount = 0
    const orderItemsData: { productId?: string; lensBlankId?: string; name?: string; quantity: number; unitPrice: number; sellingPrice?: number }[] = []

    if (items && items.length > 0) {
        for (const item of items) {
            if (item.lensBlankId) {
                const blank = await lensBlankRepo.findUnique({ where: { id: item.lensBlankId } })
                if (!blank) throw new NotFoundError(`Lens blank ${item.lensBlankId} not found`)
                if (blank.quantity < item.quantity) {
                    throw new BadRequestError(`Insufficient stock for ${blank.brand} ${blank.lensType}`)
                }
                const price = item.unitPrice || parseFloat(blank.sellingPrice.toString())
                totalAmount += price * item.quantity
                orderItemsData.push({
                    lensBlankId: item.lensBlankId,
                    name: item.name || `${blank.brand} ${blank.lensType} ${blank.material} ${blank.thickness}`,
                    quantity: item.quantity,
                    unitPrice: price,
                    sellingPrice: item.sellingPrice || parseFloat(blank.sellingPrice.toString()),
                })
            } else if (item.productId) {
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
    }

    const orderNumber = await generateOrderNumber()

    let repairTotal = 0
    if (repairs && repairs.length > 0) {
        for (const r of repairs) {
            repairTotal += r.price || 0
        }
    }
    totalAmount += repairTotal

    const isFullPayment = orderType === 'direct_sale' || payments?.some((p) => p.type === 'full' && isCashMethod(p.method))

    const order = await orderRepo.create({
        data: {
            orderNumber,
            clientId,
            totalAmount,
            orderType: (orderType || 'standard') as OrderType,
            status: isFullPayment ? 'completed' : 'pending',
            prescriptionId: prescriptionId || null,
            turnaroundDays: turnaroundDays || null,
            items: orderItemsData.length > 0 ? { create: orderItemsData } : undefined,
            payments: orderType === 'direct_sale' && totalAmount > 0
                ? { create: { amount: totalAmount, type: 'full', method: 'cash' } }
                : payments && payments.length > 0
                    ? { create: payments.map((p) => paymentCreateData(p)) }
                    : undefined,
            workOrders: repairs && repairs.length > 0
                ? {
                    create: repairs.map((r) => ({
                        source: 'internal' as WorkOrderSource,
                        servicePrice: r.price,
                        status: 'pending' as AtelierWorkOrderStatus,
                        dueDate: new Date(r.expectedCompletionDate || Date.now()),
                        expectedCompletionDate: new Date(r.expectedCompletionDate || Date.now()),
                        ...(r.repairServiceId
                            ? { workOrderServices: { create: { repairServiceId: r.repairServiceId, price: r.price } } }
                            : {}),
                    })),
                }
                : undefined,
        },
        include: {
            client: { select: { id: true, name: true, familyName: true, phone: true } },
            items: {
                include: {
                    product: { select: { name: true, brand: true } },
                    lensBlank: { select: { id: true, brand: true, lensType: true, material: true, thickness: true } },
                },
            },
            payments: true,
            workOrders: { include: { workOrderServices: { include: { repairService: true } } } },
            prescription: true,
        },
    })

    if (items && items.length > 0) {
        for (const item of items) {
            const qty = item.quantity || 1
            if (item.lensBlankId) {
                await lensBlankRepo.update({
                    where: { id: item.lensBlankId },
                    data: { quantity: { decrement: qty } },
                })
            } else if (item.productId) {
                await productRepo.update({
                    where: { id: item.productId },
                    data: { quantity: { decrement: qty } },
                })
                await stockAdjustmentRepo.create({
                    data: { productId: item.productId, quantity: -qty, reason: 'sale' },
                })
            }
        }
    }

    await auditService.log({ action: 'ORDER_CREATED', entityType: 'ORDER', entityId: order.id, metadata: { orderNumber: order.orderNumber, totalAmount: Number(order.totalAmount), itemsCount: items?.length || 0, orderType } })
    return order
}

export async function updateOrderStatus(id: string, status: string) {
    if (status === 'ready') {
        return orderRepo.update({ where: { id }, data: { status: 'ready' } })
    }

    if (status === 'completed') {
        const result = await orderRepo.update({ where: { id }, data: { status: 'completed' } })
        await auditService.log({ action: 'ORDER_COMPLETED', entityType: 'ORDER', entityId: id })
        return result
    }

    if (status === 'cancelled') {
        const order = await orderRepo.findUnique({ where: { id }, include: { items: true } }) as OrderWithItems | null
        if (!order) throw new NotFoundError('Order not found')
        for (const item of order.items) {
            if (item.lensBlankId) {
                await lensBlankRepo.update({
                    where: { id: item.lensBlankId },
                    data: { quantity: { increment: item.quantity } },
                })
            } else if (item.productId) {
                await productRepo.update({
                    where: { id: item.productId },
                    data: { quantity: { increment: item.quantity } },
                })
            }
        }
        const result = await orderRepo.update({ where: { id }, data: { status: 'cancelled' } })
        await auditService.log({ action: 'ORDER_CANCELLED', entityType: 'ORDER', entityId: id })
        return result
    }

    throw new BadRequestError('No valid updates')
}

export async function addOrderPayments(id: string, payments: PaymentInput[]) {
    if (!payments?.length) throw new BadRequestError('No valid updates')

    for (const payment of payments) {
        await paymentRepo.create({
            data: {
                order: { connect: { id } },
                ...paymentCreateData(payment),
            },
        })
    }

    const order = await orderRepo.findUnique({
        where: { id },
        include: { payments: { include: { cheque: { select: { status: true } } } } },
    })
    if (order) {
        const totalPaid = effectivePaymentTotal(order.payments.map((p) => ({ amount: p.amount.toString(), method: p.method, cheque: p.cheque })), 'client')
        if (totalPaid >= parseFloat(order.totalAmount.toString())) {
            await orderRepo.update({ where: { id }, data: { status: 'completed' } })
        }
    }

    await auditService.log({ action: 'PAYMENT_ADDED', entityType: 'ORDER', entityId: id, metadata: { paymentsCount: payments.length } })
    return { success: true }
}

export async function deleteOrder(id: string) {
    const order = await orderRepo.findUnique({ where: { id }, include: { items: true } }) as OrderWithItems | null
    if (!order) throw new NotFoundError('Order not found')

    for (const item of order.items) {
        if (item.lensBlankId) {
            await lensBlankRepo.update({
                where: { id: item.lensBlankId },
                data: { quantity: { increment: item.quantity } },
            })
        } else if (item.productId) {
            await productRepo.update({
                where: { id: item.productId },
                data: { quantity: { increment: item.quantity } },
            })
        }
    }

    await orderRepo.update({ where: { id }, data: { deletedAt: new Date() } })
    await auditService.log({ action: 'ORDER_DELETED', entityType: 'ORDER', entityId: id })
}
