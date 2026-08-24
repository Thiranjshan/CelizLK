-- AlterTable
ALTER TABLE "Payment" ADD COLUMN "bankName" TEXT;
ALTER TABLE "Payment" ADD COLUMN "rejectedAt" DATETIME;
ALTER TABLE "Payment" ADD COLUMN "transferAmount" REAL;
ALTER TABLE "Payment" ADD COLUMN "transferDate" DATETIME;
ALTER TABLE "Payment" ADD COLUMN "transferNote" TEXT;
ALTER TABLE "Payment" ADD COLUMN "transferReference" TEXT;
ALTER TABLE "Payment" ADD COLUMN "transferSubmittedAt" DATETIME;
