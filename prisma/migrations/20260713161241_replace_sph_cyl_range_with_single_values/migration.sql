/*
  Warnings:

  - You are about to alter the column `amountPaid` on the `AtelierWorkOrder` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `lensBlankPrice` on the `AtelierWorkOrder` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `servicePrice` on the `AtelierWorkOrder` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to drop the column `cylMax` on the `LensBlank` table. All the data in the column will be lost.
  - You are about to drop the column `cylMin` on the `LensBlank` table. All the data in the column will be lost.
  - You are about to drop the column `sphMax` on the `LensBlank` table. All the data in the column will be lost.
  - You are about to drop the column `sphMin` on the `LensBlank` table. All the data in the column will be lost.
  - You are about to alter the column `paidAmount` on the `OpticianShopBill` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `totalAmount` on the `OpticianShopBill` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `unitPrice` on the `OpticianShopBillItem` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `amount` on the `OpticianShopPayment` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `addLeft` on the `OpticianShopPrescription` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `addRight` on the `OpticianShopPrescription` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `cylLeft` on the `OpticianShopPrescription` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `cylRight` on the `OpticianShopPrescription` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `sphLeft` on the `OpticianShopPrescription` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `sphRight` on the `OpticianShopPrescription` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `price` on the `WorkOrderService` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - Added the required column `cyl` to the `LensBlank` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sph` to the `LensBlank` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AtelierWorkOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT,
    "opticianShopId" TEXT,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "lensBlankLeftId" TEXT,
    "lensBlankRightId" TEXT,
    "frameFrom" TEXT,
    "lensBlankPrice" DECIMAL,
    "servicePrice" DECIMAL NOT NULL DEFAULT 0,
    "paymentStatus" TEXT NOT NULL DEFAULT 'pending',
    "amountPaid" DECIMAL NOT NULL DEFAULT 0,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "dueDate" DATETIME NOT NULL,
    "expectedCompletionDate" DATETIME,
    "brokenLensBlank" TEXT,
    "replacementLeftId" TEXT,
    "replacementRightId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AtelierWorkOrder_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AtelierWorkOrder_opticianShopId_fkey" FOREIGN KEY ("opticianShopId") REFERENCES "OpticianShop" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AtelierWorkOrder_lensBlankLeftId_fkey" FOREIGN KEY ("lensBlankLeftId") REFERENCES "LensBlank" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AtelierWorkOrder_lensBlankRightId_fkey" FOREIGN KEY ("lensBlankRightId") REFERENCES "LensBlank" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AtelierWorkOrder_replacementLeftId_fkey" FOREIGN KEY ("replacementLeftId") REFERENCES "LensBlank" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AtelierWorkOrder_replacementRightId_fkey" FOREIGN KEY ("replacementRightId") REFERENCES "LensBlank" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_AtelierWorkOrder" ("amountPaid", "brokenLensBlank", "completedAt", "createdAt", "dueDate", "expectedCompletionDate", "frameFrom", "id", "lensBlankLeftId", "lensBlankPrice", "lensBlankRightId", "opticianShopId", "orderId", "paymentStatus", "replacementLeftId", "replacementRightId", "servicePrice", "source", "startedAt", "status", "updatedAt") SELECT "amountPaid", "brokenLensBlank", "completedAt", "createdAt", "dueDate", "expectedCompletionDate", "frameFrom", "id", "lensBlankLeftId", "lensBlankPrice", "lensBlankRightId", "opticianShopId", "orderId", "paymentStatus", "replacementLeftId", "replacementRightId", "servicePrice", "source", "startedAt", "status", "updatedAt" FROM "AtelierWorkOrder";
DROP TABLE "AtelierWorkOrder";
ALTER TABLE "new_AtelierWorkOrder" RENAME TO "AtelierWorkOrder";
CREATE TABLE "new_LensBlank" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "brand" TEXT NOT NULL,
    "lensType" TEXT NOT NULL,
    "material" TEXT NOT NULL,
    "coating" TEXT NOT NULL,
    "thickness" TEXT NOT NULL,
    "sph" DECIMAL NOT NULL,
    "cyl" DECIMAL NOT NULL,
    "costPrice" DECIMAL NOT NULL,
    "sellingPrice" DECIMAL NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "fournisseurId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LensBlank_fournisseurId_fkey" FOREIGN KEY ("fournisseurId") REFERENCES "Fournisseur" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_LensBlank" ("brand", "coating", "costPrice", "createdAt", "fournisseurId", "id", "lensType", "material", "quantity", "sellingPrice", "thickness", "updatedAt") SELECT "brand", "coating", "costPrice", "createdAt", "fournisseurId", "id", "lensType", "material", "quantity", "sellingPrice", "thickness", "updatedAt" FROM "LensBlank";
DROP TABLE "LensBlank";
ALTER TABLE "new_LensBlank" RENAME TO "LensBlank";
CREATE TABLE "new_OpticianShopBill" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "billNumber" TEXT NOT NULL,
    "opticianShopId" TEXT NOT NULL,
    "workOrderId" TEXT,
    "totalAmount" DECIMAL NOT NULL,
    "paidAmount" DECIMAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'unpaid',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OpticianShopBill_opticianShopId_fkey" FOREIGN KEY ("opticianShopId") REFERENCES "OpticianShop" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OpticianShopBill_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "AtelierWorkOrder" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_OpticianShopBill" ("billNumber", "createdAt", "id", "notes", "opticianShopId", "paidAmount", "status", "totalAmount", "updatedAt", "workOrderId") SELECT "billNumber", "createdAt", "id", "notes", "opticianShopId", "paidAmount", "status", "totalAmount", "updatedAt", "workOrderId" FROM "OpticianShopBill";
DROP TABLE "OpticianShopBill";
ALTER TABLE "new_OpticianShopBill" RENAME TO "OpticianShopBill";
CREATE UNIQUE INDEX "OpticianShopBill_billNumber_key" ON "OpticianShopBill"("billNumber");
CREATE UNIQUE INDEX "OpticianShopBill_workOrderId_key" ON "OpticianShopBill"("workOrderId");
CREATE TABLE "new_OpticianShopBillItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "billId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL NOT NULL,
    "itemType" TEXT NOT NULL,
    "lensBlankId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OpticianShopBillItem_billId_fkey" FOREIGN KEY ("billId") REFERENCES "OpticianShopBill" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OpticianShopBillItem_lensBlankId_fkey" FOREIGN KEY ("lensBlankId") REFERENCES "LensBlank" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_OpticianShopBillItem" ("billId", "createdAt", "description", "id", "itemType", "lensBlankId", "quantity", "unitPrice") SELECT "billId", "createdAt", "description", "id", "itemType", "lensBlankId", "quantity", "unitPrice" FROM "OpticianShopBillItem";
DROP TABLE "OpticianShopBillItem";
ALTER TABLE "new_OpticianShopBillItem" RENAME TO "OpticianShopBillItem";
CREATE TABLE "new_OpticianShopPayment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "billId" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "method" TEXT NOT NULL,
    "chequeId" TEXT,
    "notes" TEXT,
    "paidAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OpticianShopPayment_billId_fkey" FOREIGN KEY ("billId") REFERENCES "OpticianShopBill" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OpticianShopPayment_chequeId_fkey" FOREIGN KEY ("chequeId") REFERENCES "Cheque" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_OpticianShopPayment" ("amount", "billId", "chequeId", "id", "method", "notes", "paidAt") SELECT "amount", "billId", "chequeId", "id", "method", "notes", "paidAt" FROM "OpticianShopPayment";
DROP TABLE "OpticianShopPayment";
ALTER TABLE "new_OpticianShopPayment" RENAME TO "OpticianShopPayment";
CREATE TABLE "new_OpticianShopPrescription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "opticianShopId" TEXT NOT NULL,
    "workOrderId" TEXT,
    "sphRight" DECIMAL NOT NULL,
    "cylRight" DECIMAL NOT NULL,
    "axisRight" INTEGER NOT NULL,
    "addRight" DECIMAL NOT NULL,
    "pdRight" INTEGER NOT NULL,
    "sphLeft" DECIMAL NOT NULL,
    "cylLeft" DECIMAL NOT NULL,
    "axisLeft" INTEGER NOT NULL,
    "addLeft" DECIMAL NOT NULL,
    "pdLeft" INTEGER NOT NULL,
    "thickness" TEXT,
    "lensType" TEXT,
    "material" TEXT,
    "coating" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OpticianShopPrescription_opticianShopId_fkey" FOREIGN KEY ("opticianShopId") REFERENCES "OpticianShop" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OpticianShopPrescription_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "AtelierWorkOrder" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_OpticianShopPrescription" ("addLeft", "addRight", "axisLeft", "axisRight", "coating", "createdAt", "cylLeft", "cylRight", "id", "lensType", "material", "notes", "opticianShopId", "pdLeft", "pdRight", "sphLeft", "sphRight", "thickness", "workOrderId") SELECT "addLeft", "addRight", "axisLeft", "axisRight", "coating", "createdAt", "cylLeft", "cylRight", "id", "lensType", "material", "notes", "opticianShopId", "pdLeft", "pdRight", "sphLeft", "sphRight", "thickness", "workOrderId" FROM "OpticianShopPrescription";
DROP TABLE "OpticianShopPrescription";
ALTER TABLE "new_OpticianShopPrescription" RENAME TO "OpticianShopPrescription";
CREATE UNIQUE INDEX "OpticianShopPrescription_workOrderId_key" ON "OpticianShopPrescription"("workOrderId");
CREATE TABLE "new_WorkOrderService" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workOrderId" TEXT NOT NULL,
    "repairServiceId" TEXT NOT NULL,
    "price" DECIMAL NOT NULL,
    CONSTRAINT "WorkOrderService_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "AtelierWorkOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkOrderService_repairServiceId_fkey" FOREIGN KEY ("repairServiceId") REFERENCES "RepairService" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_WorkOrderService" ("id", "price", "repairServiceId", "workOrderId") SELECT "id", "price", "repairServiceId", "workOrderId" FROM "WorkOrderService";
DROP TABLE "WorkOrderService";
ALTER TABLE "new_WorkOrderService" RENAME TO "WorkOrderService";
CREATE UNIQUE INDEX "WorkOrderService_workOrderId_repairServiceId_key" ON "WorkOrderService"("workOrderId", "repairServiceId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
