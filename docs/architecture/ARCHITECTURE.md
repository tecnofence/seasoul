# 🏗️ Arquitetura Técnica — Sea and Soul ERP

> ENGERIS — engeris.co.ao | Março 2026

---

## Visão Geral

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENTES / UTILIZADORES                   │
│  Browser   App Móvel   Tablets Resort   App Hóspede         │
└────────┬────────┬──────────┬─────────────┬──────────────────┘
         │        │          │             │
         └────────┴──────────┴─────────────┘
                            │
                     ┌──────▼──────┐
                     │    NGINX    │
                     │ SSL + Proxy │
                     └──────┬──────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
       ┌──────▼──────┐ ┌───▼───┐  ┌─────▼──────┐
       │  Next.js    │ │Fastify│  │  Grafana   │
       │  (Web ERP)  │ │ (API) │  │ (Monitor.) │
       └─────────────┘ └───┬───┘  └────────────┘
                           │
          ┌────────────────┼───────────────────┐
          │                │                   │
   ┌──────▼──────┐  ┌──────▼──────┐  ┌────────▼────────┐
   │ PostgreSQL  │  │    Redis    │  │     MinIO       │
   │ (Dados)     │  │(Cache/Filas)│  │   (Ficheiros)   │
   └─────────────┘  └─────────────┘  └─────────────────┘
          │
   ┌──────▼──────────────────────────────┐
   │         INTEGRAÇÕES EXTERNAS        │
   │  AGT API  │  Seam API  │  Africa's  │
   │  (Faturas)│ (Fechaduras)│  Talking  │
   └─────────────────────────────────────┘
```

---

## Stack por Camada

### Frontend Web — Next.js 14
- **Framework:** Next.js 14 (App Router + SSR)
- **Linguagem:** TypeScript
- **Estilos:** Tailwind CSS
- **Estado:** React Query (TanStack Query)
- **Gráficos:** Recharts
- **Forms:** React Hook Form + Zod
- **i18n:** next-intl (PT/EN/FR/ES)

### Backend API — Fastify
- **Framework:** Fastify 4
- **Linguagem:** TypeScript
- **ORM:** Prisma 5
- **Autenticação:** JWT + Refresh Tokens + 2FA TOTP
- **Validação:** Zod
- **Filas:** Bull + Redis
- **Docs:** Swagger (fastify-swagger)
- **Logs:** Pino

### App Móvel — React Native
- **Framework:** React Native + Expo SDK 51
- **Navegação:** React Navigation 6
- **Estado:** Zustand + React Query
- **GPS:** Expo Location
- **Notificações:** Expo Notifications
- **Offline:** WatermelonDB (sync local)
- **Fechaduras:** Seam SDK

### Base de Dados — PostgreSQL 16
```sql
-- Schemas principais
CREATE SCHEMA public;      -- Dados gerais
CREATE SCHEMA financeiro;  -- Faturas, pagamentos
CREATE SCHEMA rh;          -- Colaboradores, salários
CREATE SCHEMA agt;         -- Dados fiscais AGT
```

---

## Fluxo de Dados — Check-in + Fechadura

```
1. Hóspede faz check-in (App / Receção)
2. API valida reserva no PostgreSQL
3. API chama Seam API → gera PIN único
4. Seam API programa fechadura TTLock
5. Bull Queue envia SMS (Africa's Talking) + Email (Resend)
6. Hóspede recebe PIN no telemóvel
7. Hóspede acede ao quarto com PIN
8. No check-out → API revoga PIN via Seam API
```

---

## Fluxo AGT — Faturação Eletrónica

```
1. POS emite venda
2. API gera fatura (número de série sequencial)
3. Fatura assinada digitalmente (RSA x.509 SHA-1)
4. Fatura enviada à AGT API em tempo real
5. AGT responde com confirmação + QR code
6. Fatura PDF gerada e guardada no MinIO
7. PDF enviado ao cliente por email/app
8. Dados incluídos no SAF-T mensal
```

---

## Modo Offline — Sangano Resort

```
Internet OK:
  App/POS → API Local Cache → VPS PostgreSQL

Internet em baixo:
  App/POS → WatermelonDB (local) → [queue]
                                      │
                        (internet volta)
                                      │
                             Sync com VPS
                             AGT queue flush
```

---

## Segurança

| Camada | Implementação |
|---|---|
| HTTPS | Let's Encrypt — renovação automática |
| API Auth | JWT (15min) + Refresh (7d) |
| 2FA | TOTP (Google Authenticator) |
| Passwords | Bcrypt (rounds: 12) |
| DB | Encriptação AES-256 em repouso |
| Rede | WireGuard VPN resort ↔ VPS |
| AGT | RSA x.509 SHA-1 1024 bits |
| Rate Limit | 100 req/min por IP |
| CORS | Whitelist de origens por ambiente |

---

## Monitorização

- **Grafana:** Dashboards de ocupação, receita, POS, stock
- **Prometheus:** Métricas de sistema (CPU, RAM, disco, rede)
- **Alertas:** Email + SMS ao tech lead se sistema crítico falhar
- **Logs:** Pino (estruturado) → agregado no Grafana Loki

---

*ENGERIS — engeris.co.ao | Março 2026*
