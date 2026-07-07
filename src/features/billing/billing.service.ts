import { orderRepo } from '@/lib/database/repositories'
import { Prisma } from '@prisma/client'

export async function listBilling(params?: { status?: string; search?: string; start?: string; end?: string }) {
    const where: Prisma.OrderWhereInput = {}
    if (params?.status) where.status = params.status as any
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
            items: { include: { product: { select: { id: true, name: true, brand: true, model: true, category: true } } } },
            payments: { orderBy: { createdAt: 'asc' } },
            workOrders: { include: { repairService: true } },
            prescription: { include: { doctor: { select: { name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
    }) as any
}
