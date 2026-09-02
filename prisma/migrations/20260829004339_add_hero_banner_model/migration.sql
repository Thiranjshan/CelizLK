-- CreateTable
CREATE TABLE "HeroBanner" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "imageUrl" TEXT NOT NULL,
    "buttonLabel" TEXT NOT NULL,
    "buttonLink" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "HeroBanner_isActive_order_idx" ON "HeroBanner"("isActive", "order");
