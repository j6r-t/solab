import { Prisma } from '@prisma/client'
import { db } from '../db'

export const prescriptionRepo = {
    findMany: (args?: Prisma.PrescriptionFindManyArgs) => db.prescription.findMany(args),
    findUnique: (args: Prisma.PrescriptionFindUniqueArgs) => db.prescription.findUnique(args),
    create: (args: Prisma.PrescriptionCreateArgs) => db.prescription.create(args),
    update: (args: Prisma.PrescriptionUpdateArgs) => db.prescription.update(args),
    delete: (args: Prisma.PrescriptionDeleteArgs) => db.prescription.delete(args),
    count: (args?: Prisma.PrescriptionCountArgs) => db.prescription.count(args),
}
