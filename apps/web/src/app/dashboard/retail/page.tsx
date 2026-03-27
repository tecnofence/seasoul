'use client'

import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatKwanza, formatDateTime } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ShoppingBag, Plus, Store, TrendingUp, Receipt, DollarSign } from 'lucide-react'

const PAYMENT_LABEL: Record<string, string> = { CASH: 'Dinheiro', CARD: 'Cartão', TRANSFER: 'Transferência', MULTICAIXA: 'Multicaixa' }

export default function RetailPage() {
  const router = useRouter()

  const { data: summaryData, isLoading: loadingSummary } = useQuery({
    queryKey: ['retail-summary'],
    queryFn: () => api.get('/retail/summary').then((r) => r.data),
  })

  const { data: storesData, isLoading: loadingStores } = useQuery({
    queryKey: ['retail-stores'],
    queryFn: () => api.get('/retail/stores', { params: { limit: 50 } }).then((r) => r.data),
  })

  const { data: salesData, isLoading: loadingSales } = useQuery({
    queryKey: ['retail-sales'],
    queryFn: () => api.get('/retail/sales', { params: { limit: 20 } }).then((r) => r.data),
  })

  const summary = summaryData?.data ?? {}
  const stores = storesData?.data ?? []
  const sales = salesData?.data ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Retalho</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => router.push('/dashboard/retail/stores/new')}><Plus className="mr-2 h-4 w-4" /> Nova Loja</Button>
          <Button onClick={() => router.push('/dashboard/retail/new')}><Plus className="mr-2 h-4 w-4" /> Nova Venda</Button>
        </div>
      </div>

      {/* Resumo */}
      {loadingSummary ? <p className="text-gray-500">A carregar...</p> : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50"><Receipt className="h-5 w-5 text-blue-600" /></div>
              <div>
                <p className="text-sm text-gray-500">Total Vendas</p>
                <p className="text-xl font-bold text-gray-900">{summary.totalSales ?? 0}</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50"><DollarSign className="h-5 w-5 text-green-600" /></div>
              <div>
                <p className="text-sm text-gray-500">Receita</p>
                <p className="text-xl font-bold text-gray-900">{formatKwanza(summary.totalRevenue ?? 0)}</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50"><TrendingUp className="h-5 w-5 text-purple-600" /></div>
              <div>
                <p className="text-sm text-gray-500">Ticket Médio</p>
                <p className="text-xl font-bold text-gray-900">{formatKwanza(summary.averageTicket ?? 0)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lojas */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-gray-800">Lojas</h2>
        {loadingStores ? <p className="text-gray-500">A carregar...</p> : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stores.map((s: any) => (
              <div key={s.id} className="cursor-pointer rounded-lg border bg-white p-5 shadow-sm transition-shadow hover:shadow-md" onClick={() => router.push(`/dashboard/retail/stores/${s.id}`)}>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><Store className="h-5 w-5 text-primary" /></div>
                  <div>
                    <h3 className="font-semibold">{s.name}</h3>
                    <p className="text-sm text-gray-500">{s.location ?? '—'}</p>
                  </div>
                </div>
              </div>
            ))}
            {stores.length === 0 && (
              <div className="col-span-full rounded-lg border bg-white p-12 text-center">
                <Store className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-4 text-gray-500">Nenhuma loja registada</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Vendas recentes */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-gray-800">Vendas Recentes</h2>
        {loadingSales ? <p className="text-gray-500">A carregar...</p> : (
          <div className="overflow-x-auto rounded-lg border bg-white">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Loja</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Data</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Pagamento</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sales.map((s: any) => (
                  <tr key={s.id} className="cursor-pointer hover:bg-gray-50" onClick={() => router.push(`/dashboard/retail/sales/${s.id}`)}>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">{s.clientName ?? '—'}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">{s.storeName ?? s.store?.name ?? '—'}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">{s.createdAt ? formatDateTime(s.createdAt) : '—'}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">{PAYMENT_LABEL[s.paymentMethod] ?? s.paymentMethod}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-right font-medium">{formatKwanza(s.total ?? 0)}</td>
                  </tr>
                ))}
                {sales.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-500">Nenhuma venda registada</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
