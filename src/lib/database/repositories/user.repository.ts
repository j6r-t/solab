import { Prisma } from '@prisma/client'
import { db } from '../db'

export const userRepo = {
    findUnique: (args: Prisma.UserFindUniqueArgs) => db.user.findUnique(args),
    findFirst: (args?: Prisma.UserFindFirstArgs) => db.user.findFirst(args),
    create: (args: Prisma.UserCreateArgs) => db.user.create(args),
    update: (args: Prisma.UserUpdateArgs) => db.user.update(args),
}
