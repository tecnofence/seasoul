'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatKwanza } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { StatCard } from '@/components/ui/stat-card'
import { Input } from '@/components/ui/input'
import {
  Plus,
  Search,
  Package,
  Tag,
  CheckCircle,
  TrendingUp,
  Pencil,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type ProductCategory = 'BEBIDAS' | 'COMIDAS' | 'SPA' | 'RETALHO' | 'OUTROS'

interface Product {
  id: string
  name: string
  category: ProductCategory
  unitPrice: number
  costPrice?: number
  taxRate: number
  active: boolean
  imageUrl?: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_EMOJI: Record<ProductCategory | string, string> = {
  BEBIDAS: '🍸',
  COMIDAS: '🍽️',
  SPA: '💆',
  RETALHO: '🛍️',
  OUTROS: '📦',
}

const CATEGORY_LABEL: Record<ProductCategory | string, string> = {
  BEBIDAS: 'Bebidas',
  COMIDAS: 'Comidas',
  SPA: 'Spa',
  RETALHO: 'Retalho',
  OUTROS: 'Outros',
}

const CATEGORY_COLOR: Record<ProductCategory | string, string> = {
  BEBIDAS: 'bg-blue-100 text-blue-800',
  COMIDAS: 'bg-orange-100 text-orange-800',
  SPA: 'bg-purple-100 text-purple-800',
  RETALHO: 'bg-pink-100 text-pink-800',
  OUTROS: 'bg-gray-100 text-gray-700',
}

const ALL_TABS = ['TODOS', 'BEBIDAS', 'COMIDAS', 'SPA', 'RETALHO', 'OUTROS'] as const
type Tab = (typeof ALL_TABS)[number]

// ─── Product Card ─────────────────────────────────────────────────────────────

function ProductCard({ product }: { product: Product }) {
  const margin =
    product.costPrice && product.costPrice > 0
      ? Math.round(
          ((Number(product.unitPrice) - Number(product.costPrice)) /
            Number(product.unitPrice)) *
            100,
        )
      : null

  const emoji = CATEGORY_EMOJI[product.category] ?? '📦'
  const colorClass = CATEGORY_COLOR[product.category] ?? 'bg-gray-100 text-gray-700'

  return (
    <Card className="flex flex-col overflow-hidden p-0 transition-shadow hover:shadow-md">
      {/* Image placeholder */}
      <div className="flex h-32 items-center justify-center bg-primary/5">
        <span className="text-5xl">{emoji}</span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Name + badges */}
        <div>
          <h3 className="font-semibold text-gray-900 leading-snug line-clamp-2">
            {product.name}
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass}`}
            >
              {emoji} {CATEGORY_LABEL[product.category] ?? product.category}
            </span>
            <Badge variant={product.active ? 'success' : 'danger'}>
              {product.active ? 'Activo' : 'Inactivo'}
            </Badge>
          </div>
        </div>

        {/* Pricing */}
        <div className="mt-auto space-y-1">
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-gray-400">Preço de venda</span>
            <span className="text-base font-bold text-primary">
              {formatKwanza(product.unitPrice)}
            </span>
          </div>
          {product.costPrice != null && (
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-gray-400">Custo</span>
              <span className="text-sm text-gray-600">
                {formatKwanza(product.costPrice)}
              </span>
            </div>
          )}
          {margin !== null && (
            <div className="flex items-baseline justify-between border-t pt-1">
              <span className="text-xs text-gray-400">Margem</span>
              <span
                className={`text-sm font-semibold ${
                  margin >= 40
                    ? 'text-green-600'
                    : margin >= 20
                      ? 'text-yellow-600'
                      : 'text-red-600'
                }`}
              >
                {margin}%
              </span>
            </div>
          )}
        </div>

        {/* Action */}
        <Link href={`/dashboard/products/${product.id}`} className="mt-1">
          <Button variant="outline" size="sm" className="w-full">
            <Pencil className="mr-2 h-3.5 w-3.5" />
            Editar
          </Button>
        </Link>
      </div>
    </Card>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('TODOS')
  const [search, setSearch] = useState('')

  const params: Record<string, string> = { limit: '100' }
  if (activeTab !== 'TODOS') params.category = activeTab
  if (search) params.search = search

  const { data, isLoading } = useQuery({
    queryKey: ['products', activeTab, search],
    queryFn: () => api.get('/products', { params }).then((r) => r.data),
  })

  const products: Product[] = data?.data ?? []

  // ── Stats derived from the full loaded list ──────────────────────────────────
  const stats = useMemo(() => {
    // Use a broader query if tab is filtered — derive from current data
    const all = products
    const active = all.filter((p) => p.active).length
    const categories = new Set(all.map((p) => p.category)).size
    const prices = all.map((p) => Number(p.unitPrice)).filter((v) => v > 0)
    const avgPrice = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0
    return { total: all.length, active, categories, avgPrice }
  }, [products])

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
          <p className="mt-0.5 text-sm text-gray-500">Catálogo de produtos e serviços do resort</p>
        </div>
        <Link href="/dashboard/products/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Novo Produto
          </Button>
        </Link>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          title="Total Produtos"
          value={isLoading ? '—' : stats.total}
          icon={<Package className="h-6 w-6" />}
        />
        <StatCard
          title="Categorias"
          value={isLoading ? '—' : stats.categories}
          icon={<Tag className="h-6 w-6" />}
        />
        <StatCard
          title="Activos"
          value={isLoading ? '—' : stats.active}
          icon={<CheckCircle className="h-6 w-6" />}
        />
        <StatCard
          title="Valor Médio"
          value={isLoading ? '—' : formatKwanza(stats.avgPrice)}
          icon={<TrendingUp className="h-6 w-6" />}
        />
      </div>

      {/* ── Category tabs + search ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Tabs */}
        <div className="flex flex-wrap gap-1">
          {ALL_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab === 'TODOS'
                ? 'Todos'
                : `${CATEGORY_EMOJI[tab]} ${CATEGORY_LABEL[tab]}`}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Pesquisar produto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* ── Product grid ── */}
      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-gray-400">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
            <span className="text-sm">A carregar produtos...</span>
          </div>
        </div>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Package className="h-12 w-12 text-gray-300" />
            <p className="mt-3 text-sm text-gray-500">Nenhum produto encontrado</p>
            <p className="text-xs text-gray-400">Tente ajustar os filtros ou adicione um novo produto</p>
            <Link href="/dashboard/products/new" className="mt-4">
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" /> Novo Produto
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* Count footer */}
      {!isLoading && products.length > 0 && (
        <p className="text-center text-xs text-gray-400">
          A mostrar {products.length} produto{products.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}
