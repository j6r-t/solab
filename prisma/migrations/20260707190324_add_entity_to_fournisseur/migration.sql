-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Fournisseur" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT,
    "email" TEXT,
    "taxId" TEXT,
    "entity" TEXT NOT NULL DEFAULT 'shop',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Fournisseur" ("address", "createdAt", "email", "id", "name", "phone", "taxId", "updatedAt") SELECT "address", "createdAt", "email", "id", "name", "phone", "taxId", "updatedAt" FROM "Fournisseur";
DROP TABLE "Fournisseur";
ALTER TABLE "new_Fournisseur" RENAME TO "Fournisseur";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
