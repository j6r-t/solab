import { Prisma } from '@prisma/client'
import { db } from '../db'

export const opticianShopRepo = {
    findMany: (args?: Prisma.OpticianShopFindManyArgs) => db.opticianShop.findMany(args),
    findUnique: (args: Prisma.OpticianShopFindUniqueArgs) => db.opticianShop.findUnique(args),
    create: (args: Prisma.OpticianShopCreateArgs) => db.opticianShop.create(args),
    update: (args: Prisma.OpticianShopUpdateArgs) => db.opticianShop.update(args),
    delete: (args: Prisma.OpticianShopDeleteArgs) => db.opticianShop.delete(args),
    count: (args?: Prisma.OpticianShopCountArgs) => db.opticianShop.count(args),
}
