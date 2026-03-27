#!/bin/bash
# ══════════════════════════════════════════════════
# Sea and Soul ERP — Setup inicial VPS Hetzner
# ENGERIS — engeris.co.ao
# Executar uma vez no VPS após provisionar
# ══════════════════════════════════════════════════

set -e

echo "🚀 Iniciando setup VPS Sea and Soul..."

# Atualizar sistema
apt-get update && apt-get upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker

# Instalar Docker Compose
apt-get install -y docker-compose-plugin

# Instalar WireGuard (VPN)
apt-get install -y wireguard

# Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
npm install -g pnpm

# Criar pasta do projeto
mkdir -p /opt/sea-and-soul
cd /opt/sea-and-soul

# Clonar repositório
# git clone https://github.com/engeris/sea-and-soul.git .

# Copiar .env
cp .env.example .env
echo "⚠️  Edita o ficheiro .env com as credenciais reais!"

# Iniciar serviços
# docker-compose -f docker-compose.prod.yml up -d

echo "✅ Setup VPS concluído!"
echo "📝 Próximos passos:"
echo "   1. Editar /opt/sea-and-soul/.env"
echo "   2. Configurar WireGuard VPN"
echo "   3. docker-compose -f docker-compose.prod.yml up -d"
echo "   4. Configurar SSL com Let's Encrypt"
