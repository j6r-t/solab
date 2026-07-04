import { Prisma } from '@prisma/client'
import { db } from '../db'

export const orderRepo = {
    findMany: (args?: Prisma.OrderFindManyArgs) => db.order.findMany(args),
    findUnique: (args: Prisma.OrderFindUniqueArgs) => db.order.findUnique(args),
    create: (args: Prisma.OrderCreateArgs) => db.order.create(args),
    update: (args: Prisma.OrderUpdateArgs) => db.order.update(args),
    delete: (args: Prisma.OrderDeleteArgs) => db.order.delete(args),
    count: (args?: Prisma.OrderCountArgs) => db.order.count(args),
    aggregate: (args: Prisma.OrderAggregateArgs) => db.order.aggregate(args) as any,
}

export const paymentRepo = {
    create: (args: Prisma.PaymentCreateArgs) => db.payment.create(args),
}
