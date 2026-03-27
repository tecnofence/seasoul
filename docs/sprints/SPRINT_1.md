# 🏃 Sprint 1 — Mês 1: Fundação + Sites + PMS + Reservas

> **Período:** Semanas 1–4
> **Objetivo:** Base técnica sólida, sites funcionais e sistema de reservas operacional

---

## 🎯 Objetivo do Sprint

Estabelecer toda a infraestrutura técnica, os 3 sites (Cabo Ledo, Sangano, Sea and Soul institucional) e o módulo de gestão de reservas (PMS) com motor de reservas online.

---

## ✅ Critérios de Aceitação do Sprint

- [ ] VPS Hetzner configurado e acessível
- [ ] Docker Compose a correr em produção
- [ ] Base de dados PostgreSQL com schema inicial migrado
- [ ] VPN WireGuard ativa entre VPS e os 2 resorts
- [ ] Sites dos 3 domínios publicados e responsivos
- [ ] Motor de reservas funcional (criar, editar, cancelar)
- [ ] Dashboard PMS com ocupação em tempo real
- [ ] Autenticação JWT + 2FA implementada
- [ ] CI/CD GitHub Actions configurado
- [ ] Ambiente de staging operacional

---

## 📋 Tarefas por Semana

### Semana 1 — Infraestrutura e Base

| ID | Tarefa | Responsável | Estimativa |
|---|---|---|---|
| S1-01 | Configurar VPS Hetzner CCX33 | DevOps | 4h |
| S1-02 | Instalar Docker + Docker Compose | DevOps | 2h |
| S1-03 | Configurar domínios + SSL (Let's Encrypt) | DevOps | 3h |
| S1-04 | Configurar VPN WireGuard (VPS ↔ Cabo Ledo ↔ Sangano) | DevOps | 6h |
| S1-05 | Setup repositório GitHub + branch strategy | Tech Lead | 2h |
| S1-06 | Configurar GitHub Actions CI/CD | DevOps | 4h |
| S1-07 | Setup monorepo (pnpm workspaces) | Tech Lead | 3h |
| S1-08 | Prisma schema — modelos base (resorts, utilizadores, quartos) | Backend | 6h |
| S1-09 | Migrations iniciais PostgreSQL | Backend | 2h |
| S1-10 | Configurar Redis + MinIO | DevOps | 2h |

### Semana 2 — Autenticação + API Base

| ID | Tarefa | Responsável | Estimativa |
|---|---|---|---|
| S1-11 | API Fastify — estrutura base e plugins | Backend | 4h |
| S1-12 | Módulo de autenticação (JWT + Refresh Token) | Backend | 8h |
| S1-13 | Módulo 2FA TOTP (Google Authenticator) | Backend | 4h |
| S1-14 | CRUD utilizadores + perfis de acesso (RBAC) | Backend | 6h |
| S1-15 | Swagger docs — estrutura inicial | Backend | 2h |
| S1-16 | Next.js — setup inicial + i18n (PT/EN/FR/ES) | Frontend | 4h |
| S1-17 | Layout base do ERP (sidebar, navbar, tema) | Frontend | 6h |
| S1-18 | Página de login + 2FA no ERP | Frontend | 4h |
| S1-19 | Gestão de utilizadores no ERP | Frontend | 4h |

### Semana 3 — Sites + Motor de Reservas (Backend)

| ID | Tarefa | Responsável | Estimativa |
|---|---|---|---|
| S1-20 | Prisma schema — reservas, quartos, tarifas | Backend | 4h |
| S1-21 | API — CRUD quartos + categorias | Backend | 6h |
| S1-22 | API — gestão de tarifas e disponibilidade | Backend | 8h |
| S1-23 | API — criar/editar/cancelar reserva | Backend | 8h |
| S1-24 | API — check-in / check-out digital | Backend | 4h |
| S1-25 | Bull Queue — notificações email reserva (Resend) | Backend | 4h |
| S1-26 | Bull Queue — notificações SMS reserva (Africa's Talking) | Backend | 4h |
| S1-27 | Site institucional Sea and Soul (design + conteúdo) | Frontend | 8h |

### Semana 4 — Sites + PMS Dashboard

| ID | Tarefa | Responsável | Estimativa |
|---|---|---|---|
| S1-28 | Site qpointcaboledo.com (redesign + motor de reservas) | Frontend | 12h |
| S1-29 | Site qpointsangano.com (redesign + motor de reservas) | Frontend | 12h |
| S1-30 | Dashboard PMS — ocupação em tempo real | Frontend | 8h |
| S1-31 | Dashboard PMS — calendário de reservas | Frontend | 6h |
| S1-32 | Dashboard PMS — gestão de quartos | Frontend | 4h |
| S1-33 | Testes end-to-end — fluxo de reserva | Tech Lead | 4h |
| S1-34 | Deploy staging + validação com cliente | Tech Lead | 4h |
| S1-35 | Documentação API Sprint 1 | Backend | 2h |

---

## 📦 Entregáveis do Sprint 1

1. **VPS** configurado, seguro e com VPN ativa
2. **3 Sites** publicados (Cabo Ledo, Sangano, Sea and Soul)
3. **Motor de reservas** online funcional nos 3 sites
4. **PMS Dashboard** — vista de ocupação e calendário
5. **Autenticação** completa com 2FA
6. **CI/CD** automático (push → deploy)
7. **Documentação API** atualizada

---

## 🔗 Dependências Externas

| Dependência | Responsável | Prazo |
|---|---|---|
| Credenciais Africa's Talking | ENGERIS | Semana 1 |
| Credenciais Resend (email) | ENGERIS | Semana 1 |
| Conteúdo e imagens dos sites | Sea and Soul | Semana 2 |
| Acesso à rede dos resorts (VPN) | Sea and Soul TI | Semana 1 |
| Domínios apontados para o VPS | Sea and Soul | Semana 1 |

---

## ⚠️ Riscos

| Risco | Probabilidade | Mitigação |
|---|---|---|
| Atraso na configuração VPN Sangano | Média | Começar setup remoto na semana 1 |
| Conteúdo dos sites não entregue | Alta | Usar conteúdo placeholder nos sites |
| Conectividade internet Sangano instável | Média | Testar VPN com 4G de backup |

---

## 📊 Velocidade Estimada

- **Total de horas estimadas:** ~170h
- **Equipa:** 5 pessoas
- **Horas por pessoa:** ~34h/semana

---

*ENGERIS — engeris.co.ao | Sprint 1 | Março 2026*
