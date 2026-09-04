import { Prisma } from '@prisma/client'
import { db } from '../db'

export const repairRepo = {
    findMany: <T extends Prisma.AtelierWorkOrderFindManyArgs>(args?: T): Prisma.Result<typeof db.atelierWorkOrder, T, 'findMany'> =>
        db.atelierWorkOrder.findMany(args) as unknown as Prisma.Result<typeof db.atelierWorkOrder, T, 'findMany'>,
    findUnique: <T extends Prisma.AtelierWorkOrderFindUniqueArgs>(args: T): Prisma.Result<typeof db.atelierWorkOrder, T, 'findUnique'> =>
        db.atelierWorkOrder.findUnique(args) as unknown as Prisma.Result<typeof db.atelierWorkOrder, T, 'findUnique'>,
    findFirst: <T extends Prisma.AtelierWorkOrderFindFirstArgs>(args?: T): Prisma.Result<typeof db.atelierWorkOrder, T, 'findFirst'> =>
        db.atelierWorkOrder.findFirst(args) as unknown as Prisma.Result<typeof db.atelierWorkOrder, T, 'findFirst'>,
    create: <T extends Prisma.AtelierWorkOrderCreateArgs>(args: T): Prisma.Result<typeof db.atelierWorkOrder, T, 'create'> =>
        db.atelierWorkOrder.create(args) as unknown as Prisma.Result<typeof db.atelierWorkOrder, T, 'create'>,
    update: <T extends Prisma.AtelierWorkOrderUpdateArgs>(args: T): Prisma.Result<typeof db.atelierWorkOrder, T, 'update'> =>
        db.atelierWorkOrder.update(args) as unknown as Prisma.Result<typeof db.atelierWorkOrder, T, 'update'>,
    delete: <T extends Prisma.AtelierWorkOrderDeleteArgs>(args: T): Prisma.Result<typeof db.atelierWorkOrder, T, 'delete'> =>
        db.atelierWorkOrder.delete(args) as unknown as Prisma.Result<typeof db.atelierWorkOrder, T, 'delete'>,
    count: <T extends Prisma.AtelierWorkOrderCountArgs>(args?: T): Prisma.Result<typeof db.atelierWorkOrder, T, 'count'> =>
        db.atelierWorkOrder.count(args) as unknown as Prisma.Result<typeof db.atelierWorkOrder, T, 'count'>,
}
