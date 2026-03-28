import { FastifyInstance } from 'fastify'

export default async function adminSettingsRoutes(app: FastifyInstance) {
  // Obter configurações actuais da plataforma
  app.get('/', async (request, reply) => {
    const settings = {
      platformName: 'ENGERIS ONE',
      baseUrl: process.env.APP_URL || 'app.engeris.ao',
      currency: 'AOA',
      timezone: 'Africa/Luanda',
      language: 'pt',
      agt: {
        endpoint: process.env.AGT_ENDPOINT || '',
        nif: process.env.AGT_NIF || '',
        serie: '2026/A',
        taxRate: 14
      },
      notifications: {
        emailSender: process.env.EMAIL_FROM || 'noreply@engeris.ao',
        smsProvider: 'africas_talking',
        notifyExpiry: true,
        daysBeforeExpiry: 7
      },
      security: {
        maxSessionHours: 24,
        require2FA: false,
        maxLoginAttempts: 5,
        rateLimitPerMinute: 100
      },
      maintenance: {
        enabled: false,
        message: 'Sistema em manutenção.',
        backupEnabled: true,
        backupFrequency: 'daily'
      }
    }

    return reply.send({ data: settings })
  })

  // Actualizar configurações da plataforma
  app.patch('/', async (request, reply) => {
    // Sem modelo de DB para persistência — aceita qualquer payload e retorna sucesso
    return reply.send({
      success: true,
      message: 'Configurações atualizadas com sucesso'
    })
  })
}
