import { Prisma } from '@prisma/client'
import { db } from '../db'

export const bankRepo = {
    findMany: <T extends Prisma.BankFindManyArgs>(args?: T): Prisma.Result<typeof db.bank, T, 'findMany'> =>
        db.bank.findMany(args) as unknown as Prisma.Result<typeof db.bank, T, 'findMany'>,
    findUnique: <T extends Prisma.BankFindUniqueArgs>(args: T): Prisma.Result<typeof db.bank, T, 'findUnique'> =>
        db.bank.findUnique(args) as unknown as Prisma.Result<typeof db.bank, T, 'findUnique'>,
    create: <T extends Prisma.BankCreateArgs>(args: T): Prisma.Result<typeof db.bank, T, 'create'> =>
        db.bank.create(args) as unknown as Prisma.Result<typeof db.bank, T, 'create'>,
    update: <T extends Prisma.BankUpdateArgs>(args: T): Prisma.Result<typeof db.bank, T, 'update'> =>
        db.bank.update(args) as unknown as Prisma.Result<typeof db.bank, T, 'update'>,
    delete: <T extends Prisma.BankDeleteArgs>(args: T): Prisma.Result<typeof db.bank, T, 'delete'> =>
        db.bank.delete(args) as unknown as Prisma.Result<typeof db.bank, T, 'delete'>,
}
