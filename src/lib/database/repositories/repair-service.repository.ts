import { Prisma } from '@prisma/client'
import { db } from '../db'

export const repairServiceRepo = {
    findMany: (args?: Prisma.RepairServiceFindManyArgs) => db.repairService.findMany(args),
    findUnique: (args: Prisma.RepairServiceFindUniqueArgs) => db.repairService.findUnique(args),
    findFirst: (args?: Prisma.RepairServiceFindFirstArgs) => db.repairService.findFirst(args),
    create: (args: Prisma.RepairServiceCreateArgs) => db.repairService.create(args),
    update: (args: Prisma.RepairServiceUpdateArgs) => db.repairService.update(args),
    delete: (args: Prisma.RepairServiceDeleteArgs) => db.repairService.delete(args),
    count: (args?: Prisma.RepairServiceCountArgs) => db.repairService.count(args),
}
