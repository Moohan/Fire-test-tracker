-- AlterTable
ALTER TABLE "Equipment" ADD COLUMN "sfrsId" TEXT;
ALTER TABLE "Equipment" ADD COLUMN "mfrId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Equipment_sfrsId_key" ON "Equipment"("sfrsId");
