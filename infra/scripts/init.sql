-- Sea and Soul ERP — Inicialização PostgreSQL
-- ENGERIS — engeris.co.ao

-- ── EXTENSÕES ────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";     -- pesquisa de texto (fuzzy)
CREATE EXTENSION IF NOT EXISTS "unaccent";    -- pesquisa sem acentos
CREATE EXTENSION IF NOT EXISTS "pgcrypto";    -- funções de encriptação (PIN, hash)
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements"; -- monitorização de queries

-- ── SCHEMAS ───────────────────────────────────
CREATE SCHEMA IF NOT EXISTS agt;    -- dados fiscais AGT / SAF-T
CREATE SCHEMA IF NOT EXISTS audit;  -- auditoria de alterações (imutável)

-- ── ROLE APLICAÇÃO ────────────────────────────
-- Utilizador da aplicação com permissões limitadas (princípio do mínimo privilégio)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'seasoul_app') THEN
    CREATE ROLE seasoul_app LOGIN PASSWORD 'CHANGE_IN_PRODUCTION';
  END IF;
END
$$;

GRANT CONNECT ON DATABASE seasoul_db TO seasoul_app;
GRANT USAGE ON SCHEMA public TO seasoul_app;
GRANT USAGE ON SCHEMA agt    TO seasoul_app;
-- Schema audit: só INSERT (auditoria imutável — sem UPDATE/DELETE)
GRANT USAGE ON SCHEMA audit   TO seasoul_app;

-- ── FUNÇÃO DE AUDITORIA ───────────────────────
-- Trigger automático para preencher audit_logs em tabelas críticas
CREATE OR REPLACE FUNCTION audit.log_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public."AuditLog" (id, action, entity, "entityId", before, after, "createdAt")
  VALUES (
    gen_random_uuid()::text,
    TG_OP,
    TG_TABLE_NAME,
    CASE TG_OP
      WHEN 'DELETE' THEN OLD.id
      ELSE NEW.id
    END,
    CASE TG_OP WHEN 'INSERT' THEN NULL ELSE row_to_json(OLD) END,
    CASE TG_OP WHEN 'DELETE' THEN NULL ELSE row_to_json(NEW) END,
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── ÍNDICES EXTRA (além dos do Prisma) ────────
-- Pesquisa full-text em nomes de hóspedes e colaboradores
-- (executar após prisma migrate)
-- CREATE INDEX IF NOT EXISTS idx_reservation_guest_name_trgm
--   ON "Reservation" USING GIN ("guestName" gin_trgm_ops);
-- CREATE INDEX IF NOT EXISTS idx_employee_name_trgm
--   ON "Employee" USING GIN (name gin_trgm_ops);
-- CREATE INDEX IF NOT EXISTS idx_product_name_trgm
--   ON "Product" USING GIN (name gin_trgm_ops);

-- ── CONFIGURAÇÕES POSTGRESQL ──────────────────
ALTER DATABASE seasoul_db SET timezone = 'Africa/Luanda';
ALTER DATABASE seasoul_db SET "app.name" = 'Sea and Soul ERP';

COMMENT ON DATABASE seasoul_db IS 'Sea and Soul Resorts ERP — ENGERIS 2026';
COMMENT ON SCHEMA agt   IS 'Dados fiscais AGT — Faturação eletrónica Angola';
COMMENT ON SCHEMA audit IS 'Auditoria imutável — registo de alterações críticas';
