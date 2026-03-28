'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatKwanza, formatDateTime } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Eye, Plus, ShoppingCart, TrendingUp, Banknote } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER' | 'MULTICAIXA'
type SaleStatus = 'PENDING' | 'INVOICED' | 'CANCELLED'

interface Sale {
  id: string
  createdAt: string
  items?: unknown[]
  paymentMethod: PaymentMethod
  totalAmount: number
  taxAmount: number
  invoiceNumber?: string
  status: SaleStatus
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_VARIANT: Record<SaleStatus, 'success' | 'warning' | 'danger'> = {
  PENDING: 'warning',
  INVOICED: 'success',
  CANCELLED: 'danger',
}

const STATUS_LABEL: Record<SaleStatus, string> = {
  PENDING: 'Pendente',
  INVOICED: 'Faturado',
  CANCELLED: 'Cancelado',
}

const PAYMENT_ICON: Record<PaymentMethod, string> = {
  CASH: '💵',
  CARD: '💳',
  TRANSFER: '🔄',
  MULTICAIXA: '📱',
}

const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  CASH: 'Numerário',
  CARD: 'Cartão',
  TRANSFER: 'Transferência',
  MULTICAIXA: 'Multicaixa',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr)
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function PosPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('')

  // Query 1: recent orders for KPI stats
  const { data: recentData } = useQuery({
    queryKey: ['pos-recent'],
    queryFn: () => api.get('/pos/orders', { params: { limit: 50 } })
      .catch(() => api.get('/pos', { params: { limit: 50 } }))
      .then((r) => r.data),
    retry: 1,
  })

  // Query 2: paginated list for table
  const { data, isLoading } = useQuery({
    queryKey: ['pos-list', page, search, statusFilter, paymentFilter],
    queryFn: () =>
      api.get('/pos', {
        params: {
          page,
          limit: 20,
          search: search || undefined,
          status: statusFilter || undefined,
          paymentMethod: paymentFilter || undefined,
        },
      }).then((r) => r.data),
  })

  // Query 3: products (optional context)
  useQuery({
    queryKey: ['products-context'],
    queryFn: () => api.get('/products', { params: { limit: 50 } }).then((r) => r.data),
    retry: 1,
  })

  // ── KPI derivation ──────────────────────────────────────────────────────────
  const todaySales: Sale[] = useMemo(() => {
    const list: Sale[] = recentData?.data ?? []
    return list.filter((s) => isToday(s.createdAt) && s.status !== 'CANCELLED')
  }, [recentData])

  const todayCount = todaySales.length
  const todayRevenue = todaySales.reduce((acc, s) => acc + Number(s.totalAmount), 0)
  const ticketMedio = todayCount > 0 ? todayRevenue / todayCount : 0

  const sales: Sale[] = data?.data ?? []
  const totalPages: number = data?.totalPages ?? 1

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ponto de Venda</h1>
          <p className="mt-0.5 text-sm text-gray-500">Gestão de vendas e faturas do resort</p>
        </div>
        <Link href="/dashboard/pos/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Nova Venda
          </Button>
        </Link>
      </div>

      {/* ── KPI Row (inline cards) ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Vendas Hoje */}
        <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <ShoppingCart className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Vendas Hoje</p>
            <p className="mt-0.5 text-2xl font-bold text-gray-900">{todayCount}</p>
            <p className="text-xs text-gray-400">transações hoje</p>
          </div>
        </div>

        {/* Receita Hoje */}
        <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Banknote className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Receita Hoje</p>
            <p className="mt-0.5 text-2xl font-bold text-gray-900">{formatKwanza(todayRevenue)}</p>
            <p className="text-xs text-gray-400">total faturado</p>
          </div>
        </div>

        {/* Ticket Médio */}
        <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <TrendingUp className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Ticket Médio</p>
            <p className="mt-0.5 text-2xl font-bold text-gray-900">{formatKwanza(ticketMedio)}</p>
            <p className="text-xs text-gray-400">por venda hoje</p>
          </div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <Input
            placeholder="Pesquisar por número de fatura..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-10"
          />
        </div>
        <select
          className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
        >
          <option value="">Todos os estados</option>
          <option value="PENDING">Pendente</option>
          <option value="INVOICED">Faturado</option>
          <option value="CANCELLED">Cancelado</option>
        </select>
        <select
          className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          value={paymentFilter}
          onChange={(e) => { setPaymentFilter(e.target.value); setPage(1) }}
        >
          <option value="">Todos os pagamentos</option>
          <option value="CASH">💵 Numerário</option>
          <option value="CARD">💳 Cartão</option>
          <option value="TRANSFER">🔄 Transferência</option>
          <option value="MULTICAIXA">📱 Multicaixa</option>
        </select>
      </div>

      {/* ── Table ── */}
      <Card className="p-0">
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-gray-400">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
              <span className="text-sm">A carregar vendas...</span>
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Itens</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">IVA</TableHead>
                <TableHead>Nº Fatura</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-12">Ver</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell className="text-sm text-gray-600">
                    {formatDateTime(sale.createdAt)}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-gray-900">{sale.items?.length ?? 0}</span>
                    <span className="ml-1 text-xs text-gray-400">itens</span>
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1.5 text-sm">
                      <span>{PAYMENT_ICON[sale.paymentMethod] ?? '—'}</span>
                      <span className="text-gray-700">
                        {PAYMENT_LABEL[sale.paymentMethod] ?? sale.paymentMethod}
                      </span>
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-gray-900">
                    {formatKwanza(sale.totalAmount)}
                  </TableCell>
                  <TableCell className="text-right text-sm text-gray-500">
                    {formatKwanza(sale.taxAmount)}
                  </TableCell>
                  <TableCell>
                    {sale.invoiceNumber ? (
                      <span className="font-mono text-xs text-gray-700">{sale.invoiceNumber}</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[sale.status] ?? 'default'}>
                      {STATUS_LABEL[sale.status] ?? sale.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Link href={`/dashboard/pos/${sale.id}`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="h-4 w-4 text-gray-500" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {!sales.length && (
                <TableRow>
                  <TableCell colSpan={8} className="py-16 text-center">
                    <ShoppingCart className="mx-auto h-10 w-10 text-gray-300" />
                    <p className="mt-3 text-sm text-gray-500">Sem vendas encontradas</p>
                    <p className="text-xs text-gray-400">Tente ajustar os filtros de pesquisa</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Anterior
          </Button>
          <span className="px-2 text-sm text-gray-600">
            Página <span className="font-medium">{page}</span> de{' '}
            <span className="font-medium">{totalPages}</span>
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Seguinte
          </Button>
        </div>
      )}
    </div>
  )
}
