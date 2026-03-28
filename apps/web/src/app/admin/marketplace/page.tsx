'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { cn, formatKwanza } from '@/lib/utils'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, X, Users } from 'lucide-react'

// ─── Static module catalog ─────────────────────────────────────────────────────

const MODULE_CATALOG = [
  {
    id: 'pms',
    name: 'Gestão Hoteleira (PMS)',
    desc: 'Reservas, quartos, hóspedes, tarifas',
    category: 'Hospitalidade',
    price: 25000,
    icon: '🏨',
  },
  {
    id: 'pos',
    name: 'Ponto de Venda (POS)',
    desc: 'Restaurante, bar, frente de caixa',
    category: 'Restauração',
    price: 20000,
    icon: '🍽️',
  },
  {
    id: 'retail',
    name: 'Loja do Resort',
    desc: 'Retalho, produtos, vendas',
    category: 'Restauração',
    price: 15000,
    icon: '🛍️',
  },
  {
    id: 'spa',
    name: 'Spa & Bem-Estar',
    desc: 'Serviços, reservas de tratamentos',
    category: 'Spa & Lazer',
    price: 15000,
    icon: '💆',
  },
  {
    id: 'activities',
    name: 'Atividades & Tours',
    desc: 'Excursões, reservas de atividades',
    category: 'Spa & Lazer',
    price: 10000,
    icon: '🏄',
  },
  {
    id: 'events',
    name: 'Eventos & Conferências',
    desc: 'Salas, catering, gestão de eventos',
    category: 'Spa & Lazer',
    price: 15000,
    icon: '🎉',
  },
  {
    id: 'stock',
    name: 'Stock & Armazém',
    desc: 'Inventário, movimentos, fornecedores',
    category: 'Stock',
    price: 15000,
    icon: '📦',
  },
  {
    id: 'hr',
    name: 'Recursos Humanos',
    desc: 'Colaboradores, assiduidade, salários',
    category: 'RH',
    price: 20000,
    icon: '👥',
  },
  {
    id: 'maintenance',
    name: 'Manutenção',
    desc: 'Tickets, inspeções, rondas de segurança',
    category: 'Operações',
    price: 10000,
    icon: '🔧',
  },
  {
    id: 'finance',
    name: 'Financeiro & Faturação',
    desc: 'Contabilidade, faturação AGT, relatórios',
    category: 'Financeiro',
    price: 30000,
    icon: '💰',
  },
  {
    id: 'locks',
    name: 'Smart Locks',
    desc: 'Controlo de acesso TTLock, Seam API',
    category: 'Hospitalidade',
    price: 10000,
    icon: '🔐',
  },
  {
    id: 'security',
    name: 'Segurança & Contratos',
    desc: 'Rondas, alertas, contratos de segurança',
    category: 'Operações',
    price: 10000,
    icon: '🛡️',
  },
]

const ALL_CATEGORIES = [
  'Todos',
  'Hospitalidade',
  'Restauração',
  'Spa & Lazer',
  'Stock',
  'RH',
  'Operações',
  'Financeiro',
]

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ApiModule {
  id: string
  name: string
  description?: string
  basePrice?: number
  category?: string
  isAvailable: boolean
  tenants?: number | { length: number }
  _count?: { tenantModules: number }
}

interface MergedModule {
  id: string
  name: string
  desc: string
  category: string
  price: number
  icon: string
  isAvailable: boolean
  tenantCount: number
}

// ─── Toggle Switch component ───────────────────────────────────────────────────

function ToggleSwitch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean
  onChange: (val: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-primary' : 'bg-gray-200',
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform duration-200',
          checked ? 'translate-x-4' : 'translate-x-0',
        )}
      />
    </button>
  )
}

// ─── Add Module inline form ────────────────────────────────────────────────────

interface AddModuleFormProps {
  onClose: () => void
  onSaved: () => void
}

