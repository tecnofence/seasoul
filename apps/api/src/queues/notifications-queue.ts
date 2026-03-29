import { Queue, Worker, Job } from 'bullmq'
import IORedis from 'ioredis'

const redisConnection = new IORedis({
  host: process.env.REDIS_HOST ?? 'localhost',
  port: parseInt(process.env.REDIS_PORT ?? '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
})

export const notificationsQueue = new Queue('notifications', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'fixed', delay: 10_000 },
    removeOnComplete: { count: 200 },
    removeOnFail: { count: 100 },
  },
})

export interface NotificationJobData {
  notificationId: string
  channel: 'SMS' | 'EMAIL' | 'PUSH'
  recipient: string // phone, email, or push token
  title: string
  body: string
  data?: Record<string, unknown>
}

export async function enqueueNotification(data: NotificationJobData): Promise<string> {
  const job = await notificationsQueue.add('send-notification', data, {
    jobId: `notif-${data.notificationId}-${data.channel}`,
  })
  return job.id!
}

export function startNotificationsWorker(
  onProcess: (data: NotificationJobData) => Promise<void>
): Worker {
  const worker = new Worker(
    'notifications',
    async (job: Job<NotificationJobData>) => {
      await onProcess(job.data)
    },
    {
      connection: redisConnection,
      concurrency: 10,
    }
  )

  worker.on('completed', (job) => {
    console.log(`[Notifications Queue] ${job.data.channel} sent to ${job.data.recipient}`)
  })

  worker.on('failed', (job, err) => {
    console.error(`[Notifications Queue] Failed ${job?.data.channel}:`, err.message)
  })

  return worker
}
