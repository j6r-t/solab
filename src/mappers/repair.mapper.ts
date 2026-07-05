import type { RepairResponse } from '@/dtos/repairs/repair.dto'

export function toRepairResponse(repair: any): RepairResponse {
    return {
        id: repair.id,
        orderId: repair.orderId,
        type: repair.type,
        status: repair.status,
        price: repair.price.toString(),
        expectedCompletionDate: repair.expectedCompletionDate,
        repairService: repair.repairService || null,
        createdAt: repair.createdAt,
    }
}
