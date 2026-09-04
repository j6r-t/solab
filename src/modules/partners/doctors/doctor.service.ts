import { doctorRepo } from '@/lib/database/repositories'
import { Prisma } from '@prisma/client'
import { NotFoundError } from '@/lib/errors'

export async function listDoctors(params?: { search?: string }) {
    const where: Prisma.DoctorWhereInput = {}
    if (params?.search) {
        where.OR = [
            { name: { contains: params.search } },
            { phone: { contains: params.search } },
            { specialization: { contains: params.search } },
        ]
    }
    return doctorRepo.findMany({
        where,
        orderBy: { name: 'asc' },
        include: { _count: { select: { prescriptions: true } } },
    })
}

interface DoctorInput {
    name: string
    phone?: string
    address?: string | null
    specialization?: string | null
}

export async function createDoctor(data: DoctorInput) {
    return doctorRepo.create({
        data: {
            name: data.name,
            phone: data.phone ?? '',
            address: data.address ?? null,
            specialization: data.specialization ?? null,
        },
    })
}

export async function updateDoctor(id: string, data: Partial<DoctorInput>) {
    const existing = await doctorRepo.findUnique({ where: { id } })
    if (!existing) throw new NotFoundError('Doctor not found')
    return doctorRepo.update({ where: { id }, data })
}

export async function deleteDoctor(id: string) {
    const existing = await doctorRepo.findUnique({ where: { id } })
    if (!existing) throw new NotFoundError('Doctor not found')
    await doctorRepo.update({ where: { id }, data: { deletedAt: new Date() } })
}
