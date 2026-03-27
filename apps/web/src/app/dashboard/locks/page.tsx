'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Key, Trash2 } from 'lucide-react'

export default function LocksPage() {
  const queryClient = useQueryClient()
  const [reservationId, setReservationId] = useState('')
  const [error, setError] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['locks'],
    queryFn: () => api.get('/locks').then((r) => r.data.data),
  })

  const generatePinMutation = useMutation({
    mutationFn: () => api.post('/locks/pin', { reservationId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locks'] })
      setReservationId('')
      setError('')
    },
    onError: (err: any) => setError(err.response?.data?.error || 'Erro ao gerar PIN'),
  })

  const revokePinMutation = useMutation({
    mutationFn: (resId: string) => api.delete(`/locks/pin/${resId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['locks'] }),
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Smart Locks / PINs de Acesso</h1>

      {/* Gerar PIN */}
      <Card>
        <CardTitle>Gerar PIN de Acesso</CardTitle>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium">ID da Reserva</label>
              <Input
                value={reservationId}
                onChange={(e) => setReservationId(e.target.value)}
                placeholder="ID da reserva para gerar PIN"
              />
            </div>
            <Button
              onClick={() => generatePinMutation.mutate()}
              disabled={!reservationId || generatePinMutation.isPending}
            >
              <Key className="mr-2 h-4 w-4" />
              {generatePinMutation.isPending ? 'A gerar...' : 'Gerar PIN'}
            </Button>
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          {generatePinMutation.isSuccess && (
            <p className="mt-2 text-sm text-green-600">PIN gerado com sucesso!</p>
          )}
        </CardContent>
      </Card>

      {/* Lista de quartos com locks */}
      <Card className="p-0">
        <div className="p-6 pb-0">
          <h3 className="text-lg font-semibold">Quartos com Smart Lock</h3>
        </div>
        {isLoading ? (
          <div className="flex h-32 items-center justify-center text-gray-500">A carregar...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quarto</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Estado Lock</TableHead>
                <TableHead>Reserva Ativa</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data ?? []).map((room: any) => (
                <TableRow key={room.id}>
                  <TableCell className="font-medium">#{room.number}</TableCell>
                  <TableCell>{room.type}</TableCell>
                  <TableCell>
                    <Badge variant={room.lockStatus === 'LOCKED' ? 'success' : room.lockStatus === 'UNLOCKED' ? 'warning' : 'default'}>
                      {room.lockStatus ?? 'N/A'}
                    </Badge>
                  </TableCell>
                  <TableCell>{room.activeReservationId ? `Reserva ativa` : '—'}</TableCell>
                  <TableCell>
                    {room.activeReservationId && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => {
                          if (confirm('Revogar PIN desta reserva?')) {
                            revokePinMutation.mutate(room.activeReservationId)
                          }
                        }}
                        disabled={revokePinMutation.isPending}
                      >
                        <Trash2 className="mr-1 h-3 w-3" />
                        Revogar
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {!(data ?? []).length && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500">Sem quartos com smart lock</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  )
}
