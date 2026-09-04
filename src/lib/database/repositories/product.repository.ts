import { Prisma } from '@prisma/client'
import { db } from '../db'

export const productRepo = {
    findMany: <T extends Prisma.ProductFindManyArgs>(args?: T): Prisma.Result<typeof db.product, T, 'findMany'> =>
        db.product.findMany(args) as unknown as Prisma.Result<typeof db.product, T, 'findMany'>,
    findUnique: <T extends Prisma.ProductFindUniqueArgs>(args: T): Prisma.Result<typeof db.product, T, 'findUnique'> =>
        db.product.findUnique(args) as unknown as Prisma.Result<typeof db.product, T, 'findUnique'>,
    create: <T extends Prisma.ProductCreateArgs>(args: T): Prisma.Result<typeof db.product, T, 'create'> =>
        db.product.create(args) as unknown as Prisma.Result<typeof db.product, T, 'create'>,
    update: <T extends Prisma.ProductUpdateArgs>(args: T): Prisma.Result<typeof db.product, T, 'update'> =>
        db.product.update(args) as unknown as Prisma.Result<typeof db.product, T, 'update'>,
    delete: <T extends Prisma.ProductDeleteArgs>(args: T): Prisma.Result<typeof db.product, T, 'delete'> =>
        db.product.delete(args) as unknown as Prisma.Result<typeof db.product, T, 'delete'>,
    count: <T extends Prisma.ProductCountArgs>(args?: T): Prisma.Result<typeof db.product, T, 'count'> =>
        db.product.count(args) as unknown as Prisma.Result<typeof db.product, T, 'count'>,
    aggregate: <T extends Prisma.ProductAggregateArgs>(args: T): Prisma.Result<typeof db.product, T, 'aggregate'> =>
        db.product.aggregate(args) as unknown as Prisma.Result<typeof db.product, T, 'aggregate'>,
}

export const qrcodeRepo = {
    findUnique: <T extends Prisma.QRCodeFindUniqueArgs>(args: T): Prisma.Result<typeof db.qRCode, T, 'findUnique'> =>
        db.qRCode.findUnique(args) as unknown as Prisma.Result<typeof db.qRCode, T, 'findUnique'>,
}

export const stockAdjustmentRepo = {
    create: <T extends Prisma.StockAdjustmentCreateArgs>(args: T): Prisma.Result<typeof db.stockAdjustment, T, 'create'> =>
        db.stockAdjustment.create(args) as unknown as Prisma.Result<typeof db.stockAdjustment, T, 'create'>,
}
