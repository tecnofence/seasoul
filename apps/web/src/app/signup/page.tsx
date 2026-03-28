'use client'

import { useState } from 'react'
import Link from 'next/link'
import api from '@/lib/api'

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function SignupPage() {
  const [form, setForm] = useState({
    resortType: '',
    tenantName: '',
    slug: '',
    nif: '',
    adminName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    terms: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setForm((prev) => {
      const updated = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }
      // Auto-generate slug from resort name
      if (name === 'tenantName') {
        updated.slug = slugify(value)
      }
      return updated
    })

    // Clear field error on change
    setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {}

    if (!form.tenantName.trim()) newErrors.tenantName = 'Nome do resort obrigatório'
    if (!form.slug.trim()) newErrors.slug = 'Slug obrigatório'
    if (!/^[a-z0-9-]+$/.test(form.slug))
      newErrors.slug = 'Apenas letras minúsculas, números e hífens'
    if (!form.adminName.trim()) newErrors.adminName = 'O seu nome é obrigatório'
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      newErrors.email = 'Email inválido'
    if (form.password.length < 8)
      newErrors.password = 'A palavra-passe deve ter pelo menos 8 caracteres'
    if (form.password !== form.confirmPassword)
      newErrors.confirmPassword = 'As palavras-passe não coincidem'
    if (!form.terms)
      newErrors.terms = 'Deve aceitar os termos de serviço'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      await api.post('/auth/signup-tenant', {
        tenantName: form.tenantName,
        slug: form.slug,
        nif: form.nif || undefined,
        adminName: form.adminName,
        email: form.email,
        phone: form.phone || undefined,
        password: form.password,
      })
      setSuccess(true)
    } catch (err: any) {
      const message =
        err?.response?.data?.error || 'Erro ao criar conta. Tente novamente.'
      setErrors({ submit: message })
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-lg rounded-2xl bg-white p-10 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Conta criada!</h2>
          <p className="mt-3 text-gray-500">
            Verifique o seu email para confirmar a conta e começar o período de
            experiência de 14 dias.
          </p>
          <Link
            href="/dashboard"
            className="mt-8 inline-block rounded-md bg-[#1A3E6E] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#1A3E6E]/90"
          >
            Ir para o Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="mx-auto w-full max-w-lg">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/">
            <span className="text-2xl font-bold text-[#1A3E6E]">ENGERIS ONE</span>
          </Link>
          <p className="mt-1 text-sm text-gray-500">Criar conta de resort</p>
        </div>

        {/* Trial banner */}
        <div className="mb-6 rounded-xl bg-[#1A3E6E]/10 px-5 py-4">
          <p className="text-center text-sm font-medium text-[#1A3E6E]">
            14 dias de experiência gratuita. Sem cartão de crédito.
          </p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100">
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Tipo de Resort */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Tipo de Resort
              </label>
              <select
                name="resortType"
                value={form.resortType}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-[#1A3E6E] focus:outline-none focus:ring-2 focus:ring-[#1A3E6E]/20"
              >
                <option value="">Selecionar tipo...</option>
                <option value="hotel">Hotel</option>
                <option value="resort-de-praia">Resort de Praia</option>
                <option value="hotel-boutique">Hotel Boutique</option>
                <option value="pousada">Pousada</option>
                <option value="outro">Outro</option>
              </select>
            </div>

            {/* Nome do Resort */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Nome do Resort <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="tenantName"
                value={form.tenantName}
                onChange={handleChange}
                placeholder="Ex: Sea and Soul Resort"
                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-[#1A3E6E] focus:outline-none focus:ring-2 focus:ring-[#1A3E6E]/20"
              />
              {errors.tenantName && (
                <p className="mt-1 text-xs text-red-600">{errors.tenantName}</p>
              )}
            </div>

            {/* Slug */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Slug (URL) <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center rounded-md border border-gray-300 focus-within:border-[#1A3E6E] focus-within:ring-2 focus-within:ring-[#1A3E6E]/20">
                <span className="select-none rounded-l-md border-r border-gray-300 bg-gray-50 px-3 py-2.5 text-xs text-gray-400">
                  app.seasoul.ao/
                </span>
                <input
                  type="text"
                  name="slug"
                  value={form.slug}
                  onChange={handleChange}
                  placeholder="sea-and-soul"
                  className="flex-1 rounded-r-md bg-white px-3 py-2.5 text-sm focus:outline-none"
                />
              </div>
              {errors.slug && (
                <p className="mt-1 text-xs text-red-600">{errors.slug}</p>
              )}
            </div>

            {/* NIF */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                NIF (opcional)
              </label>
              <input
                type="text"
                name="nif"
                value={form.nif}
                onChange={handleChange}
                placeholder="Ex: 5417012345"
                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-[#1A3E6E] focus:outline-none focus:ring-2 focus:ring-[#1A3E6E]/20"
              />
            </div>

            <hr className="border-gray-100" />

            {/* Seu Nome */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Seu Nome <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="adminName"
                value={form.adminName}
                onChange={handleChange}
                placeholder="Ex: João Silva"
                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-[#1A3E6E] focus:outline-none focus:ring-2 focus:ring-[#1A3E6E]/20"
              />
              {errors.adminName && (
                <p className="mt-1 text-xs text-red-600">{errors.adminName}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="joao@resort.ao"
                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-[#1A3E6E] focus:outline-none focus:ring-2 focus:ring-[#1A3E6E]/20"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Telefone */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Telefone (opcional)
              </label>
              <input
                type="text"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+244 9XX XXX XXX"
                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-[#1A3E6E] focus:outline-none focus:ring-2 focus:ring-[#1A3E6E]/20"
              />
            </div>

            {/* Palavra-passe */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Palavra-passe <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Mínimo 8 caracteres"
                  className="w-full rounded-md border border-gray-300 px-3 py-2.5 pr-10 text-sm focus:border-[#1A3E6E] focus:outline-none focus:ring-2 focus:ring-[#1A3E6E]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Confirmar Palavra-passe */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Confirmar Palavra-passe <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repetir palavra-passe"
                  className="w-full rounded-md border border-gray-300 px-3 py-2.5 pr-10 text-sm focus:border-[#1A3E6E] focus:outline-none focus:ring-2 focus:ring-[#1A3E6E]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showConfirm ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showConfirm ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Termos */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                name="terms"
                id="terms"
                checked={form.terms}
                onChange={handleChange}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#1A3E6E] focus:ring-[#1A3E6E]/20"
              />
              <label htmlFor="terms" className="text-sm text-gray-600">
                Li e aceito os{' '}
                <Link href="/termos" className="text-[#1A3E6E] hover:underline">
                  Termos de Serviço
                </Link>{' '}
                e a{' '}
                <Link href="/privacidade" className="text-[#1A3E6E] hover:underline">
                  Política de Privacidade
                </Link>
              </label>
            </div>
            {errors.terms && (
              <p className="-mt-3 text-xs text-red-600">{errors.terms}</p>
            )}

            {/* Submit error */}
            {errors.submit && (
              <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
                {errors.submit}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-[#1A3E6E] py-3 text-sm font-semibold text-white transition hover:bg-[#1A3E6E]/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'A criar conta...' : 'Criar Conta Gratuita'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          Já tem conta?{' '}
          <Link href="/login" className="font-medium text-[#1A3E6E] hover:underline">
            Entrar →
          </Link>
        </p>
      </div>
    </div>
  )
}
