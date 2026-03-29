-- AlterTable: campos de email por tenant (subdomínio automático ENGERIS ONE)
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "emailFrom"         TEXT;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "emailFromName"     TEXT;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "resendDomainId"    TEXT;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "emailDomainStatus" TEXT DEFAULT 'pending';
