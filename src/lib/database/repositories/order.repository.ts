import { Prisma } from '@prisma/client'
import { db } from '../db'

export const orderRepo = {
    findMany: <T extends Prisma.OrderFindManyArgs>(args?: T): Prisma.Result<typeof db.order, T, 'findMany'> =>
        db.order.findMany(args) as unknown as Prisma.Result<typeof db.order, T, 'findMany'>,
    findUnique: <T extends Prisma.OrderFindUniqueArgs>(args: T): Prisma.Result<typeof db.order, T, 'findUnique'> =>
        db.order.findUnique(args) as unknown as Prisma.Result<typeof db.order, T, 'findUnique'>,
    create: <T extends Prisma.OrderCreateArgs>(args: T): Prisma.Result<typeof db.order, T, 'create'> =>
        db.order.create(args) as unknown as Prisma.Result<typeof db.order, T, 'create'>,
    update: <T extends Prisma.OrderUpdateArgs>(args: T): Prisma.Result<typeof db.order, T, 'update'> =>
        db.order.update(args) as unknown as Prisma.Result<typeof db.order, T, 'update'>,
    delete: <T extends Prisma.OrderDeleteArgs>(args: T): Prisma.Result<typeof db.order, T, 'delete'> =>
        db.order.delete(args) as unknown as Prisma.Result<typeof db.order, T, 'delete'>,
    count: <T extends Prisma.OrderCountArgs>(args?: T): Prisma.Result<typeof db.order, T, 'count'> =>
        db.order.count(args) as unknown as Prisma.Result<typeof db.order, T, 'count'>,
    aggregate: <T extends Prisma.OrderAggregateArgs>(args: T): Prisma.Result<typeof db.order, T, 'aggregate'> =>
        db.order.aggregate(args) as unknown as Prisma.Result<typeof db.order, T, 'aggregate'>,
}

export const paymentRepo = {
    create: <T extends Prisma.PaymentCreateArgs>(args: T): Prisma.Result<typeof db.payment, T, 'create'> =>
        db.payment.create(args) as unknown as Prisma.Result<typeof db.payment, T, 'create'>,
}
