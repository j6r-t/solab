import { Prisma } from '@prisma/client'
import { db } from '../db'

export const purchaseInvoiceRepo = {
    findMany: <T extends Prisma.PurchaseInvoiceFindManyArgs>(args?: T): Prisma.Result<typeof db.purchaseInvoice, T, 'findMany'> =>
        db.purchaseInvoice.findMany(args) as unknown as Prisma.Result<typeof db.purchaseInvoice, T, 'findMany'>,
    findUnique: <T extends Prisma.PurchaseInvoiceFindUniqueArgs>(args: T): Prisma.Result<typeof db.purchaseInvoice, T, 'findUnique'> =>
        db.purchaseInvoice.findUnique(args) as unknown as Prisma.Result<typeof db.purchaseInvoice, T, 'findUnique'>,
    create: <T extends Prisma.PurchaseInvoiceCreateArgs>(args: T): Prisma.Result<typeof db.purchaseInvoice, T, 'create'> =>
        db.purchaseInvoice.create(args) as unknown as Prisma.Result<typeof db.purchaseInvoice, T, 'create'>,
    update: <T extends Prisma.PurchaseInvoiceUpdateArgs>(args: T): Prisma.Result<typeof db.purchaseInvoice, T, 'update'> =>
        db.purchaseInvoice.update(args) as unknown as Prisma.Result<typeof db.purchaseInvoice, T, 'update'>,
    delete: <T extends Prisma.PurchaseInvoiceDeleteArgs>(args: T): Prisma.Result<typeof db.purchaseInvoice, T, 'delete'> =>
        db.purchaseInvoice.delete(args) as unknown as Prisma.Result<typeof db.purchaseInvoice, T, 'delete'>,
    count: <T extends Prisma.PurchaseInvoiceCountArgs>(args?: T): Prisma.Result<typeof db.purchaseInvoice, T, 'count'> =>
        db.purchaseInvoice.count(args) as unknown as Prisma.Result<typeof db.purchaseInvoice, T, 'count'>,
}
