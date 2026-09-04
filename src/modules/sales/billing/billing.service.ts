import { orderRepo } from '@/lib/database/repositories'
import { OrderStatus, Prisma } from '@prisma/client'

export async function listBilling(params?: { status?: string; search?: string; start?: string; end?: string }) {
    const where: Prisma.OrderWhereInput = {}
    if (params?.status) where.status = params.status as OrderStatus
    else where.status = { not: 'cancelled' }
    if (params?.start && params?.end) {
        where.createdAt = { gte: new Date(params.start), lte: new Date(params.end) }
    }
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
            client: { select: { id: true, name: true, familyName: true, phone: true, address: true } },
            items: { include: { product: { select: { id: true, name: true, brand: true, model: true, category: true } }, lensBlank: { select: { id: true, brand: true, lensType: true } } } },
            payments: { orderBy: { createdAt: 'asc' }, include: { cheque: true } },
            workOrders: { include: { workOrderServices: { include: { repairService: true } } } },
            prescription: { include: { doctor: { select: { name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
    })
}
