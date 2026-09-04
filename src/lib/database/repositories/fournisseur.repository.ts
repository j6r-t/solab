import { Prisma } from '@prisma/client'
import { db } from '../db'

export const fournisseurRepo = {
    findMany: <T extends Prisma.FournisseurFindManyArgs>(args?: T): Prisma.Result<typeof db.fournisseur, T, 'findMany'> =>
        db.fournisseur.findMany(args) as unknown as Prisma.Result<typeof db.fournisseur, T, 'findMany'>,
    findUnique: <T extends Prisma.FournisseurFindUniqueArgs>(args: T): Prisma.Result<typeof db.fournisseur, T, 'findUnique'> =>
        db.fournisseur.findUnique(args) as unknown as Prisma.Result<typeof db.fournisseur, T, 'findUnique'>,
    create: <T extends Prisma.FournisseurCreateArgs>(args: T): Prisma.Result<typeof db.fournisseur, T, 'create'> =>
        db.fournisseur.create(args) as unknown as Prisma.Result<typeof db.fournisseur, T, 'create'>,
    update: <T extends Prisma.FournisseurUpdateArgs>(args: T): Prisma.Result<typeof db.fournisseur, T, 'update'> =>
        db.fournisseur.update(args) as unknown as Prisma.Result<typeof db.fournisseur, T, 'update'>,
    delete: <T extends Prisma.FournisseurDeleteArgs>(args: T): Prisma.Result<typeof db.fournisseur, T, 'delete'> =>
        db.fournisseur.delete(args) as unknown as Prisma.Result<typeof db.fournisseur, T, 'delete'>,
    count: <T extends Prisma.FournisseurCountArgs>(args?: T): Prisma.Result<typeof db.fournisseur, T, 'count'> =>
        db.fournisseur.count(args) as unknown as Prisma.Result<typeof db.fournisseur, T, 'count'>,
}
