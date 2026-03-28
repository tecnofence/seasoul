-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "cativoAmount" DECIMAL(15,2),
ADD COLUMN     "clientCativoType" TEXT DEFAULT 'PRIVATE';

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "taxCategory" TEXT NOT NULL DEFAULT 'STANDARD';

-- CreateIndex
CREATE INDEX "Product_taxCategory_idx" ON "Product"("taxCategory");
