# ENGERIS ONE — Roadmap de Desenvolvimento

## Visão do Produto

**ENGERIS ONE** é uma plataforma ERP modular multi-indústria desenvolvida pela ENGERIS, desenhada para empresas em Angola e mercados PALOP. O sistema permite que qualquer tipo de negócio — hotelaria, segurança eletrónica, eletricidade, engenharia, construção, restauração — utilize apenas os módulos que necessita.

---

## Arquitetura de Alto Nível

```
┌─────────────────────────────────────────────────────────────┐
│                      ENGERIS ONE                            │
│                  Plataforma ERP Modular                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ████████████████  CORE (obrigatório)  ████████████████     │
│  Auth · Utilizadores · Dashboard · Auditoria                │
│  Notificações · Documentos · Chat · Modo Formação           │
│  Multi-idioma (PT/EN/FR/ES) · Multi-filial                  │
│                                                             │
├──────────────┬──────────────┬───────────────────────────────┤
│  HOTELARIA   │  RESTAURAÇÃO │  ENGENHARIA & CONSTRUÇÃO      │
│  (PMS)       │  (POS)       │  (ENG)                        │
│  Reservas    │  Vendas      │  Projetos & Obras             │
│  Quartos     │  Mesas       │  Orçamentos técnicos          │
│  Tarifas     │  Menu        │  Cronograma                   │
│  Check-in/out│  Cozinha     │  Equipas no terreno           │
│  Smart Locks │  Entregas    │  Autos de medição             │
├──────────────┼──────────────┼───────────────────────────────┤
│  SEGURANÇA   │ ELETRICIDADE │  SERVIÇOS & MANUTENÇÃO        │
│  (SEC)       │ (ELEC)       │  (SVC)                        │
│  Contratos   │  Projetos    │  Tickets/OS                   │
│  Instalações │  Instalações │  SLA & prioridades            │
│  CCTV/Alarme │  Quadros     │  Manutenção preventiva        │
│  Monitoração │  Certificação│  Agendamento de técnicos      │
│  Rondas      │  Inspeções   │  Checklists                   │
│  Incidentes  │  Medições    │  Relatórios                   │
├──────────────┴──────────────┴───────────────────────────────┤
│                                                             │
│  ████████  MÓDULOS TRANSVERSAIS  ████████                   │
│                                                             │
│  Finanças & Faturação  │  Stock & Compras                   │
│  • FT/FR/NC/ORC/PF/RC  │  • Inventário                     │
│  • Conformidade AGT     │  • Fornecedores                   │
│  • Modo Formação        │  • Ordens de compra               │
│  • Multi-moeda          │  • Requisições internas           │
│  • Retenção na fonte    │  • Transferências                 │
│                         │                                   │
│  RH & Pessoal           │  BI & Relatórios                  │
│  • Colaboradores        │  • Dashboards customizáveis       │
│  • Assiduidade GPS      │  • Exportação Excel/PDF           │
│  • Salários             │  • Relatórios agendados           │
│  • Férias & ausências   │  • KPIs por módulo                │
│                         │                                   │
│  CRM & Clientes         │  Frotas & Logística               │
│  • Base de clientes     │  • Veículos                       │
│  • Pipeline de vendas   │  • Motoristas                     │
│  • Propostas comerciais │  • Combustível                    │
│  • Campanhas            │  • Rotas & entregas               │
│                         │                                   │
│  Contratos & Jurídico   │  App Móvel                        │
│  • Gestão de contratos  │  • iOS & Android                  │
│  • Renovações auto      │  • Offline-first                  │
│  • Alertas expiração    │  • Geofencing                     │
│  • Templates            │  • Push notifications             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Fases de Desenvolvimento

### FASE 0 — Fundação ✦ PRIORIDADE MÁXIMA

**Objetivo**: Transformar o projeto de ERP single-client em plataforma multi-tenant modular.

| Tarefa | Descrição | Ficheiros |
|--------|-----------|-----------|
| Rebrand | Sea & Soul → ENGERIS ONE em todo o código | ~25 ficheiros |
| Multi-tenant | Modelos Tenant, License, TenantModule no Prisma | schema.prisma |
| Sistema de módulos | Registry de módulos com feature flags | packages/types |
| Middleware tenant | Isolamento de dados por tenant na API | apps/api |
| Sidebar dinâmica | Menu baseado nos módulos ativos do tenant | apps/web |
| Modo Formação | Flag isTraining em documentos fiscais | schema.prisma + API |
| Seed multi-tenant | Dados demo para vários tipos de negócio | seed.ts |

### FASE 1 — Core Universal (já ~80% feito)

| Módulo | Estado | O que falta |
|--------|--------|-------------|
| Auth (JWT + 2FA) | ✅ Feito | Convite por email |
| Utilizadores | ✅ Feito | Permissões por módulo |
| Dashboard | ✅ Feito | Widgets dinâmicos por módulo |
| Auditoria | ✅ Feito | Exportação de relatórios |
| Notificações | ✅ Feito | Templates configuráveis |
| Documentos | ✅ Feito | Preview inline |
| Chat | ✅ Feito | WebSocket (upgrade de polling) |
| Modo Formação | 🔲 Por fazer | Banner + flag + dados fictícios |

### FASE 2 — Faturação Universal AGT

**Objetivo**: Sistema de faturação completo conforme legislação angolana, aplicável a qualquer indústria.

| Documento | Código | Descrição |
|-----------|--------|-----------|
| Fatura | FT | Venda de bens/serviços |
| Fatura-Recibo | FR | Venda com pagamento imediato |
| Nota de Crédito | NC | Devoluções e correções |
| Orçamento | ORC | Propostas comerciais |
| Proforma | PF | Fatura provisória |
| Recibo | RC | Confirmação de pagamento |
| Nota de Débito | ND | Cobranças adicionais |
| Auto de Medição | AM | Medição de obra executada |
| Guia de Transporte | GT | Movimentação de materiais |
| Contrato de Serviço | CS | Faturação recorrente |

Funcionalidades:
- Numeração sequencial por série (A, B, C...) conforme AGT
- Assinatura digital RSA (HASH do documento anterior)
- QR Code com dados fiscais
- Modo Formação (série TREINO, não reporta à AGT)
- Multi-moeda (AOA/USD/EUR) com câmbio do dia
- Retenção na fonte (quando aplicável)
- Exportação SAFT-AO
- Impressão térmica (POS) + A4 (escritório)

### FASE 3 — Módulos Verticais (Indústrias)

#### 3.1 PMS — Hotelaria (já ~90% feito)
- Reservas, Quartos, Tarifas, Check-in/out, Smart Locks
- Guest App, Reviews, Room Service
- **Falta**: Channel Manager, Revenue Management, Housekeeping avançado

#### 3.2 POS — Restauração (já ~70% feito)
- Ponto de venda, Produtos, Vendas
- **Falta**: Gestão de mesas, Cozinha (KDS), Menu digital, Entregas

#### 3.3 ENG — Engenharia & Construção
- Gestão de projetos e obras
- Orçamentos técnicos com BQ (Bill of Quantities)
- Cronograma de obra (Gantt)
- Alocação de equipas e equipamentos
- Autos de medição por fase
- Controlo de custos vs orçamento
- Diário de obra digital

#### 3.4 SEC — Segurança Eletrónica
- Gestão de contratos de vigilância
- Planeamento de instalações (CCTV, alarmes, controlo de acesso)
- Monitorização de sistemas (status online/offline)
- Gestão de rondas e checkpoints
- Registo de incidentes e ocorrências
- Inventário de equipamentos instalados por cliente
- Manutenção preventiva de sistemas

#### 3.5 ELEC — Eletricidade
- Projetos elétricos (BT/MT)
- Gestão de instalações e certificação
- Dimensionamento de quadros elétricos
- Inspeções e relatórios técnicos
- Gestão de medições e ensaios
- Stock de material elétrico
- Orçamentação técnica

#### 3.6 SVC — Serviços & Manutenção
- Tickets e ordens de serviço
- SLA com escalação automática
- Manutenção preventiva (calendário)
- Agendamento de técnicos (disponibilidade)
- Checklists de intervenção
- Relatórios técnicos com fotos
- Histórico de intervenções por equipamento

### FASE 4 — Módulos Transversais

| Módulo | Prioridade | Dependências |
|--------|------------|--------------|
| Finanças & Faturação | 🔴 Alta | Core |
| Stock & Compras | 🔴 Alta | Core |
| RH & Pessoal | 🟡 Média | Core |
| CRM & Clientes | 🟡 Média | Core + Faturação |
| Frotas & Logística | 🟢 Baixa | Core + RH |
| Contratos & Jurídico | 🟡 Média | Core + CRM |
| BI & Relatórios | 🟡 Média | Core + qualquer módulo |

### FASE 5 — SaaS & Escala

| Feature | Descrição |
|---------|-----------|
| White Label | Logo, cores, domínio por tenant |
| Multi-tenant completo | Isolamento total de dados |
| Marketplace | Plugins e integrações de terceiros |
| App Móvel universal | Staff + Cliente, offline-first |
| API Gateway | Acesso API para integrações externas |
| Webhooks & Automações | Motor de regras no-code |
| Offline Mode | Service Workers + sync |
| Backup automático | Por tenant, com retenção configurável |

---

## Modelo de Licenciamento

```
┌──────────┬───────────────┬───────────────┬─────────────┐
│ Starter  │ Professional  │  Enterprise   │  Custom     │
│ $99/mês  │   $299/mês    │   $599/mês    │ Sob medida  │
├──────────┼───────────────┼───────────────┼─────────────┤
│ Core     │ Core          │ Core          │ Todos       │
│ 1 módulo │ 3 módulos     │ Todos módulos │             │
│ vertical │ verticais     │ verticais     │ + SLA       │
│          │ + Faturação   │ + Todos       │ + Suporte   │
│ 5 users  │ + Stock       │   transversais│   dedicado  │
│ 1 filial │ + RH          │               │ + Dev custom│
│          │               │ Users ilimit. │             │
│          │ 20 users      │ Filiais ilim. │             │
│          │ 3 filiais     │ White Label   │             │
│          │               │ API Gateway   │             │
├──────────┴───────────────┴───────────────┴─────────────┤
│  Addons: App Móvel (+$49), Offline (+$79),             │
│          API Gateway (+$49), White Label (+$99)        │
└────────────────────────────────────────────────────────┘
```

---

## Stack Técnica

| Camada | Tecnologia |
|--------|------------|
| Monorepo | pnpm workspaces + Turborepo |
| API | Fastify 4 + TypeScript |
| Web | Next.js 14 + React 18 + Tailwind CSS |
| Mobile | React Native + Expo 51 |
| Database | PostgreSQL 16 + Prisma ORM |
| Cache/Queues | Redis 7 + BullMQ |
| File Storage | MinIO (S3-compatible) |
| Auth | JWT + 2FA (TOTP) |
| Validation | Zod |
| Testing | Vitest |
| CI/CD | GitHub Actions |
| Container | Docker + Docker Compose |
| Monitoring | Grafana + Prometheus |

---

## Mercado-Alvo

| País | Moeda | Legislação Fiscal | Idioma |
|------|-------|-------------------|--------|
| Angola | AOA (Kwanza) | AGT — SAFT-AO | PT |
| Moçambique | MZN (Metical) | AT — SAFT-MZ | PT |
| Cabo Verde | CVE (Escudo) | DNRE | PT |
| São Tomé e Príncipe | STN (Dobra) | DGCI | PT |
| Guiné-Bissau | XOF (Franco CFA) | DGCI | PT |
| Portugal | EUR (Euro) | AT — SAFT-PT | PT |

---

## Cronograma Estimado

| Fase | Duração | Resultado |
|------|---------|-----------|
| Fase 0 — Fundação | 1-2 semanas | Plataforma modular base |
| Fase 1 — Core | ✅ ~80% feito | Módulo core completo |
| Fase 2 — Faturação | 2-3 semanas | Sistema fiscal universal |
| Fase 3 — Verticais | 4-6 semanas | Indústrias específicas |
| Fase 4 — Transversais | 3-4 semanas | Módulos partilhados |
| Fase 5 — SaaS | 4-6 semanas | Plataforma comercial |

**MVP para primeiro cliente (Sea & Soul)**: Fase 0 + 1 + 2 + PMS + POS
**MVP comercial**: + 2 módulos verticais adicionais
