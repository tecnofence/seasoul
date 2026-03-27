import { z } from 'zod'

export const createRoomSchema = z.object({
  resortId: z.string().cuid(),
  number: z.string().min(1, 'Número do quarto obrigatório'),
  type: z.enum(['STANDARD', 'SUPERIOR', 'SUITE', 'VILLA']),
  floor: z.number().int(),
  capacity: z.number().int().positive(),
  pricePerNight: z.number().positive('Preço deve ser positivo'),
  seamDeviceId: z.string().optional(),
  description: z.string().optional(),
  amenities: z.array(z.string()).default([]),
})

export const updateRoomSchema = z.object({
  number: z.string().min(1).optional(),
  type: z.enum(['STANDARD', 'SUPERIOR', 'SUITE', 'VILLA']).optional(),
  floor: z.number().int().optional(),
  capacity: z.number().int().positive().optional(),
  pricePerNight: z.number().positive().optional(),
  seamDeviceId: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  amenities: z.array(z.string()).optional(),
})

export const updateRoomStatusSchema = z.object({
  status: z.enum(['AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'CLEANING']),
})

export const listRoomsQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  resortId: z.string().optional(),
  type: z.string().optional(),
  status: z.string().optional(),
  floor: z.coerce.number().int().optional(),
})

export type CreateRoomInput = z.infer<typeof createRoomSchema>
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>
export type ListRoomsQuery = z.infer<typeof listRoomsQuery>
