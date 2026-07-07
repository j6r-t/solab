import { Prisma } from '@prisma/client'
import { db } from '../db'

export const repairRepo = {
    findMany: (args?: Prisma.AtelierWorkOrderFindManyArgs) => db.atelierWorkOrder.findMany(args),
    findUnique: (args: Prisma.AtelierWorkOrderFindUniqueArgs) => db.atelierWorkOrder.findUnique(args),
    findFirst: (args?: Prisma.AtelierWorkOrderFindFirstArgs) => db.atelierWorkOrder.findFirst(args),
    create: (args: Prisma.AtelierWorkOrderCreateArgs) => db.atelierWorkOrder.create(args),
    update: (args: Prisma.AtelierWorkOrderUpdateArgs) => db.atelierWorkOrder.update(args),
    delete: (args: Prisma.AtelierWorkOrderDeleteArgs) => db.atelierWorkOrder.delete(args),
    count: (args?: Prisma.AtelierWorkOrderCountArgs) => db.atelierWorkOrder.count(args),
}
