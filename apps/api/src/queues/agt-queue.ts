import { Queue, Worker, Job } from 'bullmq'
import IORedis from 'ioredis'

const redisConnection = new IORedis({
  host: process.env.REDIS_HOST ?? 'localhost',
  port: parseInt(process.env.REDIS_PORT ?? '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null, // obrigatório para BullMQ
})

// ── Fila de submissão AGT ─────────────────────────────────────────────────────

export const agtQueue = new Queue('agt-invoices', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 30_000, // 30s, 60s, 120s, 240s, 480s
    },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
})

export interface AgtJobData {
  invoiceId: string
  tenantId: string
  resortId: string
  payload: {
    nif: string
    serie: string
    numero: number
    tipo: string
    dataEmissao: string
    nifCliente?: string
    nomeCliente: string
    totalSemIva: number
    totalIva: number
    totalGeral: number
    hash: string
    assinatura: string
    linhas: Array<{
      descricao: string
      quantidade: number
      precoUnitario: number
      taxaIva: number
      totalLinha: number
    }>
  }
}

/**
 * Adiciona uma fatura à fila de submissão AGT
 */
export async function enqueueAgtInvoice(data: AgtJobData): Promise<string> {
  const job = await agtQueue.add('submit-invoice', data, {
    jobId: `agt-${data.invoiceId}`, // evitar duplicados
  })
  return job.id!
}

/**
 * Inicia o worker que processa a fila AGT
 * Deve ser chamado no arranque do servidor
 */
export function startAgtWorker(
  onProcess: (data: AgtJobData) => Promise<{ codigoAgt: string; qrCode: string }>
): Worker {
  const worker = new Worker(
    'agt-invoices',
    async (job: Job<AgtJobData>) => {
      const result = await onProcess(job.data)
      return result
    },
    {
      connection: redisConnection,
      concurrency: 3,
    }
  )

  worker.on('completed', (job) => {
    console.log(`[AGT Queue] Fatura ${job.data.invoiceId} submetida com sucesso`)
  })

  worker.on('failed', (job, err) => {
    console.error(`[AGT Queue] Falha ao submeter fatura ${job?.data.invoiceId}:`, err.message)
  })

  return worker
}
