import { Prisma } from '@prisma/client'
import { db } from '../db'

export const productRepo = {
    findMany: (args?: Prisma.ProductFindManyArgs) => db.product.findMany(args),
    findUnique: (args: Prisma.ProductFindUniqueArgs) => db.product.findUnique(args),
    create: (args: Prisma.ProductCreateArgs) => db.product.create(args),
    update: (args: Prisma.ProductUpdateArgs) => db.product.update(args),
    delete: (args: Prisma.ProductDeleteArgs) => db.product.delete(args),
    count: (args?: Prisma.ProductCountArgs) => db.product.count(args),
    aggregate: (args: Prisma.ProductAggregateArgs) => db.product.aggregate(args),
}

export const qrcodeRepo = {
    findUnique: (args: Prisma.QRCodeFindUniqueArgs) => db.qRCode.findUnique(args),
}

export const stockAdjustmentRepo = {
    create: (args: Prisma.StockAdjustmentCreateArgs) => db.stockAdjustment.create(args),
}
