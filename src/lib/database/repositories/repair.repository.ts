import { Prisma } from '@prisma/client'
import { db } from '../db'

export const repairRepo = {
    findMany: (args?: Prisma.RepairFindManyArgs) => db.repair.findMany(args),
    findUnique: (args: Prisma.RepairFindUniqueArgs) => db.repair.findUnique(args),
    findFirst: (args?: Prisma.RepairFindFirstArgs) => db.repair.findFirst(args),
    create: (args: Prisma.RepairCreateArgs) => db.repair.create(args),
    update: (args: Prisma.RepairUpdateArgs) => db.repair.update(args),
    delete: (args: Prisma.RepairDeleteArgs) => db.repair.delete(args),
    count: (args?: Prisma.RepairCountArgs) => db.repair.count(args),
}
