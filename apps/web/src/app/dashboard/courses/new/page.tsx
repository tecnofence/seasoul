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
import { ArrowLeft } from 'lucide-react'

const COURSE_CATEGORIES = [
  { value: 'TECNOLOGIA', label: 'Tecnologia' },
  { value: 'GESTAO', label: 'Gestão' },
  { value: 'HOTELARIA', label: 'Hotelaria' },
  { value: 'GASTRONOMIA', label: 'Gastronomia' },
  { value: 'SEGURANCA', label: 'Segurança' },
  { value: 'SAUDE', label: 'Saúde' },
  { value: 'LINGUAS', label: 'Línguas' },
  { value: 'OUTRO', label: 'Outro' },
]

const schema = z.object({
  name: z.string().min(2, 'Nome obrigatório (mín. 2 caracteres)'),
  category: z.string().min(1, 'Categoria obrigatória'),
  instructor: z.string().min(2, 'Instrutor obrigatório'),
  description: z.string().optional(),
  durationHours: z.coerce.number().int().min(1, 'Duração deve ser pelo menos 1 hora'),
  price: z.coerce.number().min(0).optional().default(0),
  maxStudents: z.coerce.number().int().min(1).optional(),
  startDate: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ACTIVE', 'ARCHIVED', 'CANCELLED']).default('DRAFT'),
})

type FormData = z.infer<typeof schema>

export default function NewCoursePage() {
  const router = useRouter()
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      status: 'DRAFT',
      price: 0,
    },
  })

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      api.post('/education/courses', {
        ...data,
        price: data.price ?? 0,
        description: data.description || undefined,
        maxStudents: data.maxStudents || undefined,
        startDate: data.startDate || undefined,
      }),
    onSuccess: () => router.push('/dashboard/courses'),
    onError: (err: any) =>
      setError(err.response?.data?.error || 'Erro ao criar curso'),
  })

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="rounded-md p-1 text-gray-400 hover:text-gray-600"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Novo Curso</h1>
      </div>

      <Card>
        <form
          onSubmit={handleSubmit((data) => mutation.mutate(data))}
          className="space-y-4"
        >
          {error && (
            <p className="rounded bg-red-50 p-3 text-sm text-red-600">{error}</p>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium">Nome do Curso</label>
            <Input
              {...register('name')}
              placeholder="Ex: Gestão de Hospitalidade"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Categoria</label>
            <select
              {...register('category')}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">Selecionar categoria...</option>
              {COURSE_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="mt-1 text-xs text-red-500">{errors.category.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Instrutor</label>
            <Input
              {...register('instructor')}
              placeholder="Nome do instrutor"
            />
            {errors.instructor && (
              <p className="mt-1 text-xs text-red-500">{errors.instructor.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Descrição <span className="text-gray-400">(opcional)</span>
            </label>
            <textarea
              {...register('description')}
              className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm min-h-[100px]"
              placeholder="Descreva os objectivos e conteúdo do curso..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Duração (horas)
              </label>
              <Input
                {...register('durationHours')}
                type="number"
                min={1}
                placeholder="Ex: 40"
              />
              {errors.durationHours && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.durationHours.message}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Preço (AOA) <span className="text-gray-400">(opcional)</span>
              </label>
              <Input
                {...register('price')}
                type="number"
                min={0}
                step={0.01}
                placeholder="0"
              />
              {errors.price && (
                <p className="mt-1 text-xs text-red-500">{errors.price.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Máx. de Alunos <span className="text-gray-400">(opcional)</span>
              </label>
              <Input
                {...register('maxStudents')}
                type="number"
                min={1}
                placeholder="Ex: 20"
              />
              {errors.maxStudents && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.maxStudents.message}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Data de Início <span className="text-gray-400">(opcional)</span>
              </label>
              <Input {...register('startDate')} type="date" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Estado Inicial</label>
            <select
              {...register('status')}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              <option value="DRAFT">Rascunho</option>
              <option value="PUBLISHED">Publicado</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'A guardar...' : 'Criar Curso'}
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
      </Card>
    </div>
  )
}
