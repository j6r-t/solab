import { Prisma } from '@prisma/client'
import { db } from '../db'

export const repairServiceRepo = {
    findMany: <T extends Prisma.RepairServiceFindManyArgs>(args?: T): Prisma.Result<typeof db.repairService, T, 'findMany'> =>
        db.repairService.findMany(args) as unknown as Prisma.Result<typeof db.repairService, T, 'findMany'>,
    findUnique: <T extends Prisma.RepairServiceFindUniqueArgs>(args: T): Prisma.Result<typeof db.repairService, T, 'findUnique'> =>
        db.repairService.findUnique(args) as unknown as Prisma.Result<typeof db.repairService, T, 'findUnique'>,
    findFirst: <T extends Prisma.RepairServiceFindFirstArgs>(args?: T): Prisma.Result<typeof db.repairService, T, 'findFirst'> =>
        db.repairService.findFirst(args) as unknown as Prisma.Result<typeof db.repairService, T, 'findFirst'>,
    create: <T extends Prisma.RepairServiceCreateArgs>(args: T): Prisma.Result<typeof db.repairService, T, 'create'> =>
        db.repairService.create(args) as unknown as Prisma.Result<typeof db.repairService, T, 'create'>,
    update: <T extends Prisma.RepairServiceUpdateArgs>(args: T): Prisma.Result<typeof db.repairService, T, 'update'> =>
        db.repairService.update(args) as unknown as Prisma.Result<typeof db.repairService, T, 'update'>,
    delete: <T extends Prisma.RepairServiceDeleteArgs>(args: T): Prisma.Result<typeof db.repairService, T, 'delete'> =>
        db.repairService.delete(args) as unknown as Prisma.Result<typeof db.repairService, T, 'delete'>,
    count: <T extends Prisma.RepairServiceCountArgs>(args?: T): Prisma.Result<typeof db.repairService, T, 'count'> =>
        db.repairService.count(args) as unknown as Prisma.Result<typeof db.repairService, T, 'count'>,
}
