'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatDateTime } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardTitle, CardContent } from '@/components/ui/card'
import { StatCard } from '@/components/ui/stat-card'
import {
  Key,
  Trash2,
  Lock,
  Unlock,
  Shield,
  ShieldAlert,
  Search,
  RefreshCw,
} from 'lucide-react'

// ─── Constants ───────────────────────────────────────────────────────────────

const LOCK_STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  LOCKED: 'success',
  UNLOCKED: 'warning',
  OFFLINE: 'danger',
  FAULT: 'danger',
  UNKNOWN: 'default',
}

const LOCK_STATUS_LABEL: Record<string, string> = {
  LOCKED: 'Bloqueada',
  UNLOCKED: 'Desbloqueada',
  OFFLINE: 'Offline',
  FAULT: 'Avaria',
  UNKNOWN: 'Desconhecido',
}

const PIN_STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  ACTIVE: 'success',
  EXPIRED: 'danger',
  REVOKED: 'danger',
  NONE: 'default',
}

const PIN_STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Ativo',
  EXPIRED: 'Expirado',
  REVOKED: 'Revogado',
  NONE: 'Sem PIN',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isPinExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false
  return new Date(expiresAt) < new Date()
}

function pinStatus(room: any): string {
  if (!room.activePin && !room.pin) return 'NONE'
  const exp = room.pinExpiresAt ?? room.activePin?.expiresAt
  if (exp && isPinExpired(exp)) return 'EXPIRED'
  return 'ACTIVE'
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function LocksPage() {
  const queryClient = useQueryClient()
  const [reservationId, setReservationId] = useState('')
  const [generateError, setGenerateError] = useState('')
  const [generateSuccess, setGenerateSuccess] = useState('')
  const [roomFilter, setRoomFilter] = useState('')

  // ── Fetch all rooms with lock data
  const { data: rooms = [], isLoading, refetch } = useQuery({
    queryKey: ['locks'],
    queryFn: () => api.get('/locks').then((r) => r.data.data ?? r.data ?? []),
  })

  // ── Generate PIN mutation
  const generatePinMutation = useMutation({
    mutationFn: (resId: string) => api.post('/locks/pin', { reservationId: resId }),
    onSuccess: (res) => {
      const pin = res.data?.data?.pin ?? res.data?.pin
      queryClient.invalidateQueries({ queryKey: ['locks'] })
      setReservationId('')
      setGenerateError('')
      setGenerateSuccess(pin ? `PIN gerado: ${pin}` : 'PIN gerado com sucesso!')
      setTimeout(() => setGenerateSuccess(''), 5000)
    },
    onError: (err: any) => {
      setGenerateError(err.response?.data?.error || 'Erro ao gerar PIN')
    },
  })

  // ── Revoke PIN mutation
  const revokePinMutation = useMutation({
    mutationFn: (resId: string) => api.delete(`/locks/pin/${resId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['locks'] }),
    onError: (err: any) => {
      alert(err.response?.data?.error || 'Erro ao revogar PIN')
    },
  })

  // ── Quick generate PIN from table row
  function handleGenerateFromRow(reservationId: string) {
    setReservationId(reservationId)
    generatePinMutation.mutate(reservationId)
  }

  function handleRevoke(resId: string) {
    if (confirm('Revogar o PIN desta reserva? O hóspede perderá o acesso.')) {
      revokePinMutation.mutate(resId)
    }
  }

  // ── Stats
  const total = rooms.length
  const active = rooms.filter((r: any) => r.lockStatus === 'LOCKED' || r.lockStatus === 'UNLOCKED').length
  const withPin = rooms.filter((r: any) => pinStatus(r) === 'ACTIVE').length
  const expired = rooms.filter((r: any) => pinStatus(r) === 'EXPIRED').length

  // ── Filter
  const filteredRooms = rooms.filter((r: any) => {
    if (!roomFilter) return true
    return String(r.number ?? r.roomNumber ?? '').toLowerCase().includes(roomFilter.toLowerCase())
  })

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Smart Locks & PINs de Acesso</h1>
          <p className="text-sm text-gray-500">Gestão de fechaduras inteligentes e códigos de acesso</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Atualizar
        </Button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Total Fechaduras"
          value={total}
          icon={<Lock className="h-5 w-5" />}
        />
        <StatCard
          title="Ativas"
          value={active}
          icon={<Shield className="h-5 w-5" />}
        />
        <StatCard
          title="Com PIN Gerado"
          value={withPin}
          icon={<Key className="h-5 w-5" />}
        />
        <StatCard
          title="PINs Expirados"
          value={expired}
          icon={<ShieldAlert className="h-5 w-5" />}
        />
      </div>

      {/* ── Generate PIN panel ── */}
      <Card>
        <CardTitle className="mb-4">Gerar PIN de Acesso</CardTitle>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                ID da Reserva
              </label>
              <input
                type="text"
                value={reservationId}
                onChange={(e) => setReservationId(e.target.value)}
                placeholder="Introduza o ID da reserva"
                className="w-full rounded-md border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <Button
              onClick={() => generatePinMutation.mutate(reservationId)}
              disabled={!reservationId.trim() || generatePinMutation.isPending}
            >
              <Key className="mr-2 h-4 w-4" />
              {generatePinMutation.isPending ? 'A gerar...' : 'Gerar PIN'}
            </Button>
          </div>
          {generateError && (
            <p className="mt-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {generateError}
            </p>
          )}
          {generateSuccess && (
            <p className="mt-2 rounded-md bg-green-50 px-3 py-2 text-sm font-medium text-green-700">
              {generateSuccess}
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── Locks table ── */}
      <Card className="p-0">
        <div className="flex flex-col gap-3 border-b px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Quartos com Smart Lock</CardTitle>
          {/* Room filter */}
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Filtrar por quarto..."
              value={roomFilter}
              onChange={(e) => setRoomFilter(e.target.value)}
              className="w-full rounded-md border bg-white py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-40 items-center justify-center text-gray-400">
            A carregar fechaduras...
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center gap-2 text-gray-400">
            <Lock className="h-10 w-10 text-gray-300" />
            <p className="text-sm">
              {roomFilter ? 'Nenhum quarto encontrado' : 'Nenhuma fechadura registada'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left">
                  <th className="px-6 py-3 font-medium text-gray-500">Quarto</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Hóspede</th>
                  <th className="px-6 py-3 font-medium text-gray-500">PIN</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Gerado em</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Expira</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Estado Lock</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Estado PIN</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredRooms.map((room: any) => {
                  const ps = pinStatus(room)
                  const pin = room.activePin?.pin ?? room.pin
                  const pinCreatedAt = room.activePin?.createdAt ?? room.pinCreatedAt
                  const pinExpiresAt = room.pinExpiresAt ?? room.activePin?.expiresAt
                  const guestName =
                    room.currentGuest?.name ??
                    room.activeReservation?.guest?.name ??
                    room.guestName ??
                    null
                  const activeResId =
                    room.activeReservationId ??
                    room.activeReservation?.id ??
                    null

                  return (
                    <tr key={room.id} className="hover:bg-gray-50">
                      {/* Quarto */}
                      <td className="px-6 py-3">
                        <span className="font-semibold text-gray-900">
                          #{room.number ?? room.roomNumber}
                        </span>
                        {room.type && (
                          <span className="ml-1 text-xs text-gray-400">{room.type}</span>
                        )}
                      </td>

                      {/* Hóspede */}
                      <td className="px-6 py-3 text-gray-600">
                        {guestName ?? <span className="text-gray-300">—</span>}
                      </td>

                      {/* PIN */}
                      <td className="px-6 py-3">
                        {pin ? (
                          <span className="rounded bg-gray-100 px-2 py-1 font-mono font-semibold tracking-widest text-gray-800">
                            {pin}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>

                      {/* Gerado em */}
                      <td className="px-6 py-3 text-gray-500">
                        {pinCreatedAt ? formatDateTime(pinCreatedAt) : <span className="text-gray-300">—</span>}
                      </td>

                      {/* Expira */}
                      <td className="px-6 py-3">
                        {pinExpiresAt ? (
                          <span
                            className={
                              isPinExpired(pinExpiresAt) ? 'text-red-600' : 'text-gray-500'
                            }
                          >
                            {formatDateTime(pinExpiresAt)}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>

                      {/* Estado Lock */}
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-1.5">
                          {room.lockStatus === 'LOCKED' ? (
                            <Lock className="h-3.5 w-3.5 text-green-600" />
                          ) : room.lockStatus === 'UNLOCKED' ? (
                            <Unlock className="h-3.5 w-3.5 text-amber-500" />
                          ) : null}
                          <Badge variant={LOCK_STATUS_VARIANT[room.lockStatus] ?? 'default'}>
                            {LOCK_STATUS_LABEL[room.lockStatus] ?? room.lockStatus ?? 'N/A'}
                          </Badge>
                        </div>
                      </td>

                      {/* Estado PIN */}
                      <td className="px-6 py-3">
                        <Badge variant={PIN_STATUS_VARIANT[ps]}>
                          {PIN_STATUS_LABEL[ps]}
                        </Badge>
                      </td>

                      {/* Ações */}
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          {activeResId && ps !== 'ACTIVE' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleGenerateFromRow(activeResId)}
                              disabled={generatePinMutation.isPending}
                              title="Gerar PIN"
                            >
                              <Key className="mr-1 h-3.5 w-3.5" />
                              Gerar PIN
                            </Button>
                          )}
                          {activeResId && ps === 'ACTIVE' && (
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => handleRevoke(activeResId)}
                              disabled={revokePinMutation.isPending}
                              title="Revogar PIN"
                            >
                              <Trash2 className="mr-1 h-3.5 w-3.5" />
                              Revogar
                            </Button>
                          )}
                          {!activeResId && (
                            <span className="text-xs text-gray-300">Sem reserva ativa</span>
                          )}
                        </div>
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
