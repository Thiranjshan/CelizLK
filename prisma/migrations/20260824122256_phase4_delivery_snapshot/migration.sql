-- AlterTable
ALTER TABLE "User" ADD COLUMN "emailVerifiedAt" DATETIME;
ALTER TABLE "User" ADD COLUMN "phoneVerifiedAt" DATETIME;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNumber" TEXT NOT NULL,
    "userId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "subtotal" REAL NOT NULL,
    "deliveryFee" REAL NOT NULL DEFAULT 0,
    "shippingFee" REAL NOT NULL DEFAULT 350,
    "total" REAL NOT NULL,
    "paymentMethod" TEXT NOT NULL DEFAULT 'COD',
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentGatewayRef" TEXT,
    "shippingAddress" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "confirmedAt" DATETIME,
    "cancelledAt" DATETIME,
    "cancelReason" TEXT,
    "courier" TEXT,
    "trackingNumber" TEXT,
    "notes" TEXT,
    "trackingToken" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "idempotencyKey" TEXT,
    CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("cancelReason", "cancelledAt", "confirmedAt", "courier", "createdAt", "customerEmail", "customerName", "customerPhone", "id", "idempotencyKey", "notes", "orderNumber", "paymentGatewayRef", "paymentMethod", "paymentStatus", "shippingAddress", "shippingFee", "status", "subtotal", "total", "trackingNumber", "trackingToken", "updatedAt", "userId") SELECT "cancelReason", "cancelledAt", "confirmedAt", "courier", "createdAt", "customerEmail", "customerName", "customerPhone", "id", "idempotencyKey", "notes", "orderNumber", "paymentGatewayRef", "paymentMethod", "paymentStatus", "shippingAddress", "shippingFee", "status", "subtotal", "total", "trackingNumber", "trackingToken", "updatedAt", "userId" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");
CREATE UNIQUE INDEX "Order_trackingToken_key" ON "Order"("trackingToken");
CREATE UNIQUE INDEX "Order_idempotencyKey_key" ON "Order"("idempotencyKey");
CREATE INDEX "Order_trackingToken_idx" ON "Order"("trackingToken");
CREATE INDEX "Order_idempotencyKey_idx" ON "Order"("idempotencyKey");
CREATE INDEX "Order_userId_idx" ON "Order"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
