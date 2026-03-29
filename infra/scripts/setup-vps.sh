#!/bin/bash
# ══════════════════════════════════════════════════
# Sea and Soul ERP — Setup inicial VPS Hetzner
# ENGERIS — engeris.co.ao
# Executar uma vez no VPS após provisionar
# ══════════════════════════════════════════════════

set -e

echo "==> Iniciando setup VPS Sea and Soul..."

# ── Atualizar sistema ──────────────────────────────────────────────────────
apt-get update && apt-get upgrade -y

# ── Instalar Docker ────────────────────────────────────────────────────────
echo "==> Instalar Docker..."
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker

# Adicionar utilizador atual ao grupo docker (evita usar sudo)
usermod -aG docker "${SUDO_USER:-$USER}"
echo "==> Utilizador adicionado ao grupo docker (requer novo login para ter efeito)"

# ── Instalar Docker Compose ────────────────────────────────────────────────
apt-get install -y docker-compose-plugin

# ── Instalar WireGuard (VPN) ───────────────────────────────────────────────
echo "==> Instalar WireGuard..."
apt-get install -y wireguard wireguard-tools

# ── Instalar Node.js 20 ────────────────────────────────────────────────────
echo "==> Instalar Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
npm install -g pnpm

# ── Firewall (UFW) ─────────────────────────────────────────────────────────
echo "==> Configurar firewall UFW..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh          # porta 22
ufw allow 80/tcp       # HTTP
ufw allow 443/tcp      # HTTPS
ufw allow 51820/udp    # WireGuard
ufw --force enable
echo "==> Firewall configurado"

# ── Clonar repositório ─────────────────────────────────────────────────────
echo "==> Clonar repositório..."
mkdir -p /opt/sea-and-soul
cd /opt/sea-and-soul
if [ ! -d ".git" ]; then
  git clone https://github.com/<ORG>/sea-and-soul.git .
fi
cp .env.example .env
echo "AVISO: Editar /opt/sea-and-soul/.env antes de continuar"

# ── SSL com Certbot ────────────────────────────────────────────────────────
echo "==> Instalar Certbot para SSL..."
apt-get install -y certbot python3-certbot-nginx
# Certificados gerados após DNS apontar para o servidor:
# certbot --nginx -d app.seasoul.ao -d api.seasoul.ao --non-interactive --agree-tos -m admin@engeris.co.ao

# ── Cron para backups automáticos ─────────────────────────────────────────
echo "==> Configurar cron de backups..."
(crontab -l 2>/dev/null; echo "0 2 * * * cd /opt/sea-and-soul && bash infra/scripts/backup.sh >> /var/log/sea-soul-backup.log 2>&1") | crontab -
echo "==> Backup automático às 02:00 UTC configurado"

# ── Iniciar serviços ───────────────────────────────────────────────────────
echo "==> Iniciar serviços Docker..."
cd /opt/sea-and-soul
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml exec -T api pnpm db:migrate:prod
echo "==> Serviços iniciados"

echo "==> Setup VPS concluído!"
echo "Próximos passos:"
echo "   1. Editar /opt/sea-and-soul/.env com as credenciais reais"
echo "   2. Configurar WireGuard VPN: bash infra/wireguard/setup-wireguard.sh vps"
echo "   3. Emitir certificados SSL: certbot --nginx -d app.seasoul.ao -d api.seasoul.ao"
echo "   4. Reiniciar sessão para o grupo docker ter efeito: newgrp docker"
