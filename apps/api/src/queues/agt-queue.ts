import { Queue, Worker, Job } from 'bullmq'
import IORedis from 'ioredis'
import type { AgtInvoicePayload } from '../utils/agt-submit.js'

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

// Fila separada para polling assíncrono do estado AGT
export const agtPollQueue = new Queue('agt-poll', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 10,
    backoff: { type: 'fixed', delay: 5_000 }, // 5s entre tentativas de polling
    removeOnComplete: { count: 50 },
    removeOnFail: { count: 50 },
  },
})

export interface AgtJobData {
  invoiceId: string
  payload: AgtInvoicePayload
  requestId?: string   // Devolvido pela AGT no caso de processamento assíncrono
}

export interface AgtPollJobData {
  invoiceId: string
  requestId: string
}

/**
 * Adiciona uma fatura à fila de submissão/polling AGT
 * Se requestId já existe: vai directamente para polling
 * Se não: submete primeiro, depois faz polling
 */
export async function enqueueAgtInvoice(data: AgtJobData): Promise<string> {
  if (data.requestId) {
    // Já temos requestId — enfileirar directamente para polling
    const job = await agtPollQueue.add('poll-status', {
      invoiceId: data.invoiceId,
      requestId: data.requestId,
    } satisfies AgtPollJobData, {
      jobId: `agt-poll-${data.invoiceId}`,
    })
    return job.id!
  }

  const job = await agtQueue.add('submit-invoice', data, {
    jobId: `agt-${data.invoiceId}`, // evitar duplicados
  })
  return job.id!
}

/**
 * Inicia o worker que processa a fila de submissão AGT
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

/**
 * Inicia o worker de polling do estado assíncrono AGT
 */
export function startAgtPollWorker(
  onPoll: (data: AgtPollJobData) => Promise<{ status: string; codigoAgt?: string; qrCode?: string }>
): Worker {
  const worker = new Worker(
    'agt-poll',
    async (job: Job<AgtPollJobData>) => {
      const result = await onPoll(job.data)
      // Se ainda pendente, relançar erro para retry
      if (result.status === 'PENDENTE' || result.status === 'PROCESSANDO') {
        throw new Error(`Estado AGT ainda pendente: ${result.status}`)
      }
      return result
    },
    {
      connection: redisConnection,
      concurrency: 5,
    }
  )

  worker.on('completed', (job) => {
    console.log(`[AGT Poll] Fatura ${job.data.invoiceId} validada com sucesso`)
  })

  worker.on('failed', (job, err) => {
    console.error(`[AGT Poll] Falha no polling para fatura ${job?.data.invoiceId}:`, err.message)
  })

  return worker
}
