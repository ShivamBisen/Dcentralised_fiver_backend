-- AlterTable
ALTER TABLE "User" ALTER COLUMN "pendingAmount" DROP NOT NULL,
ALTER COLUMN "lockedAmount" DROP NOT NULL;
