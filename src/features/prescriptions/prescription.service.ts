import { prescriptionRepo } from '@/lib/database/repositories'

export async function listPrescriptions(params?: { clientId?: string; doctorId?: string }) {
    const where: Record<string, unknown> = {}
    if (params?.clientId) where.clientId = params.clientId
    if (params?.doctorId) where.doctorId = params.doctorId
    return prescriptionRepo.findMany({
        where,
        include: {
            client: { select: { name: true, familyName: true, phone: true } },
            doctor: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
    })
}

export async function createPrescription(data: Record<string, unknown>) {
    const record = { ...data }
    if (record.dateWritten && typeof record.dateWritten === 'string' && record.dateWritten.match(/^\d{4}-\d{2}-\d{2}$/)) {
        record.dateWritten = new Date(record.dateWritten).toISOString()
    }
    return prescriptionRepo.create({ data: record as any })
}

export async function updatePrescription(id: string, data: Record<string, unknown>) {
    const record = { ...data }
    if (record.dateWritten && typeof record.dateWritten === 'string' && record.dateWritten.match(/^\d{4}-\d{2}-\d{2}$/)) {
        record.dateWritten = new Date(record.dateWritten).toISOString()
    }
    return prescriptionRepo.update({ where: { id }, data: record as any })
}

export async function deletePrescription(id: string) {
    await prescriptionRepo.delete({ where: { id } })
}
