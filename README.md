# 🏨 Sea and Soul Resorts — ERP Completo

> Desenvolvido por **ENGERIS — Engenharia e Integração de Sistemas**
> engeris.co.ao | Março 2026

---

## 📋 Sobre o Projeto

Sistema ERP 100% custom para o grupo **Sea and Soul Resorts**, cobrindo os dois resorts:
- **Cabo Ledo Resort** — qpointcaboledo.com
- **Sangano Resort** — qpointsangano.com

### Módulos
- 🌐 Sites + Motor de Reservas (PT/EN/FR/ES)
- 📅 PMS — Gestão de Reservas
- 🛒 POS — Ponto de Venda + Faturação AGT
- 📦 Gestão de Stock
- 👥 Recursos Humanos
- ⏱️ Controlo de Assiduidade (App GPS + Geofencing)
- 🔐 Fechaduras Inteligentes (TTLock + Seam API)
- 🛎️ Serviços do Resort Digitalizados
- 📱 App do Hóspede (iOS + Android)
- 📊 Painel Central (Sede Sea and Soul)

---

## 🛠️ Stack Técnica

| Camada | Tecnologia |
|---|---|
| Frontend Web | Next.js 14 + TypeScript + Tailwind CSS |
| Backend API | Node.js + Fastify + TypeScript |
| App Móvel | React Native + Expo |
| Base de Dados | PostgreSQL 16 |
| Cache / Filas | Redis + Bull |
| Ficheiros | MinIO (S3-compatible) |
| ORM | Prisma |
| Autenticação | JWT + 2FA (TOTP) |
| Fechaduras | TTLock + Seam API |
| SMS | Africa's Talking |
| Email | Resend |
| VPN | WireGuard |
| Containerização | Docker + Docker Compose |
| CI/CD | GitHub Actions |
| Monitorização | Grafana + Prometheus |
| Hospedagem | VPS Hetzner CCX33 (Frankfurt) |

---

## 📁 Estrutura do Repositório

```
sea-and-soul/
├── apps/
│   ├── web/          # Next.js — Painel ERP + Sites
│   ├── api/          # Fastify — API REST
│   └── mobile/       # React Native — App Hóspede + Staff
├── packages/
│   ├── ui/           # Componentes partilhados
│   ├── utils/        # Utilitários partilhados
│   ├── types/        # Tipos TypeScript partilhados
│   └── db/           # Prisma schema + migrations
├── infra/
│   ├── docker/       # Dockerfiles
│   ├── nginx/        # Configuração Nginx
│   └── scripts/      # Scripts de deploy e backup
├── docs/
│   ├── architecture/ # Diagramas de arquitetura
│   ├── api/          # Documentação da API
│   └── sprints/      # Planeamento de sprints
├── tools/            # Scripts de desenvolvimento
├── docker-compose.yml
├── docker-compose.prod.yml
├── .env.example
└── README.md
```

---

## 🚀 Início Rápido (Desenvolvimento)

### Pré-requisitos
- Node.js 20+
- Docker + Docker Compose
- pnpm 8+

### Instalação

```bash
# 1. Clonar repositório
git clone https://github.com/engeris/sea-and-soul.git
cd sea-and-soul

# 2. Instalar dependências
pnpm install

# 3. Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com as tuas credenciais

# 4. Iniciar serviços (BD, Redis, MinIO)
docker-compose up -d postgres redis minio

# 5. Executar migrations
pnpm db:migrate

# 6. Seed da base de dados (dados de teste)
pnpm db:seed

# 7. Iniciar desenvolvimento
pnpm dev
```

### URLs em desenvolvimento
| Serviço | URL |
|---|---|
| Web (ERP) | http://localhost:3000 |
| API | http://localhost:3001 |
| API Docs (Swagger) | http://localhost:3001/docs |
| MinIO Console | http://localhost:9001 |
| Grafana | http://localhost:3002 |

---

## 🐳 Docker (Produção)

```bash
# Build e deploy produção
docker-compose -f docker-compose.prod.yml up -d

# Ver logs
docker-compose logs -f api

# Backup da base de dados
./infra/scripts/backup.sh
```

---

## 🏗️ Ambientes

| Ambiente | URL | Branch |
|---|---|---|
| Desenvolvimento | localhost | `develop` |
| Staging | staging.seasoul.engeris.co.ao | `staging` |
| Produção | app.seasoul.ao | `main` |

---

## 📅 Sprints

| Sprint | Período | Foco |
|---|---|---|
| Sprint 1 | Mês 1 | Fundação + Sites + PMS + Reservas |
| Sprint 2 | Mês 2 | POS + AGT + Stock + RH + Assiduidade |
| Sprint 3 | Mês 3 | App Móvel + Fechaduras + Painel + Go Live |

Ver detalhes em [`docs/sprints/`](./docs/sprints/)

---

## 🔐 Segurança

- Autenticação JWT com refresh tokens
- 2FA obrigatório para administradores
- Encriptação AES-256 em repouso
- VPN WireGuard entre VPS e resorts
- Assinatura RSA para faturas AGT
- Rate limiting em todos os endpoints
- CORS configurado por ambiente

---

## 👥 Equipa

| Role | Responsabilidade |
|---|---|
| Tech Lead | Arquitetura, revisão de código, decisões técnicas |
| Backend Dev | API Fastify, PostgreSQL, integrações |
| Frontend Dev | Next.js, dashboards, sites |
| Mobile Dev | React Native, app hóspede, assiduidade GPS |
| DevOps | Docker, VPS, CI/CD, monitorização |

---

## 📞 Contacto

**ENGERIS — Engenharia e Integração de Sistemas**
🌐 engeris.co.ao
📧 geral@engeris.co.ao

---

*Versão 1.0.0 | Março 2026 | Confidencial*