function AddModuleForm({ onClose, onSaved }: AddModuleFormProps) {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    category: 'Core',
    basePrice: '',
    isAvailable: true,
  })

  const mutation = useMutation({
    mutationFn: (data: typeof formData) =>
      api.post('/admin/modules', {
        ...data,
        basePrice: Number(data.basePrice) || 0,
      }),
    onSuccess: () => {
      onSaved()
      onClose()
    },
  })

  const formCategories = ['Core', 'Hospitalidade', 'Restauração', 'Spa & Lazer', 'Stock', 'RH', 'Operações', 'Financeiro']

  return (
    <Card className="border-primary/20">
      <CardHeader className="mb-4">
        <div className="flex items-center justify-between">
          <CardTitle>Adicionar Módulo</CardTitle>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            mutation.mutate(formData)
          }}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              ID do Módulo <span className="text-red-500">*</span>
            </label>
            <input
              required
              type="text"
              placeholder="ex: pms, pos, hr"
              value={formData.id}
              onChange={(e) => setFormData((p) => ({ ...p, id: e.target.value }))}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Nome <span className="text-red-500">*</span>
            </label>
            <input
              required
              type="text"
              placeholder="Nome do módulo"
              value={formData.name}
              onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Categoria</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value }))}
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
            >
              {formCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Preço Base (Kz/mês)
            </label>
            <input
              type="number"
              min={0}
              placeholder="ex: 25000"
              value={formData.basePrice}
              onChange={(e) => setFormData((p) => ({ ...p, basePrice: e.target.value }))}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-2">
            <label className="mb-1 block text-xs font-medium text-gray-700">Descrição</label>
            <input
              type="text"
              placeholder="Breve descrição do módulo"
              value={formData.description}
              onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>

          <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-3">
            <ToggleSwitch
              checked={formData.isAvailable}
              onChange={(val) => setFormData((p) => ({ ...p, isAvailable: val }))}
            />
            <span className="text-sm text-gray-600">
              {formData.isAvailable ? 'Disponível para tenants' : 'Indisponível (em desenvolvimento)'}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-3">
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="min-w-[120px]"
            >
              {mutation.isPending ? 'A guardar...' : 'Guardar Módulo'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            {mutation.isError && (
              <span className="text-xs text-red-600">
                Erro ao guardar. Tente novamente.
              </span>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

// ─── Module Card ───────────────────────────────────────────────────────────────

function ModuleCard({
  module,
  onToggle,
  isToggling,
}: {
  module: MergedModule
  onToggle: (id: string, isAvailable: boolean) => void
  isToggling: boolean
}) {
  return (
    <Card className="flex flex-col gap-0 p-0 overflow-hidden hover:shadow-md transition-shadow">
      {/* Card header */}
      <div className="flex items-start justify-between border-b border-gray-100 bg-gray-50 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl leading-none" role="img" aria-label={module.name}>
            {module.icon}
          </span>
          <div>
            <p className="font-semibold text-gray-900 leading-tight">{module.name}</p>
            <span className="mt-0.5 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
              {module.category}
            </span>
          </div>
        </div>

        {/* Available toggle */}
        <div className="flex flex-col items-end gap-1">
          <ToggleSwitch
            checked={module.isAvailable}
            onChange={(val) => onToggle(module.id, val)}
            disabled={isToggling}
          />
          <span
            className={cn(
              'text-[10px] font-semibold',
              module.isAvailable ? 'text-green-600' : 'text-gray-400',
            )}
          >
            {module.isAvailable ? 'Disponível' : 'Indisponível'}
          </span>
        </div>
      </div>

      {/* Card body */}
      <div className="flex flex-1 flex-col px-5 py-4">
        <p className="flex-1 text-sm text-gray-500 leading-relaxed">{module.desc}</p>

        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Preço base
            </p>
            <p className="text-sm font-bold text-gray-900">
              {formatKwanza(module.price)}
              <span className="ml-1 text-xs font-normal text-gray-400">/mês</span>
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Users className="h-3.5 w-3.5 text-gray-400" />
            <span>
              <strong className="font-semibold text-gray-700">{module.tenantCount}</strong>{' '}
              {module.tenantCount === 1 ? 'tenant' : 'tenants'}
            </span>
          </div>
        </div>
      </div>
    </Card>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────────────────

export default function MarketplacePage() {
  const queryClient = useQueryClient()
  const [activeCategory, setActiveCategory] = useState('Todos')
  const [showAddForm, setShowAddForm] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  // Fetch modules from API
  const { data: apiModules } = useQuery<ApiModule[]>({
    queryKey: ['admin-modules'],
    queryFn: () =>
      api.get('/admin/modules').then((r) => {
        const raw = r.data?.data ?? r.data
        return Array.isArray(raw) ? raw : []
      }),
  })

  // Toggle availability mutation
  const toggleMutation = useMutation({
    mutationFn: ({ id, isAvailable }: { id: string; isAvailable: boolean }) =>
      api.post('/admin/modules', { id, isAvailable }),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-modules'] })
      setTogglingId(null)
    },
  })

  // Merge API data onto the static catalog
  const modules: MergedModule[] = MODULE_CATALOG.map((catalogItem) => {
    const apiItem = apiModules?.find((m) => m.id === catalogItem.id)
    let tenantCount = 0
    if (apiItem) {
      if (typeof apiItem.tenants === 'number') tenantCount = apiItem.tenants
      else if (apiItem._count?.tenantModules) tenantCount = apiItem._count.tenantModules
    }
    return {
      ...catalogItem,
      isAvailable: apiItem ? apiItem.isAvailable : true,
      tenantCount,
    }
  })

  // Filter by category
  const filtered =
    activeCategory === 'Todos'
      ? modules
      : modules.filter((m) => m.category === activeCategory)

  function handleToggle(id: string, isAvailable: boolean) {
    setTogglingId(id)
    toggleMutation.mutate({ id, isAvailable })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marketplace de Módulos</h1>
          <p className="text-sm text-gray-500">
            Gira os módulos disponíveis na plataforma e controla o acesso de cada tenant.
          </p>
        </div>
        <Button
          onClick={() => setShowAddForm((v) => !v)}
          className="sm:w-auto"
        >
          {showAddForm ? (
            <>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Módulo
            </>
          )}
        </Button>
      </div>

      {/* Inline add form */}
      {showAddForm && (
        <AddModuleForm
          onClose={() => setShowAddForm(false)}
          onSaved={() => queryClient.invalidateQueries({ queryKey: ['admin-modules'] })}
        />
      )}

      {/* Category filter tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {ALL_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              'rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors',
              activeCategory === cat
                ? 'border-primary bg-primary text-white'
                : 'border-gray-200 bg-white text-gray-600 hover:border-primary/40 hover:text-primary',
            )}
          >
            {cat}
            {cat !== 'Todos' && (
              <span
                className={cn(
                  'ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                  activeCategory === cat
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-100 text-gray-500',
                )}
              >
                {modules.filter((m) => m.category === cat).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500">Total de Módulos</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{modules.length}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500">Disponíveis</p>
          <p className="mt-1 text-2xl font-bold text-green-600">
            {modules.filter((m) => m.isAvailable).length}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500">Indisponíveis</p>
          <p className="mt-1 text-2xl font-bold text-gray-400">
            {modules.filter((m) => !m.isAvailable).length}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500">Categorias</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {ALL_CATEGORIES.length - 1}
          </p>
        </div>
      </div>

      {/* Module grid */}
      {filtered.length === 0 ? (
        <Card>
          <p className="py-8 text-center text-sm italic text-gray-400">
            Nenhum módulo encontrado nesta categoria.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((mod) => (
            <ModuleCard
              key={mod.id}
              module={mod}
              onToggle={handleToggle}
              isToggling={togglingId === mod.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}
