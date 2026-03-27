import { z } from 'zod'

export const registerGuestSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  phone: z.string().min(9, 'Telefone inválido'),
  email: z.string().email('Email inválido').optional(),
  countryCode: z.string().optional(),
  language: z.enum(['pt', 'en', 'fr', 'es']).default('pt'),
})

export const updateGuestSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().nullable().optional(),
  countryCode: z.string().nullable().optional(),
  language: z.enum(['pt', 'en', 'fr', 'es']).optional(),
  deviceToken: z.string().nullable().optional(),
})

export const guestLoginSchema = z.object({
  phone: z.string().min(9, 'Telefone inválido'),
})

export type RegisterGuestInput = z.infer<typeof registerGuestSchema>
export type UpdateGuestInput = z.infer<typeof updateGuestSchema>
export type GuestLoginInput = z.infer<typeof guestLoginSchema>
