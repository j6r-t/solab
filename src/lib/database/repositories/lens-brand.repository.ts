import { Prisma } from '@prisma/client'
import { db } from '../db'

export const lensBrandRepo = {
    findMany: <T extends Prisma.LensBrandFindManyArgs>(args?: T): Prisma.Result<typeof db.lensBrand, T, 'findMany'> =>
        db.lensBrand.findMany(args) as unknown as Prisma.Result<typeof db.lensBrand, T, 'findMany'>,
    findUnique: <T extends Prisma.LensBrandFindUniqueArgs>(args: T): Prisma.Result<typeof db.lensBrand, T, 'findUnique'> =>
        db.lensBrand.findUnique(args) as unknown as Prisma.Result<typeof db.lensBrand, T, 'findUnique'>,
    create: <T extends Prisma.LensBrandCreateArgs>(args: T): Prisma.Result<typeof db.lensBrand, T, 'create'> =>
        db.lensBrand.create(args) as unknown as Prisma.Result<typeof db.lensBrand, T, 'create'>,
    update: <T extends Prisma.LensBrandUpdateArgs>(args: T): Prisma.Result<typeof db.lensBrand, T, 'update'> =>
        db.lensBrand.update(args) as unknown as Prisma.Result<typeof db.lensBrand, T, 'update'>,
    delete: <T extends Prisma.LensBrandDeleteArgs>(args: T): Prisma.Result<typeof db.lensBrand, T, 'delete'> =>
        db.lensBrand.delete(args) as unknown as Prisma.Result<typeof db.lensBrand, T, 'delete'>,
}
