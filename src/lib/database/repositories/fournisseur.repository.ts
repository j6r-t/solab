import { Prisma } from '@prisma/client'
import { db } from '../db'

export const fournisseurRepo = {
    findMany: (args?: Prisma.FournisseurFindManyArgs) => db.fournisseur.findMany(args),
    findUnique: (args: Prisma.FournisseurFindUniqueArgs) => db.fournisseur.findUnique(args),
    create: (args: Prisma.FournisseurCreateArgs) => db.fournisseur.create(args),
    update: (args: Prisma.FournisseurUpdateArgs) => db.fournisseur.update(args),
    delete: (args: Prisma.FournisseurDeleteArgs) => db.fournisseur.delete(args),
    count: (args?: Prisma.FournisseurCountArgs) => db.fournisseur.count(args),
}
