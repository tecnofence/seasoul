# CLAUDE.md - Sea and Soul ERP

## Project Overview

Sea and Soul Resorts ERP system built by ENGERIS for two resort properties in Angola (Cabo Ledo and Sangano). Full-stack TypeScript monorepo covering PMS, POS, Stock, HR, Guest App, Smart Locks, and a centralized management dashboard.

## Tech Stack

| Layer | Technology |
|---|---|
| Monorepo | pnpm workspaces + Turborepo |
| API | Fastify 4 + TypeScript (apps/api) |
| Web | Next.js 14 + React 18 + Tailwind CSS (apps/web) |
| Mobile | React Native + Expo 51 (apps/mobile) |
| Database | PostgreSQL 16 + Prisma ORM |
| Cache/Queues | Redis 7 + BullMQ |
| File Storage | MinIO (S3-compatible) |
| Auth | JWT + 2FA (TOTP) |
| Validation | Zod |
| Testing | Vitest (API) |
| CI/CD | GitHub Actions |
| Containerization | Docker + Docker Compose |

## Repository Structure

```
sea-and-soul/
├── apps/
│   ├── api/             # Fastify REST API (port 3001)
│   │   └── src/server.ts
│   ├── web/             # Next.js ERP dashboard + public sites (port 3000)
│   └── mobile/          # React Native guest + staff app (Expo)
├── packages/
│   ├── db/              # Prisma schema, migrations, seed
│   ├── types/           # Shared TypeScript types (@seasoul/types)
│   ├── ui/              # Shared UI constants, colors, labels (@seasoul/ui)
│   └── utils/           # Shared utilities — formatting, GPS, invoicing (@seasoul/utils)
├── infra/
│   ├── docker/          # Dockerfiles (api.Dockerfile, web.Dockerfile)
│   ├── nginx/           # Nginx reverse proxy config
│   └── scripts/         # backup.sh, init.sql, setup-vps.sh
├── docs/
│   ├── architecture/    # Architecture diagrams
│   ├── api/             # API documentation
│   └── sprints/         # Sprint planning (3 sprints)
├── docker-compose.yml        # Dev environment
├── docker-compose.prod.yml   # Production environment
├── turbo.json                # Turborepo task config
├── pnpm-workspace.yaml
└── .env.example              # All environment variables documented
```

## Common Commands

```bash
# Install dependencies
pnpm install

# Start all services in dev mode (via Turborepo)
pnpm dev

# Build all packages
pnpm build

# Lint all packages
pnpm lint

# Run tests
pnpm test

# Format code
pnpm format

# Database operations
pnpm db:migrate       # Run Prisma migrations (dev)
pnpm db:migrate:prod  # Deploy migrations (production)
pnpm db:seed          # Seed test data
pnpm db:studio        # Open Prisma Studio GUI

# Docker (dev services)
docker-compose up -d postgres redis minio

# Docker (production)
docker-compose -f docker-compose.prod.yml up -d
```

## Development Setup

1. `pnpm install`
2. `cp .env.example .env` and fill in credentials
3. `docker-compose up -d postgres redis minio`
4. `pnpm db:migrate`
5. `pnpm db:seed`
6. `pnpm dev`

Dev URLs: Web at `localhost:3000`, API at `localhost:3001`, Swagger at `localhost:3001/docs`, MinIO at `localhost:9001`

## Architecture & Conventions

### Monorepo Package References

- Internal packages use `@seasoul/` scope: `@seasoul/db`, `@seasoul/types`, `@seasoul/ui`, `@seasoul/utils`
- Apps import from shared packages; packages should not import from apps

### API Conventions (apps/api)

- Fastify with plugin-based architecture — routes registered as Fastify plugins with versioned prefixes (`/v1/...`)
- Prisma client is available as a Fastify decorator (`app.prisma`)
- Authentication via JWT with `app.authenticate` preHandler hook
- Request validation with Zod schemas
- Logging via Pino (with pino-pretty in dev)
- Rate limiting enabled globally via `@fastify/rate-limit`
- Swagger/OpenAPI docs auto-generated at `/docs`
- Background jobs use BullMQ with Redis

### Web Conventions (apps/web)

