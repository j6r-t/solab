import { Prisma } from '@prisma/client'
import { db } from './db'

export const clientRepo = {
    findMany: (args?: Prisma.ClientFindManyArgs) => db.client.findMany(args),
    findUnique: (args: Prisma.ClientFindUniqueArgs) => db.client.findUnique(args),
    create: (args: Prisma.ClientCreateArgs) => db.client.create(args),
    update: (args: Prisma.ClientUpdateArgs) => db.client.update(args),
    delete: (args: Prisma.ClientDeleteArgs) => db.client.delete(args),
    count: (args?: Prisma.ClientCountArgs) => db.client.count(args),
}

export const doctorRepo = {
    findMany: (args?: Prisma.DoctorFindManyArgs) => db.doctor.findMany(args),
    findUnique: (args: Prisma.DoctorFindUniqueArgs) => db.doctor.findUnique(args),
    create: (args: Prisma.DoctorCreateArgs) => db.doctor.create(args),
    update: (args: Prisma.DoctorUpdateArgs) => db.doctor.update(args),
    delete: (args: Prisma.DoctorDeleteArgs) => db.doctor.delete(args),
    count: (args?: Prisma.DoctorCountArgs) => db.doctor.count(args),
}

export const fournisseurRepo = {
    findMany: (args?: Prisma.FournisseurFindManyArgs) => db.fournisseur.findMany(args),
    findUnique: (args: Prisma.FournisseurFindUniqueArgs) => db.fournisseur.findUnique(args),
    create: (args: Prisma.FournisseurCreateArgs) => db.fournisseur.create(args),
    update: (args: Prisma.FournisseurUpdateArgs) => db.fournisseur.update(args),
    delete: (args: Prisma.FournisseurDeleteArgs) => db.fournisseur.delete(args),
    count: (args?: Prisma.FournisseurCountArgs) => db.fournisseur.count(args),
}

export const productRepo = {
    findMany: (args?: Prisma.ProductFindManyArgs) => db.product.findMany(args),
    findUnique: (args: Prisma.ProductFindUniqueArgs) => db.product.findUnique(args),
    create: (args: Prisma.ProductCreateArgs) => db.product.create(args),
    update: (args: Prisma.ProductUpdateArgs) => db.product.update(args),
    delete: (args: Prisma.ProductDeleteArgs) => db.product.delete(args),
    count: (args?: Prisma.ProductCountArgs) => db.product.count(args),
    aggregate: (args: Prisma.ProductAggregateArgs) => db.product.aggregate(args),
}

export const orderRepo = {
    findMany: (args?: Prisma.OrderFindManyArgs) => db.order.findMany(args),
    findUnique: (args: Prisma.OrderFindUniqueArgs) => db.order.findUnique(args),
    create: (args: Prisma.OrderCreateArgs) => db.order.create(args),
    update: (args: Prisma.OrderUpdateArgs) => db.order.update(args),
    delete: (args: Prisma.OrderDeleteArgs) => db.order.delete(args),
    count: (args?: Prisma.OrderCountArgs) => db.order.count(args),
    aggregate: (args: Prisma.OrderAggregateArgs) => db.order.aggregate(args) as any,
}

export const repairRepo = {
    findMany: (args?: Prisma.RepairFindManyArgs) => db.repair.findMany(args),
    findUnique: (args: Prisma.RepairFindUniqueArgs) => db.repair.findUnique(args),
    findFirst: (args?: Prisma.RepairFindFirstArgs) => db.repair.findFirst(args),
    create: (args: Prisma.RepairCreateArgs) => db.repair.create(args),
    update: (args: Prisma.RepairUpdateArgs) => db.repair.update(args),
    delete: (args: Prisma.RepairDeleteArgs) => db.repair.delete(args),
    count: (args?: Prisma.RepairCountArgs) => db.repair.count(args),
}

export const repairServiceRepo = {
    findMany: (args?: Prisma.RepairServiceFindManyArgs) => db.repairService.findMany(args),
    findUnique: (args: Prisma.RepairServiceFindUniqueArgs) => db.repairService.findUnique(args),
    findFirst: (args?: Prisma.RepairServiceFindFirstArgs) => db.repairService.findFirst(args),
    create: (args: Prisma.RepairServiceCreateArgs) => db.repairService.create(args),
    update: (args: Prisma.RepairServiceUpdateArgs) => db.repairService.update(args),
    delete: (args: Prisma.RepairServiceDeleteArgs) => db.repairService.delete(args),
    count: (args?: Prisma.RepairServiceCountArgs) => db.repairService.count(args),
}

export const prescriptionRepo = {
    findMany: (args?: Prisma.PrescriptionFindManyArgs) => db.prescription.findMany(args),
    findUnique: (args: Prisma.PrescriptionFindUniqueArgs) => db.prescription.findUnique(args),
    create: (args: Prisma.PrescriptionCreateArgs) => db.prescription.create(args),
    update: (args: Prisma.PrescriptionUpdateArgs) => db.prescription.update(args),
    delete: (args: Prisma.PrescriptionDeleteArgs) => db.prescription.delete(args),
    count: (args?: Prisma.PrescriptionCountArgs) => db.prescription.count(args),
}

export const lensBrandRepo = {
    findMany: (args?: Prisma.LensBrandFindManyArgs) => db.lensBrand.findMany(args),
    findUnique: (args: Prisma.LensBrandFindUniqueArgs) => db.lensBrand.findUnique(args),
    create: (args: Prisma.LensBrandCreateArgs) => db.lensBrand.create(args),
    update: (args: Prisma.LensBrandUpdateArgs) => db.lensBrand.update(args),
    delete: (args: Prisma.LensBrandDeleteArgs) => db.lensBrand.delete(args),
}

export const qrcodeRepo = {
    findUnique: (args: Prisma.QRCodeFindUniqueArgs) => db.qRCode.findUnique(args),
}

export const paymentRepo = {
    create: (args: Prisma.PaymentCreateArgs) => db.payment.create(args),
}

export const stockAdjustmentRepo = {
    create: (args: Prisma.StockAdjustmentCreateArgs) => db.stockAdjustment.create(args),
}

export const userRepo = {
    findUnique: (args: Prisma.UserFindUniqueArgs) => db.user.findUnique(args),
    findFirst: (args?: Prisma.UserFindFirstArgs) => db.user.findFirst(args),
    create: (args: Prisma.UserCreateArgs) => db.user.create(args),
    update: (args: Prisma.UserUpdateArgs) => db.user.update(args),
}
