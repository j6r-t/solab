import { Prisma } from '@prisma/client'
import { db } from '../db'

export const purchaseInvoiceRepo = {
    findMany: (args?: Prisma.PurchaseInvoiceFindManyArgs) => db.purchaseInvoice.findMany(args),
    findUnique: (args: Prisma.PurchaseInvoiceFindUniqueArgs) => db.purchaseInvoice.findUnique(args),
    create: (args: Prisma.PurchaseInvoiceCreateArgs) => db.purchaseInvoice.create(args),
    update: (args: Prisma.PurchaseInvoiceUpdateArgs) => db.purchaseInvoice.update(args),
    delete: (args: Prisma.PurchaseInvoiceDeleteArgs) => db.purchaseInvoice.delete(args),
    count: (args?: Prisma.PurchaseInvoiceCountArgs) => db.purchaseInvoice.count(args),
}
