'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery, useMutation } from '@tanstack/react-query'
import { ArrowLeft, Plus, X, Loader2 } from 'lucide-react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

// ─── Constants ────────────────────────────────────────────────────────────────

const ORDER_TYPES = [
  { value: 'FOOD', label: 'Alimentação', emoji: '🍽️' },
  { value: 'CLEANING', label: 'Limpeza', emoji: '🧹' },
  { value: 'MAINTENANCE', label: 'Manutenção', emoji: '🔧' },
  { value: 'AMENITIES', label: 'Amenidades', emoji: '🛁' },
  { value: 'OTHER', label: 'Outro', emoji: '📋' },
]

const PRIORITIES = [
  { value: 'URGENT', label: 'Urgente', color: 'border-red-400 bg-red-50 text-red-700', dot: 'bg-red-500 animate-pulse' },
  { value: 'HIGH', label: 'Alta', color: 'border-orange-300 bg-orange-50 text-orange-700', dot: 'bg-orange-400' },
  { value: 'NORMAL', label: 'Normal', color: 'border-blue-300 bg-blue-50 text-blue-700', dot: 'bg-blue-400' },
  { value: 'LOW', label: 'Baixa', color: 'border-gray-300 bg-gray-50 text-gray-600', dot: 'bg-gray-400' },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewServiceOrderPage() {
  const router = useRouter()

  const [type, setType] = useState('FOOD')
  const [roomId, setRoomId] = useState('')
  const [priority, setPriority] = useState('NORMAL')
  const [description, setDescription] = useState('')
  const [preferredTime, setPreferredTime] = useState('')
  const [internalNotes, setInternalNotes] = useState('')
  const [foodItems, setFoodItems] = useState<string[]>([''])
  const [formError, setFormError] = useState('')

  // ── Fetch rooms ──────────────────────────────────────────────────────────
  const { data: roomsData } = useQuery({
    queryKey: ['rooms-select'],
    queryFn: () => api.get('/rooms', { params: { limit: 100 } }).then((r) => r.data),
  })
  const rooms: any[] = roomsData?.data ?? []

  // ── Create mutation ──────────────────────────────────────────────────────
  const mutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post('/service-orders', body),
    onSuccess: () => router.push('/dashboard/service-orders'),
    onError: (err: any) => {
      setFormError(err.response?.data?.message ?? err.response?.data?.error ?? 'Erro ao criar ordem de serviço')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (description.trim().length < 10) {
      setFormError('A descrição deve ter pelo menos 10 caracteres.')
      return
    }

    const items = type === 'FOOD' ? foodItems.filter((i) => i.trim()) : undefined

    mutation.mutate({
      type,
      roomId: roomId || undefined,
      priority,
      description: description.trim(),
      items,
      preferredTime: preferredTime || undefined,
      internalNotes: internalNotes.trim() || undefined,
    })
  }

  // ── Food items helpers ───────────────────────────────────────────────────
  const addFoodItem = () => setFoodItems((prev) => [...prev, ''])
  const removeFoodItem = (idx: number) =>
    setFoodItems((prev) => prev.filter((_, i) => i !== idx))
  const updateFoodItem = (idx: number, value: string) =>
    setFoodItems((prev) => prev.map((item, i) => (i === idx ? value : item)))

  const selectedType = ORDER_TYPES.find((t) => t.value === type)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/service-orders"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Ordens de Serviço
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-gray-900">Nova Ordem de Serviço</h1>
      </div>

      {/* Form */}
      <Card className="mx-auto max-w-2xl p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {formError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {formError}
            </div>
          )}

          {/* Tipo */}
          <div>
            <p className="mb-2.5 text-sm font-medium text-gray-700">
              Tipo <span className="text-red-500">*</span>
            </p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {ORDER_TYPES.map((ot) => (
                <button
                  key={ot.value}
                  type="button"
                  onClick={() => setType(ot.value)}
                  className={`flex flex-col items-center gap-1.5 rounded-lg border-2 px-3 py-3 text-xs font-medium transition-all ${
                    type === ot.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-xl">{ot.emoji}</span>
                  {ot.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quarto */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Quarto
            </label>
            <select
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Sem quarto específico</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  Quarto {room.number}
                  {room.type ? ` — ${room.type}` : ''}
                  {room.floor ? ` (Piso ${room.floor})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Prioridade */}
          <div>
            <p className="mb-2.5 text-sm font-medium text-gray-700">
              Prioridade <span className="text-red-500">*</span>
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {PRIORITIES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPriority(p.value)}
                  className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2.5 text-sm font-medium transition-all ${
                    priority === p.value
                      ? p.color + ' border-current'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full shrink-0 ${priority === p.value ? p.dot : 'bg-gray-300'}`} />
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Descrição <span className="text-red-500">*</span>
              <span className="ml-1 font-normal text-gray-400">(mín. 10 caracteres)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              required
              minLength={10}
              placeholder={
                selectedType
                  ? `Descreva a ordem de ${selectedType.label.toLowerCase()}...`
                  : 'Descreva a ordem de serviço...'
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
            <p className={`mt-1 text-right text-xs ${description.length < 10 && description.length > 0 ? 'text-red-500' : 'text-gray-400'}`}>
              {description.length} / 10 min.
            </p>
          </div>

          {/* Itens de comida (só para FOOD) */}
          {type === 'FOOD' && (
            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">Itens solicitados</p>
              <div className="space-y-2">
                {foodItems.map((item, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Input
                      value={item}
                      onChange={(e) => updateFoodItem(idx, e.target.value)}
                      placeholder={`Item ${idx + 1} (ex: Sumo de laranja, Sandes mista)`}
                    />
                    {foodItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeFoodItem(idx)}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-gray-200 text-gray-400 hover:border-red-300 hover:bg-red-50 hover:text-red-500 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addFoodItem}
                className="mt-2 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <Plus className="h-4 w-4" />
                Adicionar item
              </button>
            </div>
          )}

          {/* Hora pretendida */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Hora pretendida
            </label>
            <Input
              type="time"
              value={preferredTime}
              onChange={(e) => setPreferredTime(e.target.value)}
              className="w-40"
            />
          </div>

          {/* Notas internas */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Notas internas
            </label>
            <textarea
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              rows={2}
              placeholder="Informações internas para a equipa (não visíveis pelo hóspede)..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
            <Link href="/dashboard/service-orders">
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={mutation.isPending || !description || description.trim().length < 10}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  A criar...
                </>
              ) : (
                <>
                  <Plus className="mr-1.5 h-4 w-4" />
                  Criar Ordem de Serviço
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
