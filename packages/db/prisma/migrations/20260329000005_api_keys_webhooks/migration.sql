-- API Keys para integrações B2B
CREATE TABLE IF NOT EXISTS "ApiKey" (
  "id"          TEXT NOT NULL PRIMARY KEY,
  "tenantId"    TEXT NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE,
  "name"        TEXT NOT NULL,
  "keyHash"     TEXT NOT NULL UNIQUE,
  "keyPrefix"   TEXT NOT NULL,
  "scopes"      TEXT[] NOT NULL DEFAULT '{}',
  "lastUsedAt"  TIMESTAMP(3),
  "expiresAt"   TIMESTAMP(3),
  "active"      BOOLEAN NOT NULL DEFAULT true,
  "createdBy"   TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "ApiKey_tenantId_idx" ON "ApiKey"("tenantId");
CREATE INDEX IF NOT EXISTS "ApiKey_keyHash_idx" ON "ApiKey"("keyHash");

-- Webhooks — endpoints de notificação externos
CREATE TABLE IF NOT EXISTS "WebhookEndpoint" (
  "id"               TEXT NOT NULL PRIMARY KEY,
  "tenantId"         TEXT NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE,
  "url"              TEXT NOT NULL,
  "secret"           TEXT NOT NULL,
  "events"           TEXT[] NOT NULL DEFAULT '{}',
  "active"           BOOLEAN NOT NULL DEFAULT true,
  "description"      TEXT,
  "lastTriggeredAt"  TIMESTAMP(3),
  "failureCount"     INTEGER NOT NULL DEFAULT 0,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "WebhookEndpoint_tenantId_idx" ON "WebhookEndpoint"("tenantId");

-- Histórico de entregas de webhooks
CREATE TABLE IF NOT EXISTS "WebhookDelivery" (
  "id"           TEXT NOT NULL PRIMARY KEY,
  "endpointId"   TEXT NOT NULL REFERENCES "WebhookEndpoint"("id") ON DELETE CASCADE,
  "event"        TEXT NOT NULL,
  "payload"      JSONB NOT NULL,
  "statusCode"   INTEGER,
  "responseBody" TEXT,
  "attempt"      INTEGER NOT NULL DEFAULT 1,
  "success"      BOOLEAN NOT NULL DEFAULT false,
  "deliveredAt"  TIMESTAMP(3),
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "WebhookDelivery_endpointId_idx" ON "WebhookDelivery"("endpointId");
CREATE INDEX IF NOT EXISTS "WebhookDelivery_createdAt_idx" ON "WebhookDelivery"("createdAt");
