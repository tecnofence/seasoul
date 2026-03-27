'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatKwanza, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calculator, Plus, CheckCircle, Circle, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'

const CATEGORY_LABEL: Record<string, string> = { REVENUE: 'Receita', EXPENSE: 'Despesa', ASSET: 'Activo', LIABILITY: 'Passivo', EQUITY: 'Capital Próprio', TRANSFER: 'Transferência' }

export default function AccountingPage() {
  const router = useRouter()
  const [categoryFilter, setCategoryFilter] = useState('')
  const [reconciledFilter, setReconciledFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['accounting', categoryFilter, reconciledFilter],
    queryFn: () => api.get('/accounting', { params: { category: categoryFilter || undefined, reconciled: reconciledFilter === '' ? undefined : reconciledFilter === 'true', limit: 50 } }).then((r) => r.data),
  })

  const entries = data?.data ?? []

  const totalDebit = entries.reduce((sum: number, e: any) => sum + (parseFloat(e.debit) || 0), 0)
  const totalCredit = entries.reduce((sum: number, e: any) => sum + (parseFloat(e.credit) || 0), 0)
  const balance = totalDebit - totalCredit

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Contabilidade</h1>
        <Button onClick={() => router.push('/dashboard/accounting/new')}><Plus className="mr-2 h-4 w-4" /> Novo Lançamento</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100"><ArrowUpRight className="h-5 w-5 text-green-600" /></div>
            <div>
              <p className="text-sm text-gray-500">Total Débito</p>
              <p className="text-lg font-bold text-gray-900">{formatKwanza(totalDebit)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100"><ArrowDownRight className="h-5 w-5 text-red-600" /></div>
            <div>
              <p className="text-sm text-gray-500">Total Crédito</p>
              <p className="text-lg font-bold text-gray-900">{formatKwanza(totalCredit)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100"><Minus className="h-5 w-5 text-blue-600" /></div>
            <div>
              <p className="text-sm text-gray-500">Saldo</p>
              <p className="text-lg font-bold text-gray-900">{formatKwanza(balance)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <select className="rounded-md border px-3 py-2 text-sm" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">Todas as categorias</option>
          {Object.entries(CATEGORY_LABEL).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
        </select>
        <select className="rounded-md border px-3 py-2 text-sm" value={reconciledFilter} onChange={(e) => setReconciledFilter(e.target.value)}>
          <option value="">Todos</option>
          <option value="true">Reconciliado</option>
          <option value="false">Não Reconciliado</option>
        </select>
      </div>

      {isLoading ? <p className="text-gray-500">A carregar...</p> : (
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Data</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Descrição</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Conta</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Débito</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Crédito</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Categoria</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase text-gray-500">Reconciliado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {entries.map((e: any) => (
                <tr key={e.id} className="cursor-pointer hover:bg-gray-50" onClick={() => router.push(`/dashboard/accounting/${e.id}`)}>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{e.date ? formatDate(e.date) : '—'}</td>
                  <td className="px-4 py-3 text-sm font-medium">{e.description}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{e.account ?? e.accountName ?? '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm">{e.debit ? formatKwanza(e.debit) : '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm">{e.credit ? formatKwanza(e.credit) : '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{CATEGORY_LABEL[e.category] ?? e.category ?? '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-center text-sm">
                    {e.reconciled ? <CheckCircle className="mx-auto h-4 w-4 text-green-500" /> : <Circle className="mx-auto h-4 w-4 text-gray-300" />}
                  </td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-500">Nenhum lançamento registado</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
