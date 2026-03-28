'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardTitle, CardContent } from '@/components/ui/card'
import { ArrowLeft, Store } from 'lucide-react'

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Ativa' },
  { value: 'INACTIVE', label: 'Inativa' },
  { value: 'TEMPORARILY_CLOSED', label: 'Temporariamente Fechada' },
]

export default function NewRetailStorePage() {
  const router = useRouter()
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [manager, setManager] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('ACTIVE')
  const [openingHours, setOpeningHours] = useState('')
  const [notes, setNotes] = useState('')

  const mutation = useMutation({
    mutationFn: () =>
      api.post('/retail/stores', {
        name,
        location: location || undefined,
        manager: manager || undefined,
        phone: phone || undefined,
        email: email || undefined,
        status,
        openingHours: openingHours || undefined,
        notes: notes || undefined,
      }),
    onSuccess: () => {
      router.push('/dashboard/retail')
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Erro ao criar loja')
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!name.trim()) {
      setError('O nome da loja é obrigatório.')
      return
    }
    mutation.mutate()
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/retail"
          className="rounded-md p-1 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nova Loja</h1>
          <p className="text-sm text-gray-500">Preencha os dados para registar a loja</p>
        </div>
      </div>

      <Card>
        <CardTitle className="flex items-center gap-2">
          <Store className="h-5 w-5 text-primary" />
          Informações da Loja
        </CardTitle>
        <CardContent>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {error && (
              <p className="rounded bg-red-50 p-3 text-sm text-red-600">{error}</p>
            )}

            {/* Nome */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Nome da Loja <span className="text-red-500">*</span>
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Loja do Resort Cabo Ledo"
                required
              />
            </div>

            {/* Localização e Responsável */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Localização
                </label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ex: Piso 1, Bloco A"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Responsável
                </label>
                <Input
                  value={manager}
                  onChange={(e) => setManager(e.target.value)}
                  placeholder="Nome do responsável"
                />
              </div>
            </div>

            {/* Telefone e Email */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Telefone
                </label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+244 9xx xxx xxx"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Email
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="loja@seasoul.ao"
                />
              </div>
            </div>

            {/* Estado e Horário */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Estado
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
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
                  Horário de Funcionamento
                </label>
                <Input
                  value={openingHours}
                  onChange={(e) => setOpeningHours(e.target.value)}
                  placeholder="Ex: 08:00-20:00"
                />
              </div>
            </div>

            {/* Notas */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Notas <span className="text-xs text-gray-400">(opcional)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observações adicionais sobre a loja..."
                className="flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'A criar...' : 'Criar Loja'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.back()}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
