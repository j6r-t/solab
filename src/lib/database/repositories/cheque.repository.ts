import { Prisma } from '@prisma/client'
import { db } from '../db'

export const chequeRepo = {
    findMany: (args?: Prisma.ChequeFindManyArgs) => db.cheque.findMany(args),
    findUnique: (args: Prisma.ChequeFindUniqueArgs) => db.cheque.findUnique(args),
    create: (args: Prisma.ChequeCreateArgs) => db.cheque.create(args),
    update: (args: Prisma.ChequeUpdateArgs) => db.cheque.update(args),
    count: (args?: Prisma.ChequeCountArgs) => db.cheque.count(args),
}
