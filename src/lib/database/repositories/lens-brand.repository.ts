import { Prisma } from '@prisma/client'
import { db } from '../db'

export const lensBrandRepo = {
    findMany: (args?: Prisma.LensBrandFindManyArgs) => db.lensBrand.findMany(args),
    findUnique: (args: Prisma.LensBrandFindUniqueArgs) => db.lensBrand.findUnique(args),
    create: (args: Prisma.LensBrandCreateArgs) => db.lensBrand.create(args),
    update: (args: Prisma.LensBrandUpdateArgs) => db.lensBrand.update(args),
    delete: (args: Prisma.LensBrandDeleteArgs) => db.lensBrand.delete(args),
}
