import { Prisma } from '@prisma/client'
import { db } from '../db'

export const opticianShopRepo = {
    findMany: <T extends Prisma.OpticianShopFindManyArgs>(args?: T): Prisma.Result<typeof db.opticianShop, T, 'findMany'> =>
        db.opticianShop.findMany(args) as unknown as Prisma.Result<typeof db.opticianShop, T, 'findMany'>,
    findUnique: <T extends Prisma.OpticianShopFindUniqueArgs>(args: T): Prisma.Result<typeof db.opticianShop, T, 'findUnique'> =>
        db.opticianShop.findUnique(args) as unknown as Prisma.Result<typeof db.opticianShop, T, 'findUnique'>,
    create: <T extends Prisma.OpticianShopCreateArgs>(args: T): Prisma.Result<typeof db.opticianShop, T, 'create'> =>
        db.opticianShop.create(args) as unknown as Prisma.Result<typeof db.opticianShop, T, 'create'>,
    update: <T extends Prisma.OpticianShopUpdateArgs>(args: T): Prisma.Result<typeof db.opticianShop, T, 'update'> =>
        db.opticianShop.update(args) as unknown as Prisma.Result<typeof db.opticianShop, T, 'update'>,
    delete: <T extends Prisma.OpticianShopDeleteArgs>(args: T): Prisma.Result<typeof db.opticianShop, T, 'delete'> =>
        db.opticianShop.delete(args) as unknown as Prisma.Result<typeof db.opticianShop, T, 'delete'>,
    count: <T extends Prisma.OpticianShopCountArgs>(args?: T): Prisma.Result<typeof db.opticianShop, T, 'count'> =>
        db.opticianShop.count(args) as unknown as Prisma.Result<typeof db.opticianShop, T, 'count'>,
}
