import { Prisma } from '@prisma/client'
import { db } from '../db'

export const clientRepo = {
    findMany: <T extends Prisma.ClientFindManyArgs>(args?: T): Prisma.Result<typeof db.client, T, 'findMany'> =>
        db.client.findMany(args) as unknown as Prisma.Result<typeof db.client, T, 'findMany'>,
    findUnique: <T extends Prisma.ClientFindUniqueArgs>(args: T): Prisma.Result<typeof db.client, T, 'findUnique'> =>
        db.client.findUnique(args) as unknown as Prisma.Result<typeof db.client, T, 'findUnique'>,
    create: <T extends Prisma.ClientCreateArgs>(args: T): Prisma.Result<typeof db.client, T, 'create'> =>
        db.client.create(args) as unknown as Prisma.Result<typeof db.client, T, 'create'>,
    update: <T extends Prisma.ClientUpdateArgs>(args: T): Prisma.Result<typeof db.client, T, 'update'> =>
        db.client.update(args) as unknown as Prisma.Result<typeof db.client, T, 'update'>,
    delete: <T extends Prisma.ClientDeleteArgs>(args: T): Prisma.Result<typeof db.client, T, 'delete'> =>
        db.client.delete(args) as unknown as Prisma.Result<typeof db.client, T, 'delete'>,
    count: <T extends Prisma.ClientCountArgs>(args?: T): Prisma.Result<typeof db.client, T, 'count'> =>
        db.client.count(args) as unknown as Prisma.Result<typeof db.client, T, 'count'>,
}
