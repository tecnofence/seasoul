import type { FastifyInstance } from 'fastify'
import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'
import { OTPAuth } from 'otpauth'
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  verifyTwoFaSchema,
} from './schemas.js'

export default async function authRoutes(app: FastifyInstance) {
  // ── POST /register — Registar novo utilizador (só admins) ──
  app.post('/register', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const parsed = registerSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    // Apenas SUPER_ADMIN e RESORT_MANAGER podem registar
    if (!['SUPER_ADMIN', 'RESORT_MANAGER'].includes(request.user.role)) {
      return reply.code(403).send({ error: 'Sem permissão para registar utilizadores' })
    }

    const { name, email, password, role, resortId } = parsed.data

    const exists = await app.prisma.user.findUnique({ where: { email } })
    if (exists) {
      return reply.code(409).send({ error: 'Email já registado' })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const user = await app.prisma.user.create({
      data: { name, email, passwordHash, role, resortId },
      select: { id: true, name: true, email: true, role: true, resortId: true },
    })

    return reply.code(201).send({ data: user, message: 'Utilizador criado com sucesso' })
  })

  // ── POST /login — Autenticação ──
  app.post('/login', async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    const { email, password } = parsed.data

    const user = await app.prisma.user.findUnique({ where: { email } })
    if (!user || !user.active) {
      return reply.code(401).send({ error: 'Credenciais inválidas' })
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return reply.code(401).send({ error: 'Credenciais inválidas' })
    }

    // Se 2FA está ativo, retornar flag sem tokens
    if (user.twoFaEnabled) {
      const tempToken = app.jwt.sign(
        { id: user.id, email: user.email, role: user.role, resortId: user.resortId, pending2fa: true },
        { expiresIn: '5m' },
      )
      return reply.send({
        data: { requiresTwoFa: true, tempToken },
        message: 'Código 2FA necessário',
      })
    }

    // Gerar tokens
    const tokens = await generateTokens(app, user)

    return reply.send({
      data: {
        ...tokens,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          resortId: user.resortId,
          twoFaEnabled: user.twoFaEnabled,
        },
        requiresTwoFa: false,
      },
    })
  })

  // ── POST /2fa/verify — Verificar código 2FA após login ──
  app.post('/2fa/verify', async (request, reply) => {
    const parsed = verifyTwoFaSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    // Extrair temp token do header
    let decoded: { id: string; email: string; role: string; resortId?: string | null; pending2fa?: boolean }
    try {
      decoded = await request.jwtVerify()
    } catch {
      return reply.code(401).send({ error: 'Token temporário inválido ou expirado' })
    }

    if (!('pending2fa' in decoded) || !decoded.pending2fa) {
      return reply.code(400).send({ error: 'Token não é de verificação 2FA' })
    }

    const user = await app.prisma.user.findUnique({ where: { id: decoded.id } })
    if (!user || !user.twoFaSecret) {
      return reply.code(404).send({ error: 'Utilizador não encontrado' })
    }

    const totp = new OTPAuth.TOTP({
      issuer: process.env.TOTP_ISSUER || 'Sea and Soul ERP',
      label: user.email,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(user.twoFaSecret),
    })

    const isValid = totp.validate({ token: parsed.data.code, window: 1 }) !== null
    if (!isValid) {
      return reply.code(401).send({ error: 'Código 2FA inválido' })
    }

    const tokens = await generateTokens(app, user)

    return reply.send({
      data: {
        ...tokens,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          resortId: user.resortId,
          twoFaEnabled: user.twoFaEnabled,
        },
      },
    })
  })

  // ── POST /2fa/setup — Configurar 2FA (gerar secret + URI) ──
  app.post('/2fa/setup', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const user = await app.prisma.user.findUnique({ where: { id: request.user.id } })
    if (!user) {
      return reply.code(404).send({ error: 'Utilizador não encontrado' })
    }

    if (user.twoFaEnabled) {
      return reply.code(400).send({ error: '2FA já está ativo' })
    }

    const secret = new OTPAuth.Secret({ size: 20 })
    const totp = new OTPAuth.TOTP({
      issuer: process.env.TOTP_ISSUER || 'Sea and Soul ERP',
      label: user.email,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret,
    })

    // Guardar secret (sem ativar ainda)
    await app.prisma.user.update({
      where: { id: user.id },
      data: { twoFaSecret: secret.base32 },
    })

    return reply.send({
      data: {
        secret: secret.base32,
        uri: totp.toString(),
      },
      message: 'Leia o QR code na app de autenticação e confirme com /2fa/enable',
    })
  })

  // ── POST /2fa/enable — Confirmar e ativar 2FA ──
  app.post('/2fa/enable', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const parsed = verifyTwoFaSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    const user = await app.prisma.user.findUnique({ where: { id: request.user.id } })
    if (!user || !user.twoFaSecret) {
      return reply.code(400).send({ error: '2FA não foi configurado. Execute /2fa/setup primeiro.' })
    }

    if (user.twoFaEnabled) {
      return reply.code(400).send({ error: '2FA já está ativo' })
    }

    const totp = new OTPAuth.TOTP({
      issuer: process.env.TOTP_ISSUER || 'Sea and Soul ERP',
      label: user.email,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(user.twoFaSecret),
    })

    const isValid = totp.validate({ token: parsed.data.code, window: 1 }) !== null
    if (!isValid) {
      return reply.code(401).send({ error: 'Código inválido. Tente novamente.' })
    }

    await app.prisma.user.update({
      where: { id: user.id },
      data: { twoFaEnabled: true },
    })

    return reply.send({ data: { twoFaEnabled: true }, message: '2FA ativado com sucesso' })
  })

  // ── POST /refresh — Renovar access token ──
  app.post('/refresh', async (request, reply) => {
    const parsed = refreshSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    const { refreshToken } = parsed.data
    const tokenHash = hashToken(refreshToken)

    const stored = await app.prisma.refreshToken.findUnique({ where: { tokenHash } })
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      return reply.code(401).send({ error: 'Refresh token inválido ou expirado' })
    }

    // Revogar token usado (rotação)
    await app.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    })

    const user = await app.prisma.user.findUnique({ where: { id: stored.userId } })
    if (!user || !user.active) {
      return reply.code(401).send({ error: 'Utilizador inativo' })
    }

    const tokens = await generateTokens(app, user)

    return reply.send({ data: tokens })
  })

  // ── POST /logout — Revogar refresh token ──
  app.post('/logout', async (request, reply) => {
    const parsed = refreshSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    const tokenHash = hashToken(parsed.data.refreshToken)

    await app.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    })

    return reply.send({ message: 'Sessão terminada com sucesso' })
  })

  // ── GET /me — Perfil do utilizador autenticado ──
  app.get('/me', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const user = await app.prisma.user.findUnique({
      where: { id: request.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        resortId: true,
        twoFaEnabled: true,
        createdAt: true,
      },
    })

    if (!user) {
      return reply.code(404).send({ error: 'Utilizador não encontrado' })
    }

    return reply.send({ data: user })
  })
}

// ── Helpers ──────────────────────────────────────

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

async function generateTokens(
  app: FastifyInstance,
  user: { id: string; email: string; role: string; resortId: string | null },
) {
  const payload = { id: user.id, email: user.email, role: user.role, resortId: user.resortId }

  const accessToken = app.jwt.sign(payload, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  })

  const refreshToken = crypto.randomBytes(40).toString('hex')
  const tokenHash = hashToken(refreshToken)
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7) // 7 dias

  await app.prisma.refreshToken.create({
    data: { userId: user.id, tokenHash, expiresAt },
  })

  return { accessToken, refreshToken, expiresIn: 900 }
}
