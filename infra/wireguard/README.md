# WireGuard VPN — Sea and Soul Resorts

Topologia: VPS (servidor) ↔ Cabo Ledo (peer) ↔ Sangano (peer)

## Endereços de rede

| Nó | IP WireGuard | IP Público |
|---|---|---|
| VPS (Hetzner) | 10.0.0.1/24 | <VPS_PUBLIC_IP> |
| Cabo Ledo | 10.0.0.2/32 | <CABO_LEDO_IP> |
| Sangano | 10.0.0.3/32 | <SANGANO_IP> |

## Gerar chaves

```bash
# Em cada nó, gerar par de chaves
wg genkey | tee privatekey | wg pubkey > publickey
```

## Configuração do VPS (servidor hub)

Ficheiro: `/etc/wireguard/wg0.conf`