- Next.js 14 with App Router
- Tailwind CSS for styling with custom brand colors (primary: `#1A3E6E`)
- React Query (`@tanstack/react-query`) for server state
- React Hook Form + Zod for form validation
- `next-intl` for i18n (PT/EN/FR/ES)
- Recharts for data visualization
- `lucide-react` for icons
- Utility: `clsx` + `tailwind-merge` for conditional classes

### Mobile Conventions (apps/mobile)

- Expo 51 + React Native 0.74
- React Navigation (stack navigator)
- React Query for API calls
- Zustand for local state
- WatermelonDB for offline-first data sync
- `expo-location` for GPS geofencing (attendance)
- `expo-secure-store` for token storage

### Database (packages/db)

- Prisma ORM with PostgreSQL
- All monetary values use `Decimal(15, 2)` — never Float
- IDs are CUIDs (`@default(cuid())`)
- Timestamps: `createdAt` + `updatedAt` on all models
- Multi-resort: most entities have a `resortId` foreign key
- Indexes defined on frequently queried fields
- Schema file: `packages/db/prisma/schema.prisma`

### Shared Packages

- **@seasoul/types** — All TypeScript types and enums mirroring the Prisma schema. API responses use `ApiResponse<T>` and `PaginatedResponse<T>` wrappers.
- **@seasoul/ui** — Brand colors, status badge variants, Portuguese labels for enums, business constants (tax rate 14%, check-in/out hours, working days).
- **@seasoul/utils** — Formatting (Kwanza currency, dates in pt-AO locale), GPS/geofencing calculations, invoice number generation, tax calculations, HR hour/salary calculations, NIF/phone validation for Angola.

### Business Domain

- **Currency**: Angolan Kwanza (AOA), formatted via `formatKwanza()`
- **Tax**: IVA Angola at 14% (`ANGOLA_TAX_RATE`)
- **Invoicing**: AGT (Angolan tax authority) electronic invoicing with RSA signatures
- **Locale**: Primary Portuguese (pt-AO), with EN/FR/ES support
- **Resorts**: Two properties — Cabo Ledo (lat: -9.0333) and Sangano (lat: -9.1000), each with 300m geofence radius
- **Smart Locks**: TTLock integration via Seam API
- **SMS**: Africa's Talking
- **Email**: Resend

## Code Style

- TypeScript strict mode across all packages
- Prettier for formatting (`**/*.{ts,tsx,json,md}`)
- Portuguese used for code comments, UI labels, and documentation
- English used for code identifiers (variable names, function names, types)
- Enums use UPPER_SNAKE_CASE
- Files use kebab-case or camelCase (no PascalCase file names except React components)

## Environment & Branches

| Environment | URL | Branch |
|---|---|---|
| Development | localhost | `develop` |
| Staging | staging.seasoul.engeris.co.ao | `staging` |
| Production | app.seasoul.ao | `main` |

## CI/CD

GitHub Actions workflow (`.github/workflows/deploy.yml`):
- **On PR to main**: Lint + Test
- **On push to staging**: Lint + Test, then deploy via SSH to VPS
- **On push to main**: Lint + Test, then deploy to production VPS

Deployment: SSH into Hetzner VPS, git pull, docker-compose build + up, run migrations.

## Key Files

- `packages/db/prisma/schema.prisma` — Complete data model (20+ models)
- `apps/api/src/server.ts` — API entry point and plugin registration
- `packages/types/src/index.ts` — All shared TypeScript types
- `packages/ui/src/index.ts` — Brand colors, labels, business constants
- `packages/utils/src/index.ts` — Utility functions (formatting, GPS, invoicing)
- `.env.example` — All environment variables with descriptions
- `docker-compose.yml` — Dev infrastructure (Postgres, Redis, MinIO, Grafana, Prometheus)

## Security Notes

- Never commit `.env`, `*.pem`, `*.key`, or `secrets/` directory
- JWT secrets must be 64+ characters
- 2FA (TOTP) mandatory for admin roles
- Access PINs for smart locks are AES-256 encrypted in the database
- AGT invoice signing uses RSA private keys stored in Docker secrets
- Rate limiting on all API endpoints
- CORS restricted by environment
