/*
  Warnings:

  - You are about to drop the `Traite` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `traiteId` on the `SupplierPayment` table. All the data in the column will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Traite";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Cheque" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'standard',
    "bankName" TEXT,
    "amount" DECIMAL NOT NULL,
    "issueDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "purchaseInvoiceId" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Cheque_purchaseInvoiceId_fkey" FOREIGN KEY ("purchaseInvoiceId") REFERENCES "PurchaseInvoice" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Cheque" ("amount", "bankName", "createdAt", "dueDate", "entityId", "entityType", "id", "issueDate", "number", "status", "updatedAt") SELECT "amount", "bankName", "createdAt", "dueDate", "entityId", "entityType", "id", "issueDate", "number", "status", "updatedAt" FROM "Cheque";
DROP TABLE "Cheque";
ALTER TABLE "new_Cheque" RENAME TO "Cheque";
CREATE TABLE "new_SupplierPayment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "purchaseInvoiceId" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "method" TEXT NOT NULL,
    "chequeId" TEXT,
    "paidAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SupplierPayment_purchaseInvoiceId_fkey" FOREIGN KEY ("purchaseInvoiceId") REFERENCES "PurchaseInvoice" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SupplierPayment_chequeId_fkey" FOREIGN KEY ("chequeId") REFERENCES "Cheque" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_SupplierPayment" ("amount", "chequeId", "id", "method", "paidAt", "purchaseInvoiceId") SELECT "amount", "chequeId", "id", "method", "paidAt", "purchaseInvoiceId" FROM "SupplierPayment";
DROP TABLE "SupplierPayment";
ALTER TABLE "new_SupplierPayment" RENAME TO "SupplierPayment";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
