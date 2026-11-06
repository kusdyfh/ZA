-- AlterTable
ALTER TABLE "orders" ALTER COLUMN "customerEmailSnapshot" DROP NOT NULL;

-- CreateTable
CREATE TABLE "phone_verification_codes" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "phone_verification_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "phone_verification_codes_storeId_phone_idx" ON "phone_verification_codes"("storeId", "phone");

-- AddForeignKey
ALTER TABLE "phone_verification_codes" ADD CONSTRAINT "phone_verification_codes_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
