'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatKwanza, formatDateTime } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardTitle, CardContent } from '@/components/ui/card'
import { ArrowLeft, Pencil, Store, ShoppingBag } from 'lucide-react'

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Ativa' },
  { value: 'INACTIVE', label: 'Inativa' },
  { value: 'TEMPORARILY_CLOSED', label: 'Temporariamente Fechada' },
]

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-red-100 text-red-800',
  TEMPORARILY_CLOSED: 'bg-amber-100 text-amber-800',
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Ativa',
  INACTIVE: 'Inativa',
  TEMPORARILY_CLOSED: 'Temporariamente Fechada',
}

const PAYMENT_LABELS: Record<string, string> = {
  CASH: 'Dinheiro',
  CARD: 'Cartão',
  TRANSFER: 'Transferência',
  MULTICAIXA: 'Multicaixa',
}

export default function RetailStoreDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()

  const [editing, setEditing] = useState(false)
  const [editError, setEditError] = useState('')

  // Campos do formulário de edição
  const [editName, setEditName] = useState('')
  const [editLocation, setEditLocation] = useState('')
  const [editManager, setEditManager] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editStatus, setEditStatus] = useState('ACTIVE')
  const [editOpeningHours, setEditOpeningHours] = useState('')
  const [editNotes, setEditNotes] = useState('')

  const { data: store, isLoading, isError } = useQuery({
    queryKey: ['retail-store', id],
    queryFn: () => api.get(`/retail/stores/${id}`).then((r) => r.data.data ?? r.data),
    enabled: !!id,
  })

  const { data: salesData, isLoading: loadingSales } = useQuery({
    queryKey: ['retail-store-sales', id],
    queryFn: () =>
      api
        .get('/retail/sales', { params: { storeId: id, limit: 20 } })
        .then((r) => r.data.data ?? r.data),
    enabled: !!id,
  })

  const sales: any[] = Array.isArray(salesData)
    ? salesData
    : (salesData?.items ?? salesData?.sales ?? [])

  const updateMutation = useMutation({
    mutationFn: () =>
      api.patch(`/retail/stores/${id}`, {
        name: editName || undefined,
        location: editLocation || undefined,
        manager: editManager || undefined,
        phone: editPhone || undefined,
        email: editEmail || undefined,
        status: editStatus || undefined,
        openingHours: editOpeningHours || undefined,
        notes: editNotes || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['retail-store', id] })
      setEditing(false)
      setEditError('')
    },
    onError: (err: any) => {
      setEditError(err.response?.data?.error || 'Erro ao atualizar loja')
    },
  })

  function startEdit() {
    if (!store) return
    setEditName(store.name ?? '')
    setEditLocation(store.location ?? '')
    setEditManager(store.manager ?? '')
    setEditPhone(store.phone ?? '')
    setEditEmail(store.email ?? '')
    setEditStatus(store.status ?? 'ACTIVE')
    setEditOpeningHours(store.openingHours ?? '')
    setEditNotes(store.notes ?? '')
    setEditError('')
    setEditing(true)
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (isError || !store) {
    return (
      <div className="py-20 text-center">
        <p className="text-gray-500">Loja não encontrada.</p>
        <Button variant="secondary" className="mt-4" onClick={() => router.back()}>
          Voltar
        </Button>
      </div>
    )
  }

  const currentStatus: string = store.status ?? 'ACTIVE'
  const statusColor = STATUS_COLORS[currentStatus] ?? 'bg-gray-100 text-gray-800'
  const statusLabel = STATUS_LABELS[currentStatus] ?? currentStatus

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/retail"
            className="rounded-md p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Store className="h-6 w-6 text-primary" />
              {store.name}
            </h1>
            {store.location && (
              <p className="text-sm text-gray-500">{store.location}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${statusColor}`}
          >
            {statusLabel}
          </span>
          {!editing && (
            <Button size="sm" variant="secondary" onClick={startEdit}>
              <Pencil className="mr-1 h-4 w-4" />
              Editar
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Informações / Formulário de edição */}
        <Card>
          <CardTitle>Informações da Loja</CardTitle>
          <CardContent>
            {editing ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  updateMutation.mutate()
                }}
                className="mt-4 space-y-4"
              >
                {editError && (
                  <p className="rounded bg-red-50 p-3 text-sm text-red-600">{editError}</p>
                )}

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Nome da Loja
                  </label>
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Localização
                    </label>
                    <Input value={editLocation} onChange={(e) => setEditLocation(e.target.value)} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Responsável
                    </label>
                    <Input value={editManager} onChange={(e) => setEditManager(e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Telefone
                    </label>
                    <Input type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <Input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Estado
                    </label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Horário
                    </label>
                    <Input
                      value={editOpeningHours}
                      onChange={(e) => setEditOpeningHours(e.target.value)}
                      placeholder="08:00-20:00"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Notas
                  </label>
                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? 'A guardar...' : 'Guardar'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setEditing(false)
                      setEditError('')
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            ) : (
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between border-b border-gray-100 pb-2">
                  <dt className="text-gray-500">Nome</dt>
                  <dd className="font-medium">{store.name}</dd>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-2">
                  <dt className="text-gray-500">Localização</dt>
                  <dd className="font-medium">{store.location ?? '—'}</dd>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-2">
                  <dt className="text-gray-500">Responsável</dt>
                  <dd className="font-medium">{store.manager ?? '—'}</dd>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-2">
                  <dt className="text-gray-500">Telefone</dt>
                  <dd className="font-medium">{store.phone ?? '—'}</dd>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-2">
                  <dt className="text-gray-500">Email</dt>
                  <dd className="font-medium">{store.email ?? '—'}</dd>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-2">
                  <dt className="text-gray-500">Horário</dt>
                  <dd className="font-medium">{store.openingHours ?? '—'}</dd>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-2">
                  <dt className="text-gray-500">Estado</dt>
                  <dd>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColor}`}
                    >
                      {statusLabel}
                    </span>
                  </dd>
                </div>
                {store.notes && (
                  <div>
                    <dt className="mb-1 text-gray-500">Notas</dt>
                    <dd className="whitespace-pre-wrap text-gray-700">{store.notes}</dd>
                  </div>
                )}
              </dl>
            )}
          </CardContent>
        </Card>

        {/* Vendas desta loja */}
        <Card>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            Vendas desta Loja
          </CardTitle>
          <CardContent>
            {loadingSales ? (
              <div className="mt-4 flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : sales.length === 0 ? (
              <p className="mt-4 text-sm text-gray-500">Sem vendas registadas para esta loja.</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase text-gray-500">
                      <th className="pb-2 pr-4">Data</th>
                      <th className="pb-2 pr-4">Cliente</th>
                      <th className="pb-2 pr-4">Pagamento</th>
                      <th className="pb-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sales.map((sale: any, index: number) => (
                      <tr key={sale.id ?? index} className="hover:bg-gray-50">
                        <td className="py-2 pr-4 text-gray-600">
                          {sale.date || sale.createdAt
                            ? formatDateTime(sale.date ?? sale.createdAt)
                            : '—'}
                        </td>
                        <td className="py-2 pr-4 font-medium">
                          {sale.clientName ?? sale.client?.name ?? 'Sem nome'}
                        </td>
                        <td className="py-2 pr-4 text-gray-600">
                          {PAYMENT_LABELS[sale.paymentMethod ?? ''] ?? sale.paymentMethod ?? '—'}
                        </td>
                        <td className="py-2 text-right font-medium text-primary">
                          {sale.total != null ? formatKwanza(sale.total) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
