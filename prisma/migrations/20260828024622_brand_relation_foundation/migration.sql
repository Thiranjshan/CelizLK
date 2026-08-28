/*
  Warnings:

  - Added the required column `updatedAt` to the `Brand` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Brand" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Brand" ("createdAt", "id", "logoUrl", "name", "slug") SELECT "createdAt", "id", "logoUrl", "name", "slug" FROM "Brand";
DROP TABLE "Brand";
ALTER TABLE "new_Brand" RENAME TO "Brand";
CREATE UNIQUE INDEX "Brand_name_key" ON "Brand"("name");
CREATE UNIQUE INDEX "Brand_slug_key" ON "Brand"("slug");
  INSERT INTO "Brand" ("id", "name", "slug")
  SELECT lower(hex(randomblob(16))), "brand", lower(trim(replace(replace(replace("brand", ' ', '-'), '_', '-'), '.', '')))
  FROM "Product"
  WHERE "brand" IS NOT NULL AND trim("brand") <> ''
  GROUP BY "brand";
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "discountPrice" REAL,
    "stockQty" INTEGER NOT NULL DEFAULT 10,
    "categoryId" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "brandId" TEXT,
    "images" TEXT NOT NULL,
    "specs" TEXT NOT NULL,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isNewArrival" BOOLEAN NOT NULL DEFAULT false,
    "minStockAlert" INTEGER NOT NULL DEFAULT 5,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Product_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("brand", "brandId", "categoryId", "createdAt", "description", "discountPrice", "id", "images", "isActive", "isFeatured", "isNewArrival", "minStockAlert", "name", "price", "seoDescription", "seoTitle", "slug", "specs", "status", "stockQty", "updatedAt") SELECT "brand", (SELECT "id" FROM "Brand" WHERE "Brand"."name" = "Product"."brand"), "categoryId", "createdAt", "description", "discountPrice", "id", "images", "isActive", "isFeatured", "isNewArrival", "minStockAlert", "name", "price", "seoDescription", "seoTitle", "slug", "specs", "status", "stockQty", "updatedAt" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
