import type { BankResponse } from '@/modules/system/banks/dtos/bank.dto'

export function toBankResponse(item: { id: string; name: string; createdAt: Date; updatedAt: Date }): BankResponse {
    return {
        id: item.id,
        name: item.name,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
    }
}
