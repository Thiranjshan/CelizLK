-- CreateTable
CREATE TABLE "FeaturedCategory" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "imageUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeaturedCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FeaturedCategory_categoryId_key" ON "FeaturedCategory"("categoryId");

-- CreateIndex
CREATE INDEX "FeaturedCategory_isActive_order_idx" ON "FeaturedCategory"("isActive", "order");

-- AddForeignKey
ALTER TABLE "FeaturedCategory" ADD CONSTRAINT "FeaturedCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
