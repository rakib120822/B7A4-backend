-- DropIndex
DROP INDEX "Service_categoryId_key";

-- AlterTable
ALTER TABLE "Service" ALTER COLUMN "technicianId" SET NOT NULL,
ALTER COLUMN "technicianId" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "TechnicianProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
