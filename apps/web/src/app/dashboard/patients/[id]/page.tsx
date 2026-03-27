'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import api from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { ArrowLeft, Pencil } from 'lucide-react'

const schema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  phone: z.string().regex(/^\+244\d{9}$/, 'Telefone deve começar com +244 seguido de 9 dígitos'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  address: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const genderLabels: Record<string, string> = {
  MALE: 'Masculino',
  FEMALE: 'Feminino',
  OTHER: 'Outro',
}

const bloodTypeLabels: Record<string, string> = {
  A_POS: 'A+',
  A_NEG: 'A-',
  B_POS: 'B+',
  B_NEG: 'B-',
  AB_POS: 'AB+',
  AB_NEG: 'AB-',
  O_POS: 'O+',
  O_NEG: 'O-',
}

const appointmentStatusLabels: Record<string, string> = {
  SCHEDULED: 'Agendada',
  CONFIRMED: 'Confirmada',
  IN_PROGRESS: 'Em Progresso',
  COMPLETED: 'Concluída',
  CANCELLED: 'Cancelada',
  NO_SHOW: 'Não Compareceu',
}

const appointmentStatusVariants: Record<string, 'default' | 'success' | 'warning' | 'danger'> = {
  SCHEDULED: 'default',
  CONFIRMED: 'default',
  IN_PROGRESS: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'danger',
  NO_SHOW: 'danger',
}

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')

  const { data: patient, isLoading } = useQuery({
    queryKey: ['patient', id],
    queryFn: () => api.get(`/healthcare/patients/${id}`).then((r) => r.data.data),
  })

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const updateMutation = useMutation({
    mutationFn: (data: FormData) =>
      api.put(`/healthcare/patients/${id}`, {
        ...data,
        email: data.email || undefined,
        address: data.address || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient', id] })
      setEditing(false)
      setError('')
    },
    onError: (err: any) => setError(err.response?.data?.error || 'Erro ao atualizar paciente'),
  })

  const startEditing = () => {
    if (patient) {
      reset({
        name: patient.name,
        phone: patient.phone,
        email: patient.email ?? '',
        address: patient.address ?? '',
      })
    }
    setEditing(true)
  }

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center text-gray-500">A carregar...</div>
  }

  if (!patient) {
    return <div className="flex h-64 items-center justify-center text-gray-500">Paciente não encontrado</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">{patient.name}</h1>
      </div>

      {editing ? (
        <Card className="mx-auto max-w-xl">
          <CardTitle>Editar Paciente</CardTitle>
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
                  <label className="mb-1 block text-sm font-medium">Telefone</label>
                  <Input {...register('phone')} placeholder="+244900000000" />
                  {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Email (opcional)</label>
                  <Input {...register('email')} type="email" />
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Morada (opcional)</label>
                <Input {...register('address')} />
                {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address.message}</p>}
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
            <CardTitle>Detalhes do Paciente</CardTitle>
            <CardContent>
              <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-gray-500">Nome</dt>
                  <dd className="font-medium">{patient.name}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Telefone</dt>
                  <dd>{patient.phone}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Email</dt>
                  <dd>{patient.email || '—'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Género</dt>
                  <dd>{genderLabels[patient.gender] ?? patient.gender}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Tipo de Sangue</dt>
                  <dd>{bloodTypeLabels[patient.bloodType] ?? patient.bloodType}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Data de Nascimento</dt>
                  <dd>{formatDate(patient.birthDate)}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-gray-500">Morada</dt>
                  <dd>{patient.address || '—'}</dd>
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

      {patient.appointments?.length > 0 && (
        <Card>
          <CardTitle>Consultas</CardTitle>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Médico</TableHead>
                  <TableHead>Especialidade</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patient.appointments.map((appt: any) => (
                  <TableRow
                    key={appt.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => router.push(`/dashboard/appointments/${appt.id}`)}
                  >
                    <TableCell>{formatDate(appt.date)}</TableCell>
                    <TableCell>{appt.doctorName}</TableCell>
                    <TableCell>{appt.specialty}</TableCell>
                    <TableCell>{appt.reason}</TableCell>
                    <TableCell>
                      <Badge variant={appointmentStatusVariants[appt.status] ?? 'default'}>
                        {appointmentStatusLabels[appt.status] ?? appt.status}
                      </Badge>
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
