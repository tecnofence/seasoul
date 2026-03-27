'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import api from '@/lib/api'
import { formatKwanza, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { ArrowLeft, Pencil } from 'lucide-react'

const schema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  nif: z.string().regex(/^\d{9}$/, 'NIF deve ter 9 dígitos'),
  role: z.string().min(1, 'Cargo obrigatório'),
  department: z.string().min(1, 'Departamento obrigatório'),
  baseSalary: z.coerce.number().positive('Salário deve ser positivo'),
})

type FormData = z.infer<typeof schema>

const departments = ['RECEÇÃO', 'COZINHA', 'BAR', 'HOUSEKEEPING', 'SPA', 'SEGURANÇA', 'MANUTENÇÃO', 'ADMINISTRAÇÃO']

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')

  const { data: employee, isLoading } = useQuery({
    queryKey: ['employee', id],
    queryFn: () => api.get(`/hr/${id}`).then((r) => r.data.data),
  })

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const updateMutation = useMutation({
    mutationFn: (data: FormData) => api.put(`/hr/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee', id] })
      setEditing(false)
      setError('')
    },
    onError: (err: any) => setError(err.response?.data?.error || 'Erro ao atualizar'),
  })

  const startEditing = () => {
    if (employee) {
      reset({
        name: employee.name,
        nif: employee.nif,
        role: employee.role,
        department: employee.department,
        baseSalary: parseFloat(employee.baseSalary),
      })
    }
    setEditing(true)
  }

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center text-gray-500">A carregar...</div>
  }

  if (!employee) {
    return <div className="flex h-64 items-center justify-center text-gray-500">Colaborador não encontrado</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">{employee.name}</h1>
        <Badge variant={employee.active ? 'success' : 'danger'}>
          {employee.active ? 'Ativo' : 'Inativo'}
        </Badge>
      </div>

      {editing ? (
        <Card className="mx-auto max-w-xl">
          <CardTitle>Editar Colaborador</CardTitle>
          <CardContent>
            <form onSubmit={handleSubmit((data) => updateMutation.mutate(data))} className="space-y-4">
              {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>}

              <div>
                <label className="mb-1 block text-sm font-medium">Nome Completo</label>
                <Input {...register('name')} />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">NIF</label>
                  <Input {...register('nif')} />
                  {errors.nif && <p className="text-xs text-red-500 mt-1">{errors.nif.message}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Cargo</label>
                  <Input {...register('role')} />
                  {errors.role && <p className="text-xs text-red-500 mt-1">{errors.role.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">Departamento</label>
                  <select {...register('department')} className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">
                    {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Salário Base (AOA)</label>
                  <Input {...register('baseSalary')} type="number" min={0} step="0.01" />
                  {errors.baseSalary && <p className="text-xs text-red-500 mt-1">{errors.baseSalary.message}</p>}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'A guardar...' : 'Guardar'}
                </Button>
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
                <div>
                  <dt className="text-gray-500">Nome</dt>
                  <dd className="font-medium">{employee.name}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">NIF</dt>
                  <dd>{employee.nif}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Cargo</dt>
                  <dd>{employee.role}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Departamento</dt>
                  <dd>{employee.department}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Salário Base</dt>
                  <dd className="font-semibold text-primary">{formatKwanza(employee.baseSalary)}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Data de Início</dt>
                  <dd>{formatDate(employee.startDate)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardTitle>Ações</CardTitle>
            <CardContent className="space-y-3">
              <Button className="w-full" onClick={startEditing}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Turnos recentes */}
      {employee.shifts?.length > 0 && (
        <Card>
          <CardTitle>Turnos Recentes</CardTitle>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Entrada</TableHead>
                  <TableHead>Saída</TableHead>
                  <TableHead>Tipo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employee.shifts.map((shift: any) => (
                  <TableRow key={shift.id}>
                    <TableCell>{formatDate(shift.date)}</TableCell>
                    <TableCell>{shift.startTime}</TableCell>
                    <TableCell>{shift.endTime}</TableCell>
                    <TableCell>
                      <Badge variant={shift.type === 'NORMAL' ? 'default' : 'warning'}>{shift.type}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
