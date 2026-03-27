'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

const schema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  phone: z.string().regex(/^\+244\d{9}$/, 'Telefone deve começar com +244 seguido de 9 dígitos'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER'], { required_error: 'Género obrigatório' }),
  bloodType: z.enum(['A_POS', 'A_NEG', 'B_POS', 'B_NEG', 'AB_POS', 'AB_NEG', 'O_POS', 'O_NEG'], {
    required_error: 'Tipo de sangue obrigatório',
  }),
  birthDate: z.string().min(1, 'Data de nascimento obrigatória'),
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

export default function NewPatientPage() {
  const router = useRouter()
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      api.post('/healthcare/patients', {
        ...data,
        email: data.email || undefined,
        address: data.address || undefined,
        birthDate: new Date(data.birthDate).toISOString(),
      }),
    onSuccess: () => router.push('/dashboard/patients'),
    onError: (err: any) => setError(err.response?.data?.error || 'Erro ao criar paciente'),
  })

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-bold">Novo Paciente</h1>

      <Card>
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>}

          <div>
            <label className="mb-1 block text-sm font-medium">Nome Completo</label>
            <Input {...register('name')} placeholder="Nome do paciente" />
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
              <Input {...register('email')} type="email" placeholder="email@exemplo.com" />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Género</label>
              <select
                {...register('gender')}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                <option value="">Selecionar...</option>
                {Object.entries(genderLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              {errors.gender && <p className="text-xs text-red-500 mt-1">{errors.gender.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Tipo de Sangue</label>
              <select
                {...register('bloodType')}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                <option value="">Selecionar...</option>
                {Object.entries(bloodTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              {errors.bloodType && <p className="text-xs text-red-500 mt-1">{errors.bloodType.message}</p>}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Data de Nascimento</label>
            <Input {...register('birthDate')} type="date" />
            {errors.birthDate && <p className="text-xs text-red-500 mt-1">{errors.birthDate.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Morada (opcional)</label>
            <Input {...register('address')} placeholder="Morada do paciente" />
            {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address.message}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'A criar...' : 'Criar Paciente'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.back()}>Cancelar</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
