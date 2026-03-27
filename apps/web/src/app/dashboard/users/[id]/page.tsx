'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import api from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardTitle, CardContent } from '@/components/ui/card'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'

const roles = ['SUPER_ADMIN', 'RESORT_MANAGER', 'RECEPTIONIST', 'POS_OPERATOR', 'STOCK_MANAGER', 'HR_MANAGER', 'MAINTENANCE', 'HOUSEKEEPING']

const roleLabel: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  RESORT_MANAGER: 'Gestor Resort',
  RECEPTIONIST: 'Rececionista',
  POS_OPERATOR: 'Operador POS',
  STOCK_MANAGER: 'Gestor Stock',
  HR_MANAGER: 'Gestor RH',
  MAINTENANCE: 'Manutenção',
  HOUSEKEEPING: 'Housekeeping',
}

const schema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  email: z.string().email('Email inválido'),
  role: z.string().min(1, 'Cargo obrigatório'),
})

type FormData = z.infer<typeof schema>

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')

  const { data: user, isLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: () => api.get(`/users/${id}`).then((r) => r.data.data),
  })

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const updateMutation = useMutation({
    mutationFn: (data: FormData) => api.put(`/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', id] })
      setEditing(false)
      setError('')
    },
    onError: (err: any) => setError(err.response?.data?.error || 'Erro ao atualizar'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/users/${id}`),
    onSuccess: () => router.push('/dashboard/users'),
  })

  const startEditing = () => {
    if (user) {
      reset({ name: user.name, email: user.email, role: user.role })
    }
    setEditing(true)
  }

  if (isLoading) return <div className="flex h-64 items-center justify-center text-gray-500">A carregar...</div>
  if (!user) return <div className="flex h-64 items-center justify-center text-gray-500">Utilizador não encontrado</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700"><ArrowLeft size={20} /></button>
        <h1 className="text-2xl font-bold">{user.name}</h1>
        <Badge variant={user.active ? 'success' : 'danger'}>{user.active ? 'Ativo' : 'Inativo'}</Badge>
      </div>

      {editing ? (
        <Card className="mx-auto max-w-xl">
          <CardTitle>Editar Utilizador</CardTitle>
          <CardContent>
            <form onSubmit={handleSubmit((data) => updateMutation.mutate(data))} className="space-y-4">
              {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>}
              <div>
                <label className="mb-1 block text-sm font-medium">Nome</label>
                <Input {...register('name')} />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Email</label>
                <Input {...register('email')} type="email" />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Cargo</label>
                <select {...register('role')} className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">
                  {roles.map((r) => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={updateMutation.isPending}>{updateMutation.isPending ? 'A guardar...' : 'Guardar'}</Button>
                <Button type="button" variant="secondary" onClick={() => setEditing(false)}>Cancelar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardTitle>Detalhes</CardTitle>
            <CardContent>
              <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                <div><dt className="text-gray-500">Nome</dt><dd className="font-medium">{user.name}</dd></div>
                <div><dt className="text-gray-500">Email</dt><dd>{user.email}</dd></div>
                <div><dt className="text-gray-500">Cargo</dt><dd>{roleLabel[user.role] ?? user.role}</dd></div>
                <div><dt className="text-gray-500">2FA</dt><dd><Badge variant={user.twoFaEnabled ? 'success' : 'default'}>{user.twoFaEnabled ? 'Ativado' : 'Desativado'}</Badge></dd></div>
              </dl>
            </CardContent>
          </Card>
          <Card>
            <CardTitle>Ações</CardTitle>
            <CardContent className="space-y-3">
              <Button className="w-full" onClick={startEditing}><Pencil className="mr-2 h-4 w-4" />Editar</Button>
              <Button variant="danger" className="w-full" onClick={() => { if (confirm('Desativar este utilizador?')) deleteMutation.mutate() }} disabled={deleteMutation.isPending}>
                <Trash2 className="mr-2 h-4 w-4" />Desativar
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
