'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { ArrowLeft, ArrowRight, Check, Building2, LayoutGrid, Package, UserPlus, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

type Plan = 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE' | 'CUSTOM'

interface Step1Data {
  name: string
  slug: string
  nif: string
  contactEmail: string
}

interface Step2Data {
  plan: Plan
  maxUsers: number
  maxBranches: number
  expiresAt: string
}

interface Step3Data {
  modules: string[]
}

interface Step4Data {
  name: string
  email: string
  password: string
  skip: boolean
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PLAN_CONFIG: Record<Plan, { label: string; price: string; description: string; defaultUsers: number; defaultBranches: number }> = {
  STARTER: {
    label: 'Starter',
    price: '50.000 Kz/mês',
    description: 'Até 5 utilizadores, 1 filial',
    defaultUsers: 5,
    defaultBranches: 1,
  },
  PROFESSIONAL: {
    label: 'Professional',
    price: '150.000 Kz/mês',
    description: 'Até 20 utilizadores, 3 filiais',
    defaultUsers: 20,
    defaultBranches: 3,
  },
  ENTERPRISE: {
    label: 'Enterprise',
    price: '500.000 Kz/mês',
    description: 'Até 100 utilizadores, ilimitadas filiais',
    defaultUsers: 100,
    defaultBranches: 999,
  },
  CUSTOM: {
    label: 'Custom',
    price: 'Preço personalizado',
    description: 'Limites personalizados',
    defaultUsers: 10,
    defaultBranches: 2,
  },
}

const ALL_MODULES = [
  { id: 'pms', label: 'Hospitalidade (PMS)', icon: '🏨' },
  { id: 'pos', label: 'Ponto de Venda (POS)', icon: '🧾' },
  { id: 'finance', label: 'Financeiro & Faturação', icon: '💰' },
  { id: 'hr', label: 'Recursos Humanos', icon: '👥' },
  { id: 'stock', label: 'Stock & Inventário', icon: '📦' },
  { id: 'maintenance', label: 'Manutenção', icon: '🔧' },
  { id: 'locks', label: 'Fechaduras Smart', icon: '🔐' },
  { id: 'security', label: 'Segurança & Auditoria', icon: '🛡️' },
  { id: 'retail', label: 'Retalho', icon: '🛍️' },
  { id: 'spa', label: 'Spa & Bem-estar', icon: '💆' },
  { id: 'activities', label: 'Atividades & Tours', icon: '🏄' },
  { id: 'events', label: 'Eventos & Conferências', icon: '🎪' },
]

const STEPS = [
  { number: 1, label: 'Empresa', icon: Building2 },
  { number: 2, label: 'Plano & Limites', icon: LayoutGrid },
  { number: 3, label: 'Módulos', icon: Package },
  { number: 4, label: 'Admin', icon: UserPlus },
]

// ─── Utility ──────────────────────────────────────────────────────────────────

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepProgress({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((step, idx) => {
        const Icon = step.icon
        const isCompleted = current > step.number
        const isActive = current === step.number

        return (
          <React.Fragment key={step.number}>
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all',
                  isCompleted
                    ? 'border-primary bg-primary text-white'
                    : isActive
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-gray-200 bg-white text-gray-400',
                )}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>
              <span
                className={cn(
                  'hidden text-xs font-medium sm:block',
                  isActive ? 'text-primary' : isCompleted ? 'text-gray-700' : 'text-gray-400',
                )}
              >
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={cn(
                  'mb-4 h-0.5 flex-1 mx-2 transition-all',
                  current > step.number ? 'bg-primary' : 'bg-gray-200',
                )}
              />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

// ─── Step 1 ────────────────────────────────────────────────────────────────────

function Step1({ data, onChange }: { data: Step1Data; onChange: (d: Step1Data) => void }) {
  const handleNameChange = (name: string) => {
    onChange({
      ...data,
      name,
      slug: generateSlug(name),
    })
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Informação da Empresa</h2>
        <p className="mt-1 text-sm text-gray-500">Dados básicos de identificação do tenant.</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Nome da Empresa <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Ex: Palmeira Hotel & Resort"
            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Slug (URL)</label>
          <div className="flex items-center overflow-hidden rounded-lg border border-gray-200 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
            <span className="shrink-0 border-r border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-400">
              engeris.ao/
            </span>
            <input
              type="text"
              value={data.slug}
              onChange={(e) => onChange({ ...data, slug: generateSlug(e.target.value) })}
              placeholder="palmeira-hotel"
              className="flex-1 bg-white px-3 py-2.5 text-sm focus:outline-none"
            />
          </div>
          <p className="mt-1 text-xs text-gray-400">Gerado automaticamente. Apenas letras minúsculas, números e hifens.</p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">NIF</label>
          <input
            type="text"
            value={data.nif}
            onChange={(e) => onChange({ ...data, nif: e.target.value })}
            placeholder="Ex: 5000123456"
            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Email de Contacto</label>
          <input
            type="email"
            value={data.contactEmail}
            onChange={(e) => onChange({ ...data, contactEmail: e.target.value })}
            placeholder="geral@palmeira.ao"
            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>
    </div>
  )
}

// ─── Step 2 ────────────────────────────────────────────────────────────────────

function Step2({ data, onChange }: { data: Step2Data; onChange: (d: Step2Data) => void }) {
  const selectPlan = (plan: Plan) => {
    const cfg = PLAN_CONFIG[plan]
    onChange({
      ...data,
      plan,
      maxUsers: cfg.defaultUsers,
      maxBranches: cfg.defaultBranches,
    })
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Plano & Limites</h2>
        <p className="mt-1 text-sm text-gray-500">Escolha o plano de subscrição e defina os limites operacionais.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {(Object.keys(PLAN_CONFIG) as Plan[]).map((plan) => {
          const cfg = PLAN_CONFIG[plan]
          const isSelected = data.plan === plan
          return (
            <button
              key={plan}
              type="button"
              onClick={() => selectPlan(plan)}
              className={cn(
                'relative flex flex-col items-start rounded-xl border-2 p-4 text-left transition-all hover:border-primary/50',
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 bg-white',
              )}
            >
              {isSelected && (
                <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
              <span className={cn('text-sm font-bold', isSelected ? 'text-primary' : 'text-gray-900')}>
                {cfg.label}
              </span>
              <span className={cn('mt-1 text-base font-extrabold', isSelected ? 'text-primary' : 'text-gray-800')}>
                {cfg.price}
              </span>
              <span className="mt-0.5 text-xs text-gray-500">{cfg.description}</span>
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Máx. Utilizadores</label>
          <input
            type="number"
            min={1}
            value={data.maxUsers}
            onChange={(e) => onChange({ ...data, maxUsers: parseInt(e.target.value) || 1 })}
            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Máx. Filiais</label>
          <input
            type="number"
            min={1}
            value={data.maxBranches}
            onChange={(e) => onChange({ ...data, maxBranches: parseInt(e.target.value) || 1 })}
            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Data de Expiração (opcional)</label>
          <input
            type="date"
            value={data.expiresAt}
            onChange={(e) => onChange({ ...data, expiresAt: e.target.value })}
            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>
    </div>
  )
}

// ─── Step 3 ────────────────────────────────────────────────────────────────────

function Step3({ data, onChange }: { data: Step3Data; onChange: (d: Step3Data) => void }) {
  const toggle = (id: string) => {
    const exists = data.modules.includes(id)
    onChange({
      modules: exists ? data.modules.filter((m) => m !== id) : [...data.modules, id],
    })
  }

  const selectAll = () => onChange({ modules: ALL_MODULES.map((m) => m.id) })
  const clearAll = () => onChange({ modules: [] })

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Módulos Disponíveis</h2>
          <p className="mt-1 text-sm text-gray-500">Selecione os módulos a ativar. O módulo <strong>Core</strong> é sempre incluído.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={selectAll}
            className="text-xs font-medium text-primary hover:underline"
          >
            Todos
          </button>
          <span className="text-gray-300">|</span>
          <button
            type="button"
            onClick={clearAll}
            className="text-xs font-medium text-gray-500 hover:underline"
          >
            Nenhum
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
        <strong>core</strong> — Módulo base sempre ativado (gestão de empresa, utilizadores, configurações)
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {ALL_MODULES.map((mod) => {
          const isSelected = data.modules.includes(mod.id)
          return (
            <button
              key={mod.id}
              type="button"
              onClick={() => toggle(mod.id)}
              className={cn(
                'flex flex-col gap-1 rounded-xl border-2 p-3 text-left transition-all hover:border-primary/50',
                isSelected ? 'border-primary bg-primary/5' : 'border-gray-200 bg-white',
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-xl">{mod.icon}</span>
                <div
                  className={cn(
                    'flex h-5 w-5 items-center justify-center rounded border-2 transition-all',
                    isSelected ? 'border-primary bg-primary' : 'border-gray-300 bg-white',
                  )}
                >
                  {isSelected && <Check className="h-3 w-3 text-white" />}
                </div>
              </div>
              <span className={cn('text-xs font-semibold leading-tight', isSelected ? 'text-primary' : 'text-gray-700')}>
                {mod.label}
              </span>
            </button>
          )
        })}
      </div>

      <p className="text-xs text-gray-400">
        {data.modules.length} módulo{data.modules.length !== 1 ? 's' : ''} selecionado{data.modules.length !== 1 ? 's' : ''} + core
      </p>
    </div>
  )
}

// ─── Step 4 ────────────────────────────────────────────────────────────────────

function Step4({ data, onChange }: { data: Step4Data; onChange: (d: Step4Data) => void }) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Admin da Empresa</h2>
        <p className="mt-1 text-sm text-gray-500">
          Crie o primeiro utilizador administrador para este tenant. Este passo é opcional — pode ser feito depois.
        </p>
      </div>

      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 hover:bg-gray-50">
        <input
          type="checkbox"
          checked={data.skip}
          onChange={(e) => onChange({ ...data, skip: e.target.checked })}
          className="h-4 w-4 rounded border-gray-300 accent-primary"
        />
        <span className="text-sm text-gray-600">Ignorar este passo — criar admin depois</span>
      </label>

      {!data.skip && (
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Nome Completo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={data.name}
              onChange={(e) => onChange({ ...data, name: e.target.value })}
              placeholder="Ex: João Silva"
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={data.email}
              onChange={(e) => onChange({ ...data, email: e.target.value })}
              placeholder="admin@palmeira.ao"
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Palavra-passe <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={data.password}
                onChange={(e) => onChange({ ...data, password: e.target.value })}
                placeholder="Mínimo 8 caracteres"
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 pr-11 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function NewTenantPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [error, setError] = useState<string | null>(null)

  const [step1, setStep1] = useState<Step1Data>({ name: '', slug: '', nif: '', contactEmail: '' })
  const [step2, setStep2] = useState<Step2Data>({ plan: 'PROFESSIONAL', maxUsers: 20, maxBranches: 3, expiresAt: '' })
  const [step3, setStep3] = useState<Step3Data>({ modules: ['pms', 'pos', 'finance', 'hr', 'stock'] })
  const [step4, setStep4] = useState<Step4Data>({ name: '', email: '', password: '', skip: false })

  const createMutation = useMutation({
    mutationFn: async () => {
      const body = {
        name: step1.name,
        slug: step1.slug,
        nif: step1.nif || undefined,
        contactEmail: step1.contactEmail || undefined,
        plan: step2.plan,
        maxUsers: step2.maxUsers,
        maxBranches: step2.maxBranches,
        expiresAt: step2.expiresAt || undefined,
        modules: [...step3.modules, 'core'],
      }

      const res = await api.post('/admin/tenants', body)
      const newTenant = res.data?.data || res.data

      if (!step4.skip && step4.name && step4.email && step4.password) {
        await api.post(`/admin/tenants/${newTenant.id}/invite-admin`, {
          name: step4.name,
          email: step4.email,
          password: step4.password,
          role: 'RESORT_MANAGER',
        })
      }

      return newTenant
    },
    onSuccess: () => {
      router.push('/admin/tenants')
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message || 'Erro ao criar empresa. Tente novamente.')
    },
  })

  const canProceed = () => {
    if (step === 1) return step1.name.trim().length > 0 && step1.slug.trim().length > 0
    if (step === 4 && !step4.skip) {
      return step4.name.trim() && step4.email.trim() && step4.password.length >= 8
    }
    return true
  }

  const handleNext = () => {
    if (step < 4) {
      setStep((s) => s + 1)
    } else {
      setError(null)
      createMutation.mutate()
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Back link */}
      <Link
        href="/admin/tenants"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para Empresas
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nova Empresa</h1>
        <p className="text-sm text-gray-500">Preencha os dados para registar um novo tenant na plataforma.</p>
      </div>

      {/* Progress */}
      <StepProgress current={step} />

      {/* Step card */}
      <Card>
        <CardContent>
          {step === 1 && <Step1 data={step1} onChange={setStep1} />}
          {step === 2 && <Step2 data={step2} onChange={setStep2} />}
          {step === 3 && <Step3 data={step3} onChange={setStep3} />}
          {step === 4 && <Step4 data={step4} onChange={setStep4} />}
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 1}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Anterior
        </Button>

        <span className="text-xs text-gray-400">
          Passo {step} de {STEPS.length}
        </span>

        <Button
          onClick={handleNext}
          disabled={!canProceed() || createMutation.isPending}
        >
          {step < 4 ? (
            <>
              Próximo
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          ) : createMutation.isPending ? (
            'A criar...'
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Criar Empresa
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
