'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Trash2, Save, Loader2 } from 'lucide-react'
import api from '@/lib/api'
import { formatKwanza } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

// ─── Constants ────────────────────────────────────────────────────────────────

const ROOM_TYPES = [
  { value: 'STANDARD', label: 'Standard' },
  { value: 'DELUXE', label: 'Deluxe' },
  { value: 'SUITE', label: 'Suite' },
  { value: 'VILLA', label: 'Villa' },
  { value: 'PRESIDENTIAL', label: 'Presidential' },
]

const EXTRAS = [
  { key: 'includesBreakfast', label: 'Pequeno-almoço incluso' },
  { key: 'includesLunch', label: 'Almoço incluso' },
  { key: 'includesDinner', label: 'Jantar incluso' },
  { key: 'includesTransfer', label: 'Transfer incluído' },
]

// ─── Types ────────────────────────────────────────────────────────────────────

interface TariffForm {
  name: string
  roomType: string
  pricePerNight: string
  minStay: string
  maxStay: string
  validFrom: string
  validUntil: string
  active: boolean
  description: string
  includesBreakfast: boolean
  includesLunch: boolean
  includesDinner: boolean
  includesTransfer: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toInputDate(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  return new Date(dateStr).toISOString().split('T')[0]
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TariffDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()

  const [form, setForm] = useState<TariffForm>({
    name: '',
    roomType: 'STANDARD',
    pricePerNight: '',
    minStay: '1',
    maxStay: '',
    validFrom: '',
    validUntil: '',
    active: true,
    description: '',
    includesBreakfast: false,
    includesLunch: false,
    includesDinner: false,
    includesTransfer: false,
  })
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // ── Fetch tariff ────────────────────────────────────────────────────────────
  const { data, isLoading, isError } = useQuery({
    queryKey: ['tariff', id],
    queryFn: () => api.get(`/tariffs/${id}`).then((r) => r.data),
    enabled: !!id,
  })

  const tariff = data?.data ?? data

  // ── Populate form when data arrives ─────────────────────────────────────────
  useEffect(() => {
    if (!tariff) return
    setForm({
      name: tariff.name ?? '',
      roomType: tariff.roomType ?? 'STANDARD',
      pricePerNight: tariff.pricePerNight != null ? String(tariff.pricePerNight) : '',
      minStay: tariff.minStay != null ? String(tariff.minStay) : '1',
      maxStay: tariff.maxStay != null ? String(tariff.maxStay) : '',
      validFrom: toInputDate(tariff.validFrom),
      validUntil: toInputDate(tariff.validUntil),
      active: tariff.active ?? true,
      description: tariff.description ?? tariff.notes ?? '',
      includesBreakfast: tariff.includesBreakfast ?? false,
      includesLunch: tariff.includesLunch ?? false,
      includesDinner: tariff.includesDinner ?? false,
      includesTransfer: tariff.includesTransfer ?? false,
    })
  }, [tariff])

  // ── Save mutation ─────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: () =>
      api.patch(`/tariffs/${id}`, {
        name: form.name,
        roomType: form.roomType,
        pricePerNight: parseFloat(form.pricePerNight),
        minStay: form.minStay ? parseInt(form.minStay) : 1,
        maxStay: form.maxStay ? parseInt(form.maxStay) : null,
        validFrom: form.validFrom || null,
        validUntil: form.validUntil || null,
        active: form.active,
        description: form.description || null,
        includesBreakfast: form.includesBreakfast,
        includesLunch: form.includesLunch,
        includesDinner: form.includesDinner,
        includesTransfer: form.includesTransfer,
      }),
    onSuccess: () => {
      setSaveSuccess(true)
      setSaveError('')
      queryClient.invalidateQueries({ queryKey: ['tariffs'] })
      queryClient.invalidateQueries({ queryKey: ['tariff', id] })
      setTimeout(() => setSaveSuccess(false), 3000)
    },
    onError: (err: any) => {
      setSaveError(err.response?.data?.message ?? err.response?.data?.error ?? 'Erro ao guardar a tarifa')
    },
  })

  // ── Delete mutation ───────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/tariffs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tariffs'] })
      router.push('/dashboard/tariffs')
    },
    onError: (err: any) => {
      setSaveError(err.response?.data?.message ?? err.response?.data?.error ?? 'Erro ao eliminar a tarifa')
      setShowDeleteConfirm(false)
    },
  })

  const handleChange = (key: keyof TariffForm, value: string | boolean) => {
    setSaveSuccess(false)
    setSaveError('')
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  // ── Loading / error states ────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2 text-sm text-gray-500">A carregar tarifa...</span>
      </div>
    )
  }

  if (isError || (!isLoading && !tariff)) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard/tariffs" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-4 w-4" /> Voltar às tarifas
        </Link>
        <p className="text-red-600">Tarifa não encontrada.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/dashboard/tariffs"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary transition-colors shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
            Tarifas
          </Link>
          <span className="text-gray-300">/</span>
          <h1 className="truncate text-xl font-bold text-gray-900">
            Tarifa: {tariff.name}
          </h1>
        </div>

        {/* Price preview */}
        {form.pricePerNight && (
          <span className="shrink-0 text-sm font-semibold text-primary">
            {formatKwanza(parseFloat(form.pricePerNight))} / noite
          </span>
        )}
      </div>

      {/* Feedback banners */}
      {saveSuccess && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Tarifa guardada com sucesso.
        </div>
      )}
      {saveError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {saveError}
        </div>
      )}

      {/* Form card */}
      <Card className="mx-auto max-w-2xl p-6">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            saveMutation.mutate()
          }}
          className="space-y-5"
        >
          {/* Nome */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Nome <span className="text-red-500">*</span>
            </label>
            <Input
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Ex: Tarifa Alta Temporada Standard"
              required
            />
          </div>

          {/* Tipo de Quarto */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Tipo de Quarto <span className="text-red-500">*</span>
            </label>
            <select
              value={form.roomType}
              onChange={(e) => handleChange('roomType', e.target.value)}
              className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              required
            >
              {ROOM_TYPES.map((rt) => (
                <option key={rt.value} value={rt.value}>
                  {rt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Preço por Noite */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Preço por Noite (AOA) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500">
                Kz
              </span>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.pricePerNight}
                onChange={(e) => handleChange('pricePerNight', e.target.value)}
                className="pl-9"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          {/* Min / Max Estadia */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Estadia Mínima (noites)
              </label>
              <Input
                type="number"
                min={1}
                step={1}
                value={form.minStay}
                onChange={(e) => handleChange('minStay', e.target.value)}
                placeholder="1"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Estadia Máxima (noites)
              </label>
              <Input
                type="number"
                min={1}
                step={1}
                value={form.maxStay}
                onChange={(e) => handleChange('maxStay', e.target.value)}
                placeholder="Sem limite"
              />
            </div>
          </div>

          {/* Validade */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Validade De
              </label>
              <Input
                type="date"
                value={form.validFrom}
                onChange={(e) => handleChange('validFrom', e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Validade Até
              </label>
              <Input
                type="date"
                value={form.validUntil}
                onChange={(e) => handleChange('validUntil', e.target.value)}
              />
            </div>
          </div>

          {/* Activa */}
          <div className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3">
            <input
              id="tariff-active"
              type="checkbox"
              checked={form.active}
              onChange={(e) => handleChange('active', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary accent-primary"
            />
            <label htmlFor="tariff-active" className="cursor-pointer text-sm font-medium text-gray-700">
              Tarifa activa
            </label>
            <span className="ml-auto text-xs text-gray-400">
              {form.active ? 'Visível para reservas' : 'Desactivada'}
            </span>
          </div>

          {/* Extras */}
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">Extras incluídos</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {EXTRAS.map((extra) => (
                <label
                  key={extra.key}
                  className="flex cursor-pointer items-center gap-2.5 rounded-md border border-gray-200 px-3 py-2.5 text-sm hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={form[extra.key as keyof TariffForm] as boolean}
                    onChange={(e) => handleChange(extra.key as keyof TariffForm, e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 accent-primary"
                  />
                  {extra.label}
                </label>
              ))}
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Descrição / Notas
            </label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              placeholder="Observações ou condições especiais desta tarifa..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between border-t border-gray-100 pt-4">
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              Eliminar
            </Button>

            <div className="flex gap-3">
              <Link href="/dashboard/tariffs">
                <Button type="button" variant="outline" size="sm">
                  Cancelar
                </Button>
              </Link>
              <Button
                type="submit"
                size="sm"
                disabled={saveMutation.isPending || !form.name || !form.pricePerNight}
              >
                {saveMutation.isPending ? (
                  <>
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    A guardar...
                  </>
                ) : (
                  <>
                    <Save className="mr-1.5 h-4 w-4" />
                    Guardar Alterações
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </Card>

      {/* Delete confirm dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-sm p-6">
            <h2 className="text-base font-semibold text-gray-900">Eliminar Tarifa</h2>
            <p className="mt-2 text-sm text-gray-600">
              Tem a certeza que pretende eliminar a tarifa{' '}
              <strong>"{tariff.name}"</strong>? Esta acção não pode ser revertida.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleteMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    A eliminar...
                  </>
                ) : (
                  'Confirmar Eliminação'
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
