import fp from 'fastify-plugin'
import { PrismaClient } from '@prisma/client'
import type { FastifyInstance } from 'fastify'

async function prismaPlugin(app: FastifyInstance) {
  const prisma = new PrismaClient({
    log: app.log.level === 'debug' ? ['query', 'warn', 'error'] : ['warn', 'error'],
  })

  try {
    await prisma.$connect()
    app.log.info('PostgreSQL conectado via Prisma')
  } catch (err) {
    app.log.error('Erro ao conectar à base de dados. O servidor continuará em modo isolado (MOCK).')
  }

  app.decorate('prisma', prisma)

  app.addHook('onClose', async () => {
    await prisma.$disconnect()
  })
}

export default fp(prismaPlugin, { name: 'prisma' })
