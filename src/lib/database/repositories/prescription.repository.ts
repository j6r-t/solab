import { Prisma } from '@prisma/client'
import { db } from '../db'

export const prescriptionRepo = {
    findMany: <T extends Prisma.PrescriptionFindManyArgs>(args?: T): Prisma.Result<typeof db.prescription, T, 'findMany'> =>
        db.prescription.findMany(args) as unknown as Prisma.Result<typeof db.prescription, T, 'findMany'>,
    findUnique: <T extends Prisma.PrescriptionFindUniqueArgs>(args: T): Prisma.Result<typeof db.prescription, T, 'findUnique'> =>
        db.prescription.findUnique(args) as unknown as Prisma.Result<typeof db.prescription, T, 'findUnique'>,
    create: <T extends Prisma.PrescriptionCreateArgs>(args: T): Prisma.Result<typeof db.prescription, T, 'create'> =>
        db.prescription.create(args) as unknown as Prisma.Result<typeof db.prescription, T, 'create'>,
    update: <T extends Prisma.PrescriptionUpdateArgs>(args: T): Prisma.Result<typeof db.prescription, T, 'update'> =>
        db.prescription.update(args) as unknown as Prisma.Result<typeof db.prescription, T, 'update'>,
    delete: <T extends Prisma.PrescriptionDeleteArgs>(args: T): Prisma.Result<typeof db.prescription, T, 'delete'> =>
        db.prescription.delete(args) as unknown as Prisma.Result<typeof db.prescription, T, 'delete'>,
    count: <T extends Prisma.PrescriptionCountArgs>(args?: T): Prisma.Result<typeof db.prescription, T, 'count'> =>
        db.prescription.count(args) as unknown as Prisma.Result<typeof db.prescription, T, 'count'>,
}
