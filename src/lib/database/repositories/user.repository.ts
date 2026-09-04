import { Prisma } from '@prisma/client'
import { db } from '../db'

export const userRepo = {
    findMany: <T extends Prisma.UserFindManyArgs>(args?: T): Prisma.Result<typeof db.user, T, 'findMany'> =>
        db.user.findMany(args) as unknown as Prisma.Result<typeof db.user, T, 'findMany'>,
    findUnique: <T extends Prisma.UserFindUniqueArgs>(args: T): Prisma.Result<typeof db.user, T, 'findUnique'> =>
        db.user.findUnique(args) as unknown as Prisma.Result<typeof db.user, T, 'findUnique'>,
    findFirst: <T extends Prisma.UserFindFirstArgs>(args?: T): Prisma.Result<typeof db.user, T, 'findFirst'> =>
        db.user.findFirst(args) as unknown as Prisma.Result<typeof db.user, T, 'findFirst'>,
    create: <T extends Prisma.UserCreateArgs>(args: T): Prisma.Result<typeof db.user, T, 'create'> =>
        db.user.create(args) as unknown as Prisma.Result<typeof db.user, T, 'create'>,
    update: <T extends Prisma.UserUpdateArgs>(args: T): Prisma.Result<typeof db.user, T, 'update'> =>
        db.user.update(args) as unknown as Prisma.Result<typeof db.user, T, 'update'>,
    delete: <T extends Prisma.UserDeleteArgs>(args: T): Prisma.Result<typeof db.user, T, 'delete'> =>
        db.user.delete(args) as unknown as Prisma.Result<typeof db.user, T, 'delete'>,
}
