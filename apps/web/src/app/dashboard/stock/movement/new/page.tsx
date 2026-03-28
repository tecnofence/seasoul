'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery, useMutation } from '@tanstack/react-query'
import { ArrowLeft, ArrowDownToLine, ArrowUpFromLine, SlidersHorizontal, Loader2 } from 'lucide-react'
import api from '@/lib/api'
import { formatKwanza } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

// ─── Constants ────────────────────────────────────────────────────────────────

const MOVEMENT_TYPES = [
  {
    value: 'IN',
    label: 'Entrada',
    icon: ArrowDownToLine,
    color: 'border-green-400 bg-green-50 text-green-700',
    activeColor: 'border-green-500 bg-green-100 text-green-800 ring-2 ring-green-300',
    title: 'Nova Entrada de Stock',
  },
  {
    value: 'OUT',
    label: 'Saída',
    icon: ArrowUpFromLine,
    color: 'border-red-300 bg-red-50 text-red-700',
    activeColor: 'border-red-500 bg-red-100 text-red-800 ring-2 ring-red-300',
    title: 'Nova Saída de Stock',
  },
  {
    value: 'ADJUSTMENT',
    label: 'Ajuste',
    icon: SlidersHorizontal,
    color: 'border-amber-300 bg-amber-50 text-amber-700',
    activeColor: 'border-amber-500 bg-amber-100 text-amber-800 ring-2 ring-amber-300',
    title: 'Ajuste de Stock',
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewStockMovementPage() {
  const router = useRouter()

  const [movementType, setMovementType] = useState<'IN' | 'OUT' | 'ADJUSTMENT'>('IN')
  const [stockItemId, setStockItemId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unitPrice, setUnitPrice] = useState('')
  const [supplierId, setSupplierId] = useState('')
  const [notes, setNotes] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [formError, setFormError] = useState('')

  // ── Fetch stock items ────────────────────────────────────────────────────
  const { data: stockData } = useQuery({
    queryKey: ['stock-items-select'],
    queryFn: () => api.get('/stock', { params: { limit: 100 } }).then((r) => r.data),
  })
  const stockItems: any[] = stockData?.data ?? []

  // ── Fetch suppliers ──────────────────────────────────────────────────────
  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers-select'],
    queryFn: () => api.get('/suppliers', { params: { limit: 50 } }).then((r) => r.data),
  })
  const suppliers: any[] = suppliersData?.data ?? []

  // ── Selected item info ───────────────────────────────────────────────────
  const selectedItem = useMemo(
    () => stockItems.find((i) => i.id === stockItemId),
    [stockItems, stockItemId],
  )

  // ── Create mutation ──────────────────────────────────────────────────────
  const mutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api.post('/stock/movement', body),
    onSuccess: () => router.push('/dashboard/stock'),
    onError: (err: any) => {
      setFormError(
        err.response?.data?.message ??
          err.response?.data?.error ??
          'Erro ao registar movimento de stock',
      )
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    const needsReason = movementType === 'OUT' || movementType === 'ADJUSTMENT'
    if (needsReason && !notes.trim()) {
      setFormError('O campo Motivo/Notas é obrigatório para Saídas e Ajustes.')
      return
    }

    mutation.mutate({
      stockItemId,
      type: movementType,
      quantity: parseFloat(quantity),
      unitPrice: unitPrice ? parseFloat(unitPrice) : undefined,
      supplierId: supplierId || undefined,
      notes: notes.trim() || undefined,
      date,
    })
  }

  const currentType = MOVEMENT_TYPES.find((t) => t.value === movementType)!
  const needsReason = movementType === 'OUT' || movementType === 'ADJUSTMENT'
  const showSupplier = movementType === 'IN'
  const showUnitPrice = movementType === 'IN'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/stock"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Stock
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-gray-900">{currentType.title}</h1>
      </div>

      <Card className="mx-auto max-w-xl p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {formError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {formError}
            </div>
          )}

          {/* Tipo de Movimento — large toggle */}
          <div>
            <p className="mb-2.5 text-sm font-medium text-gray-700">
              Tipo de Movimento <span className="text-red-500">*</span>
            </p>
            <div className="grid grid-cols-3 gap-3">
              {MOVEMENT_TYPES.map((mt) => {
                const Icon = mt.icon
                const isActive = movementType === mt.value
                return (
                  <button
                    key={mt.value}
                    type="button"
                    onClick={() => {
                      setMovementType(mt.value as typeof movementType)
                      setFormError('')
                    }}
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 px-3 py-4 font-medium transition-all ${
                      isActive ? mt.activeColor : mt.color + ' hover:opacity-80'
                    }`}
                  >
                    <Icon className="h-6 w-6" />
                    <span className="text-sm">{mt.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Produto */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Produto <span className="text-red-500">*</span>
            </label>
            <select
              value={stockItemId}
              onChange={(e) => setStockItemId(e.target.value)}
              required
              className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Seleccionar produto...</option>
              {stockItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                  {item.sku ? ` (${item.sku})` : ''}
                  {' — '}
                  {item.quantity} {item.unit ?? 'un'}
                </option>
              ))}
            </select>

            {/* Current stock level */}
            {selectedItem && (
              <div className="mt-2 flex items-center gap-2 rounded-md bg-primary/5 px-3 py-2 text-sm">
                <span className="text-gray-500">Stock actual:</span>
                <span
                  className={`font-semibold ${
                    parseFloat(selectedItem.quantity) <= parseFloat(selectedItem.minStock ?? 0)
                      ? 'text-red-600'
                      : 'text-primary'
                  }`}
                >
                  {selectedItem.quantity} {selectedItem.unit ?? 'un'}
                </span>
                {selectedItem.minStock != null && (
                  <span className="ml-auto text-xs text-gray-400">
                    mín: {selectedItem.minStock} {selectedItem.unit ?? 'un'}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Quantidade */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Quantidade <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              min={0.001}
              step="0.001"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0"
              required
            />
          </div>

          {/* Preço Unitário (só para ENTRADA) */}
          {showUnitPrice && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Preço Unitário (AOA)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500">
                  Kz
                </span>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  className="pl-9"
                  placeholder="0.00"
                />
              </div>
              {unitPrice && quantity && (
                <p className="mt-1 text-right text-xs text-gray-500">
                  Total:{' '}
                  <span className="font-medium text-primary">
                    {formatKwanza(parseFloat(unitPrice) * parseFloat(quantity))}
                  </span>
                </p>
              )}
            </div>
          )}

          {/* Fornecedor (só para ENTRADA) */}
          {showSupplier && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Fornecedor
              </label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Sem fornecedor</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Motivo / Notas */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Motivo / Notas{' '}
              {needsReason && <span className="text-red-500">*</span>}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              required={needsReason}
              placeholder={
                movementType === 'IN'
                  ? 'Ex: Recepção de encomenda semanal...'
                  : movementType === 'OUT'
                    ? 'Ex: Consumo restaurante, data do turno...'
                    : 'Ex: Contagem de inventário — correcção de diferença...'
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>

          {/* Data */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Data do Movimento
            </label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-48"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
            <Link href="/dashboard/stock">
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={mutation.isPending || !stockItemId || !quantity}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  A registar...
                </>
              ) : (
                currentType.title
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
