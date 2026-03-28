'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatKwanza } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { StatCard } from '@/components/ui/stat-card'
import {
  Package,
  Wallet,
  AlertTriangle,
  TrendingUp,
  Search,
  Plus,
  AlertCircle,
} from 'lucide-react'

// --- Types ---
interface StockItem {
  id: string
  name: string
  sku: string
  category: string
  quantity: number | string
  unit: string
  minStock: number | string
  unitPrice: number | string
}

interface StatsData {
  totalProducts: number
  totalValue: number | string
  lowStockAlerts: number
  entriesThisMonth: number
}

// --- Constants ---
const CATEGORIES = [
  { key: '', label: 'Todos' },
  { key: 'ALIMENTAR', label: 'Alimentar' },
  { key: 'BEBIDAS', label: 'Bebidas' },
  { key: 'LIMPEZA', label: 'Limpeza' },
  { key: 'AMENITIES', label: 'Amenities' },
  { key: 'MANUTENCAO', label: 'Manutenção' },
  { key: 'ESCRITORIO', label: 'Escritório' },
  { key: 'OUTRO', label: 'Outro' },
]

const CATEGORY_LABELS: Record<string, string> = {
  ALIMENTAR: 'Alimentar',
  BEBIDAS: 'Bebidas',
  LIMPEZA: 'Limpeza',
  AMENITIES: 'Amenities',
  MANUTENCAO: 'Manutenção',
  ESCRITORIO: 'Escritório',
  OUTRO: 'Outro',
}

export default function StockPage() {
  const [category, setCategory] = useState('')
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['stock', category, search],
    queryFn: () =>
      api
        .get('/stock', {
          params: {
            limit: 50,
            category: category || undefined,
            search: search || undefined,
          },
        })
        .then((r) => r.data),
  })

  const { data: statsData } = useQuery({
    queryKey: ['stock-stats'],
    queryFn: () => api.get('/stock/stats').then((r) => r.data),
  })

  const items: StockItem[] = data?.data ?? []
  const stats: StatsData = statsData?.data ?? {}

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock</h1>
          <p className="mt-1 text-sm text-gray-500">Gestão de inventário e movimentos</p>
        </div>
        <Link href="/dashboard/stock/movement/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Entrada de Stock
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Total Produtos"
          value={stats.totalProducts ?? '—'}
          icon={<Package className="h-5 w-5" />}
        />
        <StatCard
          title="Valor em Stock"
          value={stats.totalValue ? formatKwanza(stats.totalValue) : '—'}
          icon={<Wallet className="h-5 w-5" />}
        />
        <StatCard
          title="Alertas Nível Baixo"
          value={stats.lowStockAlerts ?? '—'}
          icon={<AlertTriangle className="h-5 w-5" />}
        />
        <StatCard
          title="Entradas este Mês"
          value={stats.entriesThisMonth ?? '—'}
          icon={<TrendingUp className="h-5 w-5" />}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* Category tabs */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setCategory(cat.key)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                category === cat.key
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative sm:ml-auto">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Pesquisar produto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 sm:w-72"
          />
        </div>
      </div>

      {/* Table */}
      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="flex h-32 items-center justify-center text-gray-500">
            <span className="text-sm">A carregar...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center gap-2">
            <Package className="h-8 w-8 text-gray-300" />
            <p className="text-sm text-gray-500">Nenhum produto encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium text-gray-600">Produto</th>
                  <th className="px-4 py-3 font-medium text-gray-600">SKU</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Categoria</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Quantidade</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Unidade</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Estoque Mín.</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Valor Unit.</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Total</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Alerta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((item) => {
                  const qty = parseFloat(String(item.quantity))
                  const minQty = parseFloat(String(item.minStock))
                  const unitPrice = parseFloat(String(item.unitPrice))
                  const totalValue = qty * unitPrice
                  const isLow = qty <= minQty

                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors hover:bg-gray-50 ${
                        isLow ? 'bg-red-50/40' : ''
                      }`}
                    >
                      {/* Produto */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {isLow && (
                            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                          )}
                          <span className="font-medium text-gray-900">{item.name}</span>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">
                        {item.sku || '—'}
                      </td>

                      {/* Categoria */}
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          {CATEGORY_LABELS[item.category] ?? item.category ?? '—'}
                        </span>
                      </td>

                      {/* Quantidade */}
                      <td className={`px-4 py-3 text-right font-semibold ${isLow ? 'text-red-600' : 'text-gray-900'}`}>
                        {qty}
                      </td>

                      {/* Unidade */}
                      <td className="px-4 py-3 text-gray-500">{item.unit}</td>

                      {/* Estoque Mínimo */}
                      <td className="px-4 py-3 text-right text-gray-500">{minQty}</td>

                      {/* Valor Unitário */}
                      <td className="px-4 py-3 text-right text-gray-700">
                        {unitPrice > 0 ? formatKwanza(unitPrice) : '—'}
                      </td>

                      {/* Total */}
                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                        {unitPrice > 0 ? formatKwanza(totalValue) : '—'}
                      </td>

                      {/* Alerta */}
                      <td className="px-4 py-3">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                            <AlertCircle className="h-3 w-3" />
                            Nível Baixo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                            OK
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
