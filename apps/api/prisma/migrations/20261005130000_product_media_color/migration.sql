-- AlterTable
ALTER TABLE "product_media" ADD COLUMN     "colorId" TEXT;

-- CreateIndex
CREATE INDEX "product_media_colorId_idx" ON "product_media"("colorId");

-- AddForeignKey
ALTER TABLE "product_media" ADD CONSTRAINT "product_media_colorId_fkey" FOREIGN KEY ("colorId") REFERENCES "colors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
