'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { StatCard } from '@/components/ui/stat-card'
import { Input } from '@/components/ui/input'
import {
  Plus,
  Search,
  Building2,
  CheckCircle,
  Tag,
  ShoppingBag,
  Phone,
  Mail,
  User,
  ArrowRight,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Supplier {
  id: string
  name: string
  nif?: string
  contact?: string
  phone?: string
  email?: string
  category?: string
  active: boolean
  lastOrderDate?: string
  totalOrders?: number
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_COLOR: Record<string, string> = {
  ALIMENTACAO: 'bg-orange-100 text-orange-800',
  BEBIDAS: 'bg-blue-100 text-blue-800',
  LIMPEZA: 'bg-cyan-100 text-cyan-800',
  MANUTENCAO: 'bg-yellow-100 text-yellow-800',
  TECNOLOGIA: 'bg-green-100 text-green-800',
  SERVICOS: 'bg-pink-100 text-pink-800',
  OUTROS: 'bg-gray-100 text-gray-700',
}

const CATEGORY_LABEL: Record<string, string> = {
  ALIMENTACAO: 'Alimentação',
  BEBIDAS: 'Bebidas',
  LIMPEZA: 'Limpeza',
  MANUTENCAO: 'Manutenção',
  TECNOLOGIA: 'Tecnologia',
  SERVICOS: 'Serviços',
  OUTROS: 'Outros',
}

// ─── Supplier Card ────────────────────────────────────────────────────────────

function SupplierCard({ supplier }: { supplier: Supplier }) {
  const categoryColorClass =
    CATEGORY_COLOR[supplier.category ?? ''] ?? 'bg-gray-100 text-gray-700'
  const categoryLabel =
    CATEGORY_LABEL[supplier.category ?? ''] ?? supplier.category ?? '—'

  // Initials for avatar
  const initials = supplier.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  return (
    <Card className="flex flex-col gap-0 p-0 transition-shadow hover:shadow-md">
      <div className="flex items-start gap-4 p-5">
        {/* Avatar */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 font-bold text-primary">
          {initials}
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold text-gray-900 leading-snug truncate">
              {supplier.name}
            </h3>
            <Badge variant={supplier.active ? 'success' : 'danger'}>
              {supplier.active ? 'Activo' : 'Inactivo'}
            </Badge>
          </div>

          {supplier.nif && (
            <p className="mt-0.5 text-xs text-gray-400 font-mono">NIF: {supplier.nif}</p>
          )}

          {supplier.category && (
            <span
              className={`mt-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${categoryColorClass}`}
            >
              {categoryLabel}
            </span>
          )}
        </div>
      </div>

      {/* Contact details */}
      <div className="border-t px-5 py-3 space-y-1.5">
        {supplier.contact && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="h-3.5 w-3.5 shrink-0 text-gray-400" />
            <span className="truncate">{supplier.contact}</span>
          </div>
        )}
        {supplier.phone && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Phone className="h-3.5 w-3.5 shrink-0 text-gray-400" />
            <span>{supplier.phone}</span>
          </div>
        )}
        {supplier.email && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mail className="h-3.5 w-3.5 shrink-0 text-gray-400" />
            <span className="truncate">{supplier.email}</span>
          </div>
        )}
        {!supplier.contact && !supplier.phone && !supplier.email && (
          <p className="text-xs text-gray-400 italic">Sem informação de contacto</p>
        )}
      </div>

      {/* Footer: last order + action */}
      <div className="flex items-center justify-between border-t bg-gray-50 px-5 py-3 rounded-b-lg">
        <div>
          {supplier.lastOrderDate ? (
            <p className="text-xs text-gray-500">
              Última encomenda:{' '}
              <span className="font-medium text-gray-700">
                {formatDate(supplier.lastOrderDate)}
              </span>
            </p>
          ) : (
            <p className="text-xs text-gray-400">Sem encomendas</p>
          )}
        </div>
        <Link href={`/dashboard/suppliers/${supplier.id}`}>
          <Button size="sm" variant="outline" className="gap-1.5">
            Ver Detalhes
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>
    </Card>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SuppliersPage() {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  const params: Record<string, string> = { limit: '50' }
  if (search) params.search = search

  const { data, isLoading } = useQuery({
    queryKey: ['suppliers', search],
    queryFn: () => api.get('/suppliers', { params }).then((r) => r.data),
  })

  const allSuppliers: Supplier[] = data?.data ?? []

  // ── Stats ────────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const active = allSuppliers.filter((s) => s.active).length
    const categories = new Set(allSuppliers.map((s) => s.category).filter(Boolean)).size
    const totalOrders = allSuppliers.reduce(
      (acc, s) => acc + (s.totalOrders ?? 0),
      0,
    )
    return { total: allSuppliers.length, active, categories, totalOrders }
  }, [allSuppliers])

  // ── Client-side category filter ──────────────────────────────────────────────
  const suppliers = useMemo(() => {
    if (!categoryFilter) return allSuppliers
    return allSuppliers.filter((s) => s.category === categoryFilter)
  }, [allSuppliers, categoryFilter])

  // ── Unique categories ────────────────────────────────────────────────────────
  const categories = useMemo(
    () =>
      [...new Set(allSuppliers.map((s) => s.category).filter(Boolean) as string[])].sort(),
    [allSuppliers],
  )

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fornecedores</h1>
          <p className="mt-0.5 text-sm text-gray-500">Gestão de fornecedores e parceiros</p>
        </div>
        <Link href="/dashboard/suppliers/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Novo Fornecedor
          </Button>
        </Link>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          title="Total Fornecedores"
          value={isLoading ? '—' : stats.total}
          icon={<Building2 className="h-6 w-6" />}
        />
        <StatCard
          title="Activos"
          value={isLoading ? '—' : stats.active}
          icon={<CheckCircle className="h-6 w-6" />}
        />
        <StatCard
          title="Categorias"
          value={isLoading ? '—' : stats.categories}
          icon={<Tag className="h-6 w-6" />}
        />
        <StatCard
          title="Total Encomendas"
          value={isLoading ? '—' : stats.totalOrders}
          icon={<ShoppingBag className="h-6 w-6" />}
        />
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Pesquisar fornecedor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Category filter */}
        <select
          className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">Todas as categorias</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {CATEGORY_LABEL[cat] ?? cat}
            </option>
          ))}
        </select>
      </div>

      {/* ── Supplier list ── */}
      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-gray-400">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
            <span className="text-sm">A carregar fornecedores...</span>
          </div>
        </div>
      ) : suppliers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Building2 className="h-12 w-12 text-gray-300" />
            <p className="mt-3 text-sm text-gray-500">Nenhum fornecedor encontrado</p>
            <p className="text-xs text-gray-400">
              Tente ajustar os filtros ou adicione um novo fornecedor
            </p>
            <Link href="/dashboard/suppliers/new" className="mt-4">
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" /> Novo Fornecedor
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {suppliers.map((supplier) => (
            <SupplierCard key={supplier.id} supplier={supplier} />
          ))}
        </div>
      )}

      {/* Count footer */}
      {!isLoading && suppliers.length > 0 && (
        <p className="text-center text-xs text-gray-400">
          A mostrar {suppliers.length} fornecedor{suppliers.length !== 1 ? 'es' : ''}
        </p>
      )}
    </div>
  )
}
