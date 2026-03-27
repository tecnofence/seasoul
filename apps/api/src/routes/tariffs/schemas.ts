import { z } from 'zod'

export const createTariffSchema = z.object({
  resortId: z.string().cuid(),
  name: z.string().min(2, 'Nome da tarifa obrigatório'),
  roomType: z.enum(['STANDARD', 'SUPERIOR', 'SUITE', 'VILLA']),
  pricePerNight: z.number().positive('Preço deve ser positivo'),
  validFrom: z.string().datetime({ message: 'Data inválida (ISO 8601)' }),
  validUntil: z.string().datetime({ message: 'Data inválida (ISO 8601)' }),
  minNights: z.number().int().positive().default(1),
  active: z.boolean().default(true),
})

export const updateTariffSchema = z.object({
  name: z.string().min(2).optional(),
  roomType: z.enum(['STANDARD', 'SUPERIOR', 'SUITE', 'VILLA']).optional(),
  pricePerNight: z.number().positive().optional(),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
  minNights: z.number().int().positive().optional(),
  active: z.boolean().optional(),
})

export const listTariffsQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  resortId: z.string().optional(),
  roomType: z.string().optional(),
  active: z.coerce.boolean().optional(),
})

export type CreateTariffInput = z.infer<typeof createTariffSchema>
export type UpdateTariffInput = z.infer<typeof updateTariffSchema>
export type ListTariffsQuery = z.infer<typeof listTariffsQuery>
