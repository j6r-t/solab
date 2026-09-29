-- AlterTable
ALTER TABLE "Product" ADD COLUMN "priceAfterTax" DECIMAL;

-- AlterTable
ALTER TABLE "LensBlank" ADD COLUMN "priceAfterTax" DECIMAL;

-- Backfill: compute TTC from the pre-tax price (TAX_RATE = 0.19, keep in sync
-- with src/lib/constants/index.ts and prisma/seed.mjs)
UPDATE "Product" SET "priceAfterTax" = ROUND("price" * 1.19, 3) WHERE "price" IS NOT NULL;

UPDATE "LensBlank" SET "priceAfterTax" = ROUND("sellingPrice" * 1.19, 3) WHERE "sellingPrice" IS NOT NULL;
