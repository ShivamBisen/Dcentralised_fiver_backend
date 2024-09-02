/*
  Warnings:

  - The `pendingAmount` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `lockedAmount` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "TxnStatus" AS ENUM ('Processing', 'Success', 'Failure');

-- AlterTable
ALTER TABLE "User" DROP COLUMN "pendingAmount",
ADD COLUMN     "pendingAmount" INTEGER,
DROP COLUMN "lockedAmount",
ADD COLUMN     "lockedAmount" INTEGER;

-- CreateTable
CREATE TABLE "Payouts" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "signature" TEXT NOT NULL,
    "status" "TxnStatus" NOT NULL,

    CONSTRAINT "Payouts_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Payouts" ADD CONSTRAINT "Payouts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "UserMain"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
