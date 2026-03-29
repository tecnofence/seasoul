#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# MinIO lifecycle policy — Retenção de documentos fiscais
# Lei angolana: 5 anos (Art. X CGT); ampliável a 10 anos em caso de infração
#
# Pré-requisito: mcli (MinIO Client) instalado e configurado
#   brew install minio/stable/mc   ou   apt install mc
#   mc alias set seasoul http://localhost:9000 "$MINIO_ACCESS_KEY" "$MINIO_SECRET_KEY"
# ──────────────────────────────────────────────────────────────────────────────

set -euo pipefail

ALIAS="${MC_ALIAS:-seasoul}"
BUCKET_FATURAS="${MINIO_BUCKET_FATURAS:-faturas}"
BUCKET_SAFT="${MINIO_BUCKET_SAFT:-saft}"
BUCKET_DOCS="${MINIO_BUCKET_DOCS:-documents}"

RETENTION_DAYS_STANDARD=1825  # 5 anos = 5 × 365
RETENTION_DAYS_EXTENDED=3650  # 10 anos (infração fiscal)

echo "==> A configurar lifecycle policies no MinIO..."

# ── Bucket: faturas (PDFs e HTMLs de faturas emitidas) ──
mc ilm import "${ALIAS}/${BUCKET_FATURAS}" << EOF
{
  "Rules": [
    {
      "ID": "faturas-retencao-5-anos",
      "Status": "Enabled",
      "Filter": {
        "Prefix": ""
      },
      "Expiration": {
        "Days": ${RETENTION_DAYS_STANDARD}
      }
    },
    {
      "ID": "faturas-anuladas-retencao-10-anos",
      "Status": "Enabled",
      "Filter": {
        "Prefix": "faturas/anuladas/"
      },
      "Expiration": {
        "Days": ${RETENTION_DAYS_EXTENDED}
      }
    }
  ]
}
EOF
echo "  ✓ ${BUCKET_FATURAS}: política de retenção 5 anos configurada"

# ── Bucket: saft (ficheiros SAF-T exportados) ──
mc ilm import "${ALIAS}/${BUCKET_SAFT}" << EOF
{
  "Rules": [
    {
      "ID": "saft-retencao-5-anos",
      "Status": "Enabled",
      "Filter": {
        "Prefix": ""
      },
      "Expiration": {
        "Days": ${RETENTION_DAYS_STANDARD}
      }
    }
  ]
}
EOF
echo "  ✓ ${BUCKET_SAFT}: política de retenção 5 anos configurada"

# ── Bucket: documents (contratos, ficheiros gerais) ──
mc ilm import "${ALIAS}/${BUCKET_DOCS}" << EOF
{
  "Rules": [
    {
      "ID": "docs-retencao-5-anos",
      "Status": "Enabled",
      "Filter": {
        "Prefix": ""
      },
      "Expiration": {
        "Days": ${RETENTION_DAYS_STANDARD}
      }
    }
  ]
}
EOF
echo "  ✓ ${BUCKET_DOCS}: política de retenção 5 anos configurada"

# ── Ativar versionamento nos buckets fiscais ──
echo "==> A ativar versionamento nos buckets fiscais..."
mc version enable "${ALIAS}/${BUCKET_FATURAS}"
mc version enable "${ALIAS}/${BUCKET_SAFT}"
echo "  ✓ Versionamento ativado (imutabilidade de ficheiros fiscais)"

# ── Verificar políticas aplicadas ──
echo ""
echo "==> Políticas de retenção configuradas:"
echo "--- ${BUCKET_FATURAS} ---"
mc ilm ls "${ALIAS}/${BUCKET_FATURAS}"
echo "--- ${BUCKET_SAFT} ---"
mc ilm ls "${ALIAS}/${BUCKET_SAFT}"

echo ""
echo "==> MinIO lifecycle configurado com sucesso!"
echo "    Retenção padrão: ${RETENTION_DAYS_STANDARD} dias (5 anos)"
echo "    Retenção alargada (anuladas): ${RETENTION_DAYS_EXTENDED} dias (10 anos)"
