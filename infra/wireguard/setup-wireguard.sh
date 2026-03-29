#!/bin/bash
# ── Setup WireGuard em Ubuntu 22.04 ────────────────────────────────────────
# Executar em cada nó (VPS, Cabo Ledo, Sangano)
# Uso: sudo bash setup-wireguard.sh [vps|cabo-ledo|sangano]

set -e

NODE_TYPE="${1:-vps}"
WG_DIR="/etc/wireguard"

echo "==> Instalar WireGuard..."
apt-get update -qq
apt-get install -y wireguard wireguard-tools

echo "==> Gerar par de chaves para: $NODE_TYPE"
mkdir -p "$WG_DIR"
chmod 700 "$WG_DIR"

if [ ! -f "$WG_DIR/privatekey" ]; then
  wg genkey | tee "$WG_DIR/privatekey" | wg pubkey > "$WG_DIR/publickey"
  chmod 600 "$WG_DIR/privatekey"
fi

PRIVATE_KEY=$(cat "$WG_DIR/privatekey")
PUBLIC_KEY=$(cat "$WG_DIR/publickey")

echo "==> Chaves geradas para $NODE_TYPE:"
echo "  Chave Privada: $PRIVATE_KEY"
echo "  Chave Pública: $PUBLIC_KEY"
echo ""
echo "  *** Guardar a chave pública e partilhar com o administrador ***"
echo ""

# Copiar configuração correspondente
CONFIG_SRC="$(dirname "$0")/${NODE_TYPE}-wg0.conf"
if [ -f "$CONFIG_SRC" ]; then
  # Substituir placeholder da chave privada
  sed "s|<${NODE_TYPE^^}_PRIVATE_KEY>|$PRIVATE_KEY|g" "$CONFIG_SRC" > "$WG_DIR/wg0.conf"
  chmod 600 "$WG_DIR/wg0.conf"
  echo "==> Configuração copiada para $WG_DIR/wg0.conf"
  echo "    Editar o ficheiro para substituir os restantes placeholders (<...>)"
else
  echo "AVISO: Ficheiro $CONFIG_SRC não encontrado. Configurar manualmente."
fi

# Ativar WireGuard
echo "==> Ativar WireGuard..."
systemctl enable wg-quick@wg0
systemctl start wg-quick@wg0 || echo "AVISO: Iniciar manualmente após configurar as chaves públicas"

echo "==> WireGuard instalado. Estado:"
wg show 2>/dev/null || echo "(interface não ativa — configurar chaves públicas primeiro)"

echo ""
echo "==> Próximos passos:"
echo "  1. Partilhar a chave pública acima com o administrador"
echo "  2. Atualizar $WG_DIR/wg0.conf com as chaves públicas dos outros nós"
echo "  3. sudo systemctl restart wg-quick@wg0"
