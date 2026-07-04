import { Prisma } from '@prisma/client'
import { db } from '../db'

export const doctorRepo = {
    findMany: (args?: Prisma.DoctorFindManyArgs) => db.doctor.findMany(args),
    findUnique: (args: Prisma.DoctorFindUniqueArgs) => db.doctor.findUnique(args),
    create: (args: Prisma.DoctorCreateArgs) => db.doctor.create(args),
    update: (args: Prisma.DoctorUpdateArgs) => db.doctor.update(args),
    delete: (args: Prisma.DoctorDeleteArgs) => db.doctor.delete(args),
    count: (args?: Prisma.DoctorCountArgs) => db.doctor.count(args),
}
