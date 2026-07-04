import { Prisma } from '@prisma/client'
import { db } from '../db'

export const clientRepo = {
    findMany: (args?: Prisma.ClientFindManyArgs) => db.client.findMany(args),
    findUnique: (args: Prisma.ClientFindUniqueArgs) => db.client.findUnique(args),
    create: (args: Prisma.ClientCreateArgs) => db.client.create(args),
    update: (args: Prisma.ClientUpdateArgs) => db.client.update(args),
    delete: (args: Prisma.ClientDeleteArgs) => db.client.delete(args),
    count: (args?: Prisma.ClientCountArgs) => db.client.count(args),
}
