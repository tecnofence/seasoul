#!/bin/sh
# ══════════════════════════════════════════════════
# Sea and Soul ERP — Backup Automático PostgreSQL
# ENGERIS — engeris.co.ao
# Executado diariamente às 02:00 via cron
# ══════════════════════════════════════════════════

set -e

DATE=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="seasoul_backup_${DATE}.sql.gz"
BACKUP_DIR="/backups"

mkdir -p $BACKUP_DIR

echo "🔄 Iniciando backup: $BACKUP_FILE"

# Fazer dump e comprimir
PGPASSWORD=$DATABASE_PASSWORD pg_dump \
  -h postgres \
  -U $DATABASE_USER \
  -d $DATABASE_NAME \
  --no-password \
  | gzip > "$BACKUP_DIR/$BACKUP_FILE"

echo "✅ Backup criado: $BACKUP_FILE"

# Remover backups com mais de 30 dias
find $BACKUP_DIR -name "seasoul_backup_*.sql.gz" -mtime +${BACKUP_RETENTION_DAYS:-30} -delete
echo "🧹 Backups antigos removidos"

echo "✅ Backup concluído com sucesso"
