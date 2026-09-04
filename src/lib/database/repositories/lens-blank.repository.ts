import { Prisma } from '@prisma/client'
import { db } from '../db'

export const lensBlankRepo = {
    findMany: <T extends Prisma.LensBlankFindManyArgs>(args?: T): Prisma.Result<typeof db.lensBlank, T, 'findMany'> =>
        db.lensBlank.findMany(args) as unknown as Prisma.Result<typeof db.lensBlank, T, 'findMany'>,
    findUnique: <T extends Prisma.LensBlankFindUniqueArgs>(args: T): Prisma.Result<typeof db.lensBlank, T, 'findUnique'> =>
        db.lensBlank.findUnique(args) as unknown as Prisma.Result<typeof db.lensBlank, T, 'findUnique'>,
    findFirst: <T extends Prisma.LensBlankFindFirstArgs>(args?: T): Prisma.Result<typeof db.lensBlank, T, 'findFirst'> =>
        db.lensBlank.findFirst(args) as unknown as Prisma.Result<typeof db.lensBlank, T, 'findFirst'>,
    create: <T extends Prisma.LensBlankCreateArgs>(args: T): Prisma.Result<typeof db.lensBlank, T, 'create'> =>
        db.lensBlank.create(args) as unknown as Prisma.Result<typeof db.lensBlank, T, 'create'>,
    update: <T extends Prisma.LensBlankUpdateArgs>(args: T): Prisma.Result<typeof db.lensBlank, T, 'update'> =>
        db.lensBlank.update(args) as unknown as Prisma.Result<typeof db.lensBlank, T, 'update'>,
    delete: <T extends Prisma.LensBlankDeleteArgs>(args: T): Prisma.Result<typeof db.lensBlank, T, 'delete'> =>
        db.lensBlank.delete(args) as unknown as Prisma.Result<typeof db.lensBlank, T, 'delete'>,
    count: <T extends Prisma.LensBlankCountArgs>(args?: T): Prisma.Result<typeof db.lensBlank, T, 'count'> =>
        db.lensBlank.count(args) as unknown as Prisma.Result<typeof db.lensBlank, T, 'count'>,
}
