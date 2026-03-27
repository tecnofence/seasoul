# ══════════════════════════════════════════════════
# Sea and Soul ERP — API Dockerfile (Fastify)
# ══════════════════════════════════════════════════

FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
RUN npm install -g pnpm
WORKDIR /app

# ── DEPENDÊNCIAS ───────────────────────────────────
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ── DESENVOLVIMENTO ────────────────────────────────
FROM base AS development
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3001
CMD ["pnpm", "dev"]

# ── BUILD ──────────────────────────────────────────
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# ── PRODUÇÃO ───────────────────────────────────────
FROM node:20-alpine AS production
RUN apk add --no-cache libc6-compat
RUN npm install -g pnpm
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 fastify

COPY --from=builder --chown=fastify:nodejs /app/dist ./dist
COPY --from=builder --chown=fastify:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=fastify:nodejs /app/package.json ./

USER fastify
EXPOSE 3001
CMD ["node", "dist/server.js"]
