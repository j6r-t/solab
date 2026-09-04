-- CreateTable
CREATE TABLE "WorkOrderService" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workOrderId" TEXT NOT NULL,
    "repairServiceId" TEXT NOT NULL,
    "price" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "WorkOrderService_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "AtelierWorkOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkOrderService_repairServiceId_fkey" FOREIGN KEY ("repairServiceId") REFERENCES "RepairService" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OpticianShopPrescription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "opticianShopId" TEXT NOT NULL,
    "workOrderId" TEXT,
    "sphRight" REAL NOT NULL,
    "cylRight" REAL NOT NULL,
    "axisRight" INTEGER NOT NULL,
    "addRight" REAL NOT NULL,
    "pdRight" INTEGER NOT NULL,
    "sphLeft" REAL NOT NULL,
    "cylLeft" REAL NOT NULL,
    "axisLeft" INTEGER NOT NULL,
    "addLeft" REAL NOT NULL,
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

-- CreateTable
CREATE TABLE "OpticianShopBill" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "billNumber" TEXT NOT NULL,
    "opticianShopId" TEXT NOT NULL,
    "workOrderId" TEXT,
    "totalAmount" REAL NOT NULL,
    "paidAmount" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'unpaid',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OpticianShopBill_opticianShopId_fkey" FOREIGN KEY ("opticianShopId") REFERENCES "OpticianShop" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OpticianShopBill_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "AtelierWorkOrder" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OpticianShopBillItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "billId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" REAL NOT NULL,
    "itemType" TEXT NOT NULL,
    "lensBlankId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OpticianShopBillItem_billId_fkey" FOREIGN KEY ("billId") REFERENCES "OpticianShopBill" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OpticianShopBillItem_lensBlankId_fkey" FOREIGN KEY ("lensBlankId") REFERENCES "LensBlank" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OpticianShopPayment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "billId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "method" TEXT NOT NULL,
    "chequeId" TEXT,
    "notes" TEXT,
    "paidAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OpticianShopPayment_billId_fkey" FOREIGN KEY ("billId") REFERENCES "OpticianShopBill" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OpticianShopPayment_chequeId_fkey" FOREIGN KEY ("chequeId") REFERENCES "Cheque" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "OpticianShopPrescription_workOrderId_key" ON "OpticianShopPrescription"("workOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "OpticianShopBill_billNumber_key" ON "OpticianShopBill"("billNumber");

-- CreateIndex
CREATE UNIQUE INDEX "OpticianShopBill_workOrderId_key" ON "OpticianShopBill"("workOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkOrderService_workOrderId_repairServiceId_key" ON "WorkOrderService"("workOrderId", "repairServiceId");

-- Red CreateTable: AtelierWorkOrder (recreate without type and repairServiceId)
-- Step 1: Create new table
CREATE TABLE "AtelierWorkOrder_new" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT,
    "opticianShopId" TEXT,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "lensBlankLeftId" TEXT,
    "lensBlankRightId" TEXT,
    "frameFrom" TEXT,
    "lensBlankPrice" REAL,
    "servicePrice" REAL NOT NULL DEFAULT 0,
    "paymentStatus" TEXT NOT NULL DEFAULT 'pending',
    "amountPaid" REAL NOT NULL DEFAULT 0,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "dueDate" DATETIME NOT NULL,
    "expectedCompletionDate" DATETIME,
    "brokenLensBlank" TEXT,
    "replacementLeftId" TEXT,
    "replacementRightId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AtelierWorkOrder_new_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AtelierWorkOrder_new_opticianShopId_fkey" FOREIGN KEY ("opticianShopId") REFERENCES "OpticianShop" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AtelierWorkOrder_new_lensBlankLeftId_fkey" FOREIGN KEY ("lensBlankLeftId") REFERENCES "LensBlank" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AtelierWorkOrder_new_lensBlankRightId_fkey" FOREIGN KEY ("lensBlankRightId") REFERENCES "LensBlank" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AtelierWorkOrder_new_replacementLeftId_fkey" FOREIGN KEY ("replacementLeftId") REFERENCES "LensBlank" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AtelierWorkOrder_new_replacementRightId_fkey" FOREIGN KEY ("replacementRightId") REFERENCES "LensBlank" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Step 2: Copy data
INSERT INTO "AtelierWorkOrder_new" ("id", "orderId", "opticianShopId", "source", "status", "lensBlankLeftId", "lensBlankRightId", "frameFrom", "lensBlankPrice", "servicePrice", "paymentStatus", "amountPaid", "startedAt", "completedAt", "dueDate", "expectedCompletionDate", "brokenLensBlank", "replacementLeftId", "replacementRightId", "createdAt", "updatedAt")
SELECT "id", "orderId", "opticianShopId", "source", "status", "lensBlankLeftId", "lensBlankRightId", "frameFrom", "lensBlankPrice", "servicePrice", "paymentStatus", "amountPaid", "startedAt", "completedAt", "dueDate", "expectedCompletionDate", "brokenLensBlank", "replacementLeftId", "replacementRightId", "createdAt", "updatedAt"
FROM "AtelierWorkOrder";

-- Step 3: Drop old table
DROP TABLE "AtelierWorkOrder";

-- Step 4: Rename new table
ALTER TABLE "AtelierWorkOrder_new" RENAME TO "AtelierWorkOrder";

-- RedefineIndex for LensBlank (recreate without old relation names)
-- LensBlank table stays the same, just the Prisma relation names changed
