-- Novo regime e-factura (DE 683/25 + DP 71/25): campos JWS RS256 e gestão assíncrona AGT
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "agtJwsDocument" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "agtJwsSoftware" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "agtRequestId"   TEXT;

-- Série AGT: ID devolvido após /solicitarSerie
ALTER TABLE "InvoiceSeries" ADD COLUMN IF NOT EXISTS "agtSerieId" TEXT;
