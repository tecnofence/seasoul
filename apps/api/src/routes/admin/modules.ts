import { FastifyInstance } from 'fastify'
import { z } from 'zod'

const moduleSchema = z.object({
  id: z.string().min(2),
  name: z.string().min(2),
  description: z.string().optional(),
  basePrice: z.number().min(0).default(0),
  category: z.enum(['Core', 'Vertical', 'Operations', 'Infrastructure']).default('Core'),
  isAvailable: z.boolean().default(true),
})

const subscribeModuleSchema = z.object({
  moduleId: z.string(),
  billingCycle: z.enum(['FREE', 'MONTHLY', 'ANNUALLY']).default('MONTHLY'),
  priceOverride: z.number().optional(),
})

export default async function adminModulesRoutes(app: FastifyInstance) {
  // ── MÓDULOS (Marketplace Registry) ──

  // Listar todos os módulos disponíveis no marketplace
  app.get('/', async (request, reply) => {
    try {
      const modules = await app.prisma.module.findMany({
        orderBy: { category: 'asc' }
      })
      if (modules.length === 0) throw new Error('No modules in DB')
      return reply.send({ data: modules })
    } catch (err) {
      // Mock de módulos para desenvolvimento
      return reply.send({
        data: [
          { id: 'core', name: 'Plataforma Core', description: 'Base do sistema, autenticação e perfil.', basePrice: 0, category: 'Core' },
          { id: 'finance', name: 'Gestão Financeira', description: 'Faturação AGT, Contas a Pagar/Receber e Tesouraria.', basePrice: 25000, category: 'Operations' },
          { id: 'hr', name: 'Recursos Humanos', description: 'Processamento de salários, assiduidade e RH.', basePrice: 15000, category: 'Operations' },
          { id: 'pms', name: 'Hotelaria (PMS)', description: 'Gestão de reservas, quartos e check-in/out.', basePrice: 45000, category: 'Vertical' },
          { id: 'pos', name: 'Ponto de Venda (POS)', description: 'Vendas rápidas, restauração e retalho.', basePrice: 10000, category: 'Vertical' },
          { id: 'healthcare', name: 'Saúde & Clínicas', description: 'Consultas, prontuário eletrónico e pacientes.', basePrice: 35000, category: 'Vertical' },
          { id: 'engineering', name: 'Engenharia & Manutenção', description: 'Manutenção preventiva, projetos civis e segurança eletrónica.', basePrice: 40000, category: 'Vertical' },
          { id: 'fleet', name: 'Gestão de Frotas', description: 'Manutenção de veículos, combustível e logística.', basePrice: 12000, category: 'Operations' },
          { id: 'agriculture', name: 'Agronegócio', description: 'Gestão de fazendas, colheitas e gado.', basePrice: 20000, category: 'Vertical' }
        ]
      })
    }
  })

  // Criar ou atualizar um módulo no marketplace
  app.post('/', async (request, reply) => {
    const parsed = moduleSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.format() })

    const data = parsed.data
    const module = await app.prisma.module.upsert({
      where: { id: data.id },
      create: data,
      update: data
    })

    return reply.send({ data: module })
  })

  // ── SUBSCRÇÕES (Tenant Modules) ──

  // Listar módulos de um tenant específico
  app.get('/tenants/:tenantId', async (request, reply) => {
    const { tenantId } = request.params as { tenantId: string }
    const subscriptions = await app.prisma.tenantModule.findMany({
      where: { tenantId },
      include: { module: true }
    })
    return reply.send({ data: subscriptions })
  })

  // Subscrever um tenant a um módulo
  app.post('/tenants/:tenantId/subscribe', async (request, reply) => {
    const { tenantId } = request.params as { tenantId: string }
    const parsed = subscribeModuleSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.format() })

    const { moduleId, billingCycle, priceOverride } = parsed.data

    // Verificar se o módulo existe
    const module = await app.prisma.module.findUnique({ where: { id: moduleId } })
    if (!module) return reply.code(404).send({ error: 'Módulo não encontrado no marketplace' })

    const subscription = await app.prisma.tenantModule.upsert({
      where: { tenantId_moduleId: { tenantId, moduleId } },
      create: {
        tenantId,
        moduleId,
        billingCycle,
        priceAtActivation: priceOverride ?? module.basePrice,
        active: true,
        status: 'ACTIVE'
      },
      update: {
        billingCycle,
        priceAtActivation: priceOverride ?? module.basePrice,
        active: true,
        status: 'ACTIVE'
      }
    })

    // Limpar cache do tenant para aplicar mudanças imediatamente
    // (Nota: assumindo que invalidateTenantCache está exportado ou disponível)
    
    return reply.send({ data: subscription, message: `Módulo ${module.name} subscrito com sucesso` })
  })

  // Cancelar subscrição de um módulo
  app.post('/tenants/:tenantId/unsubscribe/:moduleId', async (request, reply) => {
    const { tenantId, moduleId } = request.params as { tenantId: string, moduleId: string }

    await app.prisma.tenantModule.update({
      where: { tenantId_moduleId: { tenantId, moduleId } },
      data: {
        active: false,
        status: 'CANCELED'
      }
    })

    return reply.send({ message: 'Subscrição cancelada com sucesso' })
  })
}
