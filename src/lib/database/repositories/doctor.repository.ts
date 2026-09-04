import { Prisma } from '@prisma/client'
import { db } from '../db'

export const doctorRepo = {
    findMany: <T extends Prisma.DoctorFindManyArgs>(args?: T): Prisma.Result<typeof db.doctor, T, 'findMany'> =>
        db.doctor.findMany(args) as unknown as Prisma.Result<typeof db.doctor, T, 'findMany'>,
    findUnique: <T extends Prisma.DoctorFindUniqueArgs>(args: T): Prisma.Result<typeof db.doctor, T, 'findUnique'> =>
        db.doctor.findUnique(args) as unknown as Prisma.Result<typeof db.doctor, T, 'findUnique'>,
    create: <T extends Prisma.DoctorCreateArgs>(args: T): Prisma.Result<typeof db.doctor, T, 'create'> =>
        db.doctor.create(args) as unknown as Prisma.Result<typeof db.doctor, T, 'create'>,
    update: <T extends Prisma.DoctorUpdateArgs>(args: T): Prisma.Result<typeof db.doctor, T, 'update'> =>
        db.doctor.update(args) as unknown as Prisma.Result<typeof db.doctor, T, 'update'>,
    delete: <T extends Prisma.DoctorDeleteArgs>(args: T): Prisma.Result<typeof db.doctor, T, 'delete'> =>
        db.doctor.delete(args) as unknown as Prisma.Result<typeof db.doctor, T, 'delete'>,
    count: <T extends Prisma.DoctorCountArgs>(args?: T): Prisma.Result<typeof db.doctor, T, 'count'> =>
        db.doctor.count(args) as unknown as Prisma.Result<typeof db.doctor, T, 'count'>,
}
