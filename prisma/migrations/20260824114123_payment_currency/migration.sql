-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'LKR',
    "method" TEXT NOT NULL,
    "gateway" TEXT,
    "referenceId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "failureReason" TEXT,
    "metadata" TEXT,
    "proofUrl" TEXT,
    "verifiedAt" DATETIME,
    "verifiedByAdminId" TEXT,
    "webhookEventId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Payment" ("amount", "createdAt", "failureReason", "gateway", "id", "metadata", "method", "orderId", "proofUrl", "referenceId", "status", "verifiedAt", "verifiedByAdminId", "webhookEventId") SELECT "amount", "createdAt", "failureReason", "gateway", "id", "metadata", "method", "orderId", "proofUrl", "referenceId", "status", "verifiedAt", "verifiedByAdminId", "webhookEventId" FROM "Payment";
DROP TABLE "Payment";
ALTER TABLE "new_Payment" RENAME TO "Payment";
CREATE UNIQUE INDEX "Payment_webhookEventId_key" ON "Payment"("webhookEventId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
