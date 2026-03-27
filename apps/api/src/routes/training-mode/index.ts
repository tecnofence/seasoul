import { FastifyInstance } from 'fastify'

// ── MODO FORMAÇÃO ───────────────────────────────
// Permite ativar/desativar modo formação no tenant
// Quando ativo: faturas usam série TREINO, dados isolados

export default async function trainingModeRoutes(app: FastifyInstance) {
  // Obter estado do modo formação
  app.get('/', { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }

    if (!user.tenantId) {
      return reply.status(400).send({ error: 'Utilizador sem tenant associado' })
    }

    const tenant = await app.prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: { id: true, name: true, trainingMode: true },
    })

    if (!tenant) {
      return reply.status(404).send({ error: 'Tenant não encontrado' })
    }

    // Contar documentos de formação
    const trainingInvoices = await app.prisma.invoice.count({
      where: { tenantId: user.tenantId, isTraining: true },
    })

    return reply.send({
      data: {
        enabled: tenant.trainingMode,
        tenantName: tenant.name,
        trainingDocuments: trainingInvoices,
        banner: tenant.trainingMode
          ? { color: '#F59E0B', text: 'MODO FORMAÇÃO — Dados fictícios, sem valor fiscal' }
          : null,
      },
    })
  })

  // Ativar modo formação
  app.post('/activate', { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }

    if (!['SUPER_ADMIN', 'RESORT_MANAGER'].includes(user.role)) {
      return reply.status(403).send({ error: 'Sem permissão — apenas admin pode ativar modo formação' })
    }

    if (!user.tenantId) {
      return reply.status(400).send({ error: 'Utilizador sem tenant associado' })
    }

    // Verificar se já está ativo
    const existing = await app.prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: { trainingMode: true },
    })

    if (existing?.trainingMode) {
      return reply.send({ message: 'Modo formação já está ativo' })
    }

    // Ativar modo formação no tenant
    const tenant = await app.prisma.tenant.update({
      where: { id: user.tenantId },
      data: { trainingMode: true },
    })

    // Criar séries de formação se não existirem (transação atómica)
    const docTypes = ['FT', 'FR', 'NC', 'ORC', 'PF', 'RC'] as const
    await app.prisma.$transaction(
      docTypes.map((dt) =>
        app.prisma.invoiceSeries.upsert({
          where: {
            tenantId_documentType_series: {
              tenantId: user.tenantId!,
              documentType: dt,
              series: 'TREINO',
            },
          },
          create: {
            tenantId: user.tenantId!,
            documentType: dt,
            series: 'TREINO',
            prefix: `${dt}-TREINO`,
            isTraining: true,
          },
          update: { active: true },
        })
      )
    )

    // Registar na auditoria
    await app.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'TRAINING_MODE_ACTIVATED',
        entity: 'Tenant',
        entityId: tenant.id,
        after: { trainingMode: true },
      },
    })

    return reply.send({
      data: { enabled: true, message: 'Modo formação ativado com sucesso' },
    })
  })

  // Desativar modo formação
  app.post('/deactivate', { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }

    if (!['SUPER_ADMIN', 'RESORT_MANAGER'].includes(user.role)) {
      return reply.status(403).send({ error: 'Sem permissão' })
    }

    if (!user.tenantId) {
      return reply.status(400).send({ error: 'Utilizador sem tenant associado' })
    }

    const tenant = await app.prisma.tenant.update({
      where: { id: user.tenantId },
      data: { trainingMode: false },
    })

    await app.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'TRAINING_MODE_DEACTIVATED',
        entity: 'Tenant',
        entityId: tenant.id,
        after: { trainingMode: false },
      },
    })

    return reply.send({
      data: { enabled: false, message: 'Modo formação desativado' },
    })
  })

  // Limpar TODOS os dados de formação
  app.delete('/purge', { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }

    if (user.role !== 'SUPER_ADMIN') {
      return reply.status(403).send({ error: 'Apenas SUPER_ADMIN pode limpar dados de formação' })
    }

    if (!user.tenantId) {
      return reply.status(400).send({ error: 'Utilizador sem tenant associado' })
    }

    // Apagar dados de formação numa transação atómica
    const [, deleted] = await app.prisma.$transaction([
      // Apagar items primeiro (cascade)
      app.prisma.invoiceItem.deleteMany({
        where: { invoice: { tenantId: user.tenantId, isTraining: true } },
      }),

      // Apagar faturas de formação
      app.prisma.invoice.deleteMany({
        where: { tenantId: user.tenantId, isTraining: true },
      }),

      // Resetar contadores das séries de formação
      app.prisma.invoiceSeries.updateMany({
        where: { tenantId: user.tenantId, isTraining: true },
        data: { lastNumber: 0 },
      }),
    ])

    await app.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'TRAINING_DATA_PURGED',
        entity: 'Invoice',
        after: { deletedCount: deleted.count },
      },
    })

    return reply.send({
      data: {
        purged: deleted.count,
        message: `${deleted.count} documentos de formação eliminados`,
      },
    })
  })
}
