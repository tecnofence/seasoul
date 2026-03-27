// Tests: Auth Routes
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import bcrypt from 'bcryptjs'
import authRoutes from './index.js'
import {
  buildTestApp,
  signToken,
  authHeader,
  mockUser,
} from '../../test/helpers.js'

const TEST_PASSWORD = 'password123'

describe('POST /auth/login', () => {
  let app: Awaited<ReturnType<typeof buildTestApp>>['app']
  let prisma: Awaited<ReturnType<typeof buildTestApp>>['prisma']
  let userWithRealHash: typeof mockUser

  beforeEach(async () => {
    // Gerar hash real em rounds=1 (rápido em testes)
    const passwordHash = await bcrypt.hash(TEST_PASSWORD, 1)
    userWithRealHash = { ...mockUser, passwordHash }

    const built = await buildTestApp()
    app = built.app
    prisma = built.prisma
    await app.register(authRoutes, { prefix: '/v1/auth' })
    await app.ready()
  })

  afterEach(async () => { await app.close() })

  it('devolve tokens com credenciais válidas', async () => {
    prisma.user.findUnique.mockResolvedValue(userWithRealHash)
    prisma.refreshToken.create.mockResolvedValue({ id: 'rt_01' })

    const res = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { email: 'admin@seasoul.ao', password: 'password123' },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data).toHaveProperty('accessToken')
    expect(body.data).toHaveProperty('refreshToken')
    expect(body.data.requiresTwoFa).toBe(false)
    expect(body.data.user.email).toBe('admin@seasoul.ao')
    expect(body.data.user).not.toHaveProperty('passwordHash')
  })

  it('retorna 401 com email inexistente', async () => {
    prisma.user.findUnique.mockResolvedValue(null)

    const res = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { email: 'naoexiste@seasoul.ao', password: 'qualquer' },
    })

    expect(res.statusCode).toBe(401)
    expect(res.json().error).toMatch(/credenciais/i)
  })

  it('retorna 401 com password incorreta', async () => {
    prisma.user.findUnique.mockResolvedValue(userWithRealHash)

    const res = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { email: 'admin@seasoul.ao', password: 'passwordErrada' },
    })

    expect(res.statusCode).toBe(401)
  })

  it('retorna 401 para utilizador inativo', async () => {
    prisma.user.findUnique.mockResolvedValue({ ...mockUser, active: false })

    const res = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { email: 'admin@seasoul.ao', password: 'password123' },
    })

    expect(res.statusCode).toBe(401)
  })

  it('retorna tempToken quando 2FA está ativo', async () => {
    prisma.user.findUnique.mockResolvedValue({
      ...userWithRealHash,
      twoFaEnabled: true,
      twoFaSecret: 'JBSWY3DPEHPK3PXP',
    })

    const res = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { email: 'admin@seasoul.ao', password: 'password123' },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data.requiresTwoFa).toBe(true)
    expect(body.data).toHaveProperty('tempToken')
    expect(body.data).not.toHaveProperty('accessToken')
  })

  it('retorna 400 com body inválido', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { email: 'nao-e-email' },
    })

    expect(res.statusCode).toBe(400)
  })
})

describe('POST /auth/refresh', () => {
  let app: Awaited<ReturnType<typeof buildTestApp>>['app']
  let prisma: Awaited<ReturnType<typeof buildTestApp>>['prisma']

  beforeEach(async () => {
    const built = await buildTestApp()
    app = built.app
    prisma = built.prisma
    await app.register(authRoutes, { prefix: '/v1/auth' })
    await app.ready()
  })

  afterEach(async () => { await app.close() })

  it('retorna novo accessToken com refresh token válido', async () => {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 7)

    prisma.refreshToken.findUnique.mockResolvedValue({
      id: 'rt_01',
      userId: mockUser.id,
      tokenHash: 'hash',
      expiresAt: futureDate,
      revokedAt: null,
    })
    prisma.refreshToken.update.mockResolvedValue({})
    prisma.user.findUnique.mockResolvedValue(mockUser)
    prisma.refreshToken.create.mockResolvedValue({ id: 'rt_02' })

    const res = await app.inject({
      method: 'POST',
      url: '/v1/auth/refresh',
      payload: { refreshToken: 'valid-token-string-40-chars-long-abcdefghij' },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().data).toHaveProperty('accessToken')
  })

  it('retorna 401 com refresh token revogado', async () => {
    prisma.refreshToken.findUnique.mockResolvedValue({
      id: 'rt_01',
      userId: mockUser.id,
      tokenHash: 'hash',
      expiresAt: new Date(Date.now() + 1000),
      revokedAt: new Date(), // revogado
    })

    const res = await app.inject({
      method: 'POST',
      url: '/v1/auth/refresh',
      payload: { refreshToken: 'revoked-token-string-40-chars-long-abcdefgh' },
    })

    expect(res.statusCode).toBe(401)
  })

  it('retorna 401 com refresh token não encontrado', async () => {
    prisma.refreshToken.findUnique.mockResolvedValue(null)

    const res = await app.inject({
      method: 'POST',
      url: '/v1/auth/refresh',
      payload: { refreshToken: 'inexistente-token-string-40-chars-long-abcd' },
    })

    expect(res.statusCode).toBe(401)
  })
})

describe('GET /auth/me', () => {
  let app: Awaited<ReturnType<typeof buildTestApp>>['app']
  let prisma: Awaited<ReturnType<typeof buildTestApp>>['prisma']

  beforeEach(async () => {
    const built = await buildTestApp()
    app = built.app
    prisma = built.prisma
    await app.register(authRoutes, { prefix: '/v1/auth' })
    await app.ready()
  })

  afterEach(async () => { await app.close() })

  it('devolve perfil do utilizador autenticado', async () => {
    const token = signToken(app, {
      id: mockUser.id, email: mockUser.email, role: mockUser.role,
    })
    prisma.user.findUnique.mockResolvedValue({
      id:           mockUser.id,
      name:         mockUser.name,
      email:        mockUser.email,
      role:         mockUser.role,
      resortId:     null,
      twoFaEnabled: false,
      createdAt:    mockUser.createdAt,
    })

    const res = await app.inject({
      method: 'GET',
      url:    '/v1/auth/me',
      headers: authHeader(token),
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().data.email).toBe(mockUser.email)
  })

  it('retorna 401 sem token', async () => {
    const res = await app.inject({
      method: 'GET',
      url:    '/v1/auth/me',
    })

    expect(res.statusCode).toBe(401)
  })

  it('retorna 401 com token inválido', async () => {
    const res = await app.inject({
      method:  'GET',
      url:     '/v1/auth/me',
      headers: authHeader('token.invalido.assinatura'),
    })

    expect(res.statusCode).toBe(401)
  })
})

describe('POST /auth/logout', () => {
  let app: Awaited<ReturnType<typeof buildTestApp>>['app']
  let prisma: Awaited<ReturnType<typeof buildTestApp>>['prisma']

  beforeEach(async () => {
    const built = await buildTestApp()
    app = built.app
    prisma = built.prisma
    await app.register(authRoutes, { prefix: '/v1/auth' })
    await app.ready()
  })

  afterEach(async () => { await app.close() })

  it('revoga o refresh token com sucesso', async () => {
    prisma.refreshToken.updateMany.mockResolvedValue({ count: 1 })

    const res = await app.inject({
      method:  'POST',
      url:     '/v1/auth/logout',
      payload: { refreshToken: 'token-to-revoke-40-chars-long-abcdefghijk' },
    })

    expect(res.statusCode).toBe(200)
    expect(prisma.refreshToken.updateMany).toHaveBeenCalledOnce()
  })
})
