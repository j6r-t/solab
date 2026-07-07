import { Prisma } from '@prisma/client'
import { db } from '../db'

export const lensBlankRepo = {
    findMany: (args?: Prisma.LensBlankFindManyArgs) => db.lensBlank.findMany(args),
    findUnique: (args: Prisma.LensBlankFindUniqueArgs) => db.lensBlank.findUnique(args),
    findFirst: (args?: Prisma.LensBlankFindFirstArgs) => db.lensBlank.findFirst(args),
    create: (args: Prisma.LensBlankCreateArgs) => db.lensBlank.create(args),
    update: (args: Prisma.LensBlankUpdateArgs) => db.lensBlank.update(args),
    delete: (args: Prisma.LensBlankDeleteArgs) => db.lensBlank.delete(args),
    count: (args?: Prisma.LensBlankCountArgs) => db.lensBlank.count(args),
}
