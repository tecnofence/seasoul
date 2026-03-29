-- AlterTable Invoice: campos AGT RSA e código de registo
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "agtSignature" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "agtCode" TEXT;
