import { db } from '../database/db'

const smsConfig = {
    enabled: false,
    provider: 'log' as const,
}

export async function sendSms(phone: string, message: string, clientId: string): Promise<{ success: boolean }> {
    try {
        if (!smsConfig.enabled) {
            await db.smsLog.create({
                data: { clientId, phone, message, status: 'sent' },
            })
            return { success: true }
        }
        await db.smsLog.create({
            data: { clientId, phone, message, status: 'sent' },
        })
        return { success: true }
    } catch (error) {
        console.error('SMS send error:', error)
        try {
            await db.smsLog.create({
                data: { clientId, phone, message, status: 'failed' },
            })
        } catch {}
        return { success: false }
    }
}

export async function sendRepairReadySms(repairId: string): Promise<{ success: boolean }> {
    const repair = await db.repair.findUnique({
        where: { id: repairId },
        include: {
            order: {
                include: { client: true },
            },
            repairService: true,
        },
    })
    if (!repair || !repair.order?.client) return { success: false }
    const client = repair.order.client
    const serviceName = repair.repairService?.name || repair.type
    const message = `Bonjour ${client.name} ${client.familyName}, votre réparation (${serviceName}) est terminée. Vous pouvez venir la récupérer chez Sofien Optic. Merci.`
    return sendSms(client.phone, message, client.id)
}
