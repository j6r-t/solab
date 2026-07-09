-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AtelierWorkOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT,
    "opticianShopId" TEXT,
    "source" TEXT NOT NULL,
    "type" TEXT NOT NULL,
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
    "repairServiceId" TEXT,
    "brokenLensBlank" TEXT,
    "replacementLeftId" TEXT,
    "replacementRightId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AtelierWorkOrder_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AtelierWorkOrder_opticianShopId_fkey" FOREIGN KEY ("opticianShopId") REFERENCES "OpticianShop" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AtelierWorkOrder_lensBlankLeftId_fkey" FOREIGN KEY ("lensBlankLeftId") REFERENCES "LensBlank" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AtelierWorkOrder_lensBlankRightId_fkey" FOREIGN KEY ("lensBlankRightId") REFERENCES "LensBlank" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AtelierWorkOrder_repairServiceId_fkey" FOREIGN KEY ("repairServiceId") REFERENCES "RepairService" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AtelierWorkOrder_replacementLeftId_fkey" FOREIGN KEY ("replacementLeftId") REFERENCES "LensBlank" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AtelierWorkOrder_replacementRightId_fkey" FOREIGN KEY ("replacementRightId") REFERENCES "LensBlank" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_AtelierWorkOrder" ("brokenLensBlank", "completedAt", "createdAt", "dueDate", "expectedCompletionDate", "frameFrom", "id", "lensBlankLeftId", "lensBlankPrice", "lensBlankRightId", "opticianShopId", "orderId", "repairServiceId", "replacementLeftId", "replacementRightId", "servicePrice", "source", "startedAt", "status", "type", "updatedAt") SELECT "brokenLensBlank", "completedAt", "createdAt", "dueDate", "expectedCompletionDate", "frameFrom", "id", "lensBlankLeftId", "lensBlankPrice", "lensBlankRightId", "opticianShopId", "orderId", "repairServiceId", "replacementLeftId", "replacementRightId", "servicePrice", "source", "startedAt", "status", "type", "updatedAt" FROM "AtelierWorkOrder";
DROP TABLE "AtelierWorkOrder";
ALTER TABLE "new_AtelierWorkOrder" RENAME TO "AtelierWorkOrder";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
