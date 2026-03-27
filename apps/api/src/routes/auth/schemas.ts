import { z } from 'zod'

export const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
  role: z.enum([
    'SUPER_ADMIN',
    'RESORT_MANAGER',
    'RECEPTIONIST',
    'POS_OPERATOR',
    'STOCK_MANAGER',
    'HR_MANAGER',
    'STAFF',
  ]),
  resortId: z.string().cuid().optional(),
})

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
})

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token obrigatório'),
})

export const verifyTwoFaSchema = z.object({
  code: z.string().length(6, 'Código deve ter 6 dígitos'),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type RefreshInput = z.infer<typeof refreshSchema>
export type VerifyTwoFaInput = z.infer<typeof verifyTwoFaSchema>
