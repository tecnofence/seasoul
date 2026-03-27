import api from './api'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: string
  resortId?: string | null
}

export async function login(email: string, password: string) {
  const { data } = await api.post('/auth/login', { email, password })
  localStorage.setItem('token', data.data.token)
  document.cookie = 'token=' + data.data.token + '; path=/; samesite=strict'
  if (data.data.refreshToken) {
    localStorage.setItem('refreshToken', data.data.refreshToken)
  }
  return data.data.user as AuthUser
}

export async function getMe(): Promise<AuthUser> {
  const { data } = await api.get('/auth/me')
  return data.data
}

export function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('refreshToken')
  document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
  window.location.href = '/login'
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token')
}
