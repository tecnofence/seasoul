'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import api from '@/lib/api'
import { formatKwanza, formatDate, formatDateTime } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardTitle, CardContent } from '@/components/ui/card'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { ArrowLeft, GraduationCap, Users, Edit2, X } from 'lucide-react'

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Rascunho',
  PUBLISHED: 'Publicado',
  ACTIVE: 'Activo',
  ARCHIVED: 'Arquivado',
  CANCELLED: 'Cancelado',
}

const STATUS_VARIANT: Record<string, 'default' | 'info' | 'success' | 'warning' | 'danger'> = {
  DRAFT: 'default',
  PUBLISHED: 'info',
  ACTIVE: 'success',
  ARCHIVED: 'warning',
  CANCELLED: 'danger',
}

const ENROLLMENT_STATUS_LABEL: Record<string, string> = {
  ENROLLED: 'Inscrito',
  IN_PROGRESS: 'Em Progresso',
  COMPLETED: 'Concluído',
  DROPPED: 'Desistiu',
  CANCELLED: 'Cancelado',
}

const ENROLLMENT_STATUS_VARIANT: Record<string, 'default' | 'info' | 'success' | 'warning' | 'danger'> = {
  ENROLLED: 'info',
  IN_PROGRESS: 'warning',
  COMPLETED: 'success',
  DROPPED: 'default',
  CANCELLED: 'danger',
}

const editSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório (mín. 2 caracteres)'),
  instructor: z.string().min(2, 'Instrutor obrigatório'),
  price: z.coerce.number().min(0, 'Preço não pode ser negativo'),
})

type EditFormData = z.infer<typeof editSchema>

export default function CourseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const id = params.id as string

  const [editMode, setEditMode] = useState(false)
  const [actionError, setActionError] = useState('')

  const { data: course, isLoading, isError } = useQuery({
    queryKey: ['course', id],
    queryFn: () => api.get(`/education/courses/${id}`).then((r) => r.data.data),
    enabled: !!id,
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    values: course
      ? { name: course.name, instructor: course.instructor ?? '', price: course.price ?? 0 }
      : undefined,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['course', id] })

  const editMutation = useMutation({
    mutationFn: (data: EditFormData) => api.put(`/education/courses/${id}`, data),
    onSuccess: () => {
      setEditMode(false)
      setActionError('')
      invalidate()
    },
    onError: (err: any) =>
      setActionError(err.response?.data?.error || 'Erro ao actualizar curso'),
  })

  const actionMutation = useMutation({
    mutationFn: (action: string) =>
      api.patch(`/education/courses/${id}/${action}`),
    onSuccess: () => {
      setActionError('')
      invalidate()
    },
    onError: (err: any) =>
      setActionError(err.response?.data?.error || 'Erro ao executar acção'),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (isError || !course) {
    return (
      <div className="py-20 text-center">
        <p className="text-gray-500">Curso não encontrado.</p>
        <Button variant="secondary" className="mt-4" onClick={() => router.back()}>
          Voltar
        </Button>
      </div>
    )
  }

  const status = course.status ?? 'DRAFT'
  const enrollments: any[] = Array.isArray(course.enrollments) ? course.enrollments : []
  const isPending = actionMutation.isPending || editMutation.isPending

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="rounded-md p-1 text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <GraduationCap className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold text-gray-900">{course.name}</h1>
              <Badge variant={STATUS_VARIANT[status] ?? 'default'}>
                {STATUS_LABEL[status] ?? status}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {course.category ?? '—'} &middot; Instrutor: {course.instructor ?? '—'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!editMode && (
            <Button
              variant="secondary"
              onClick={() => {
                setEditMode(true)
                setActionError('')
              }}
            >
              <Edit2 className="mr-2 h-4 w-4" />
              Editar
            </Button>
          )}
          {status === 'DRAFT' && (
            <Button
              onClick={() => actionMutation.mutate('publish')}
              disabled={isPending}
            >
              Publicar
            </Button>
          )}
          {status === 'PUBLISHED' && (
            <Button
              onClick={() => actionMutation.mutate('activate')}
              disabled={isPending}
            >
              Ativar
            </Button>
          )}
          {status === 'ACTIVE' && (
            <Button
              variant="secondary"
              onClick={() => actionMutation.mutate('archive')}
              disabled={isPending}
            >
              Arquivar
            </Button>
          )}
          {status !== 'CANCELLED' && status !== 'ARCHIVED' && (
            <Button
              variant="danger"
              onClick={() => actionMutation.mutate('cancel')}
              disabled={isPending}
            >
              Cancelar
            </Button>
          )}
        </div>
      </div>

      {actionError && (
        <p className="rounded bg-red-50 p-3 text-sm text-red-600">{actionError}</p>
      )}

      {/* Formulário de edição */}
      {editMode && (
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <CardTitle>Editar Curso</CardTitle>
            <button
              onClick={() => {
                setEditMode(false)
                reset()
                setActionError('')
              }}
              className="rounded-md p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <CardContent>
            <form
              onSubmit={handleSubmit((data) => editMutation.mutate(data))}
              className="space-y-4"
            >
              <div>
                <label className="mb-1 block text-sm font-medium">Nome do Curso</label>
                <Input {...register('name')} />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Instrutor</label>
                <Input {...register('instructor')} />
                {errors.instructor && (
                  <p className="mt-1 text-xs text-red-500">{errors.instructor.message}</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Preço (AOA)</label>
                <Input {...register('price')} type="number" min={0} step={0.01} />
                {errors.price && (
                  <p className="mt-1 text-xs text-red-500">{errors.price.message}</p>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={editMutation.isPending}>
                  {editMutation.isPending ? 'A guardar...' : 'Guardar Alterações'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setEditMode(false)
                    reset()
                    setActionError('')
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Detalhes do curso */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle className="mb-4">Informação do Curso</CardTitle>
          <CardContent>
            <dl className="space-y-3">
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <dt className="text-sm text-gray-500">Nome</dt>
                <dd className="text-sm font-medium">{course.name}</dd>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <dt className="text-sm text-gray-500">Categoria</dt>
                <dd className="text-sm font-medium">{course.category ?? '—'}</dd>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <dt className="text-sm text-gray-500">Instrutor</dt>
                <dd className="text-sm font-medium">{course.instructor ?? '—'}</dd>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <dt className="text-sm text-gray-500">Duração</dt>
                <dd className="text-sm font-medium">
                  {course.durationHours ?? course.duration ?? '—'} horas
                </dd>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <dt className="text-sm text-gray-500">Preço</dt>
                <dd className="text-sm font-medium">{formatKwanza(course.price)}</dd>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <dt className="text-sm text-gray-500">Máx. Alunos</dt>
                <dd className="text-sm font-medium">
                  {course.maxStudents ?? '—'}
                </dd>
              </div>
              {course.startDate && (
                <div className="flex justify-between border-b border-gray-100 pb-2">
                  <dt className="text-sm text-gray-500">Data de Início</dt>
                  <dd className="text-sm font-medium">{formatDate(course.startDate)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Estado</dt>
                <dd>
                  <Badge variant={STATUS_VARIANT[status] ?? 'default'}>
                    {STATUS_LABEL[status] ?? status}
                  </Badge>
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {course.description && (
          <Card>
            <CardTitle className="mb-4">Descrição</CardTitle>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm text-gray-700">
                {course.description}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tabela de inscrições */}
      <Card>
        <div className="mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <CardTitle>Alunos Inscritos ({enrollments.length})</CardTitle>
        </div>
        <CardContent>
          {enrollments.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">
              Nenhum aluno inscrito neste curso.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Data de Inscrição</TableHead>
                  <TableHead>Data de Conclusão</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrollments.map((enrollment: any) => (
                  <TableRow key={enrollment.id}>
                    <TableCell className="font-medium">
                      {enrollment.studentName ?? enrollment.student?.name ?? '—'}
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {enrollment.enrolledAt
                        ? formatDateTime(enrollment.enrolledAt)
                        : '—'}
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {enrollment.completedAt
                        ? formatDateTime(enrollment.completedAt)
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          ENROLLMENT_STATUS_VARIANT[enrollment.status] ?? 'default'
                        }
                      >
                        {ENROLLMENT_STATUS_LABEL[enrollment.status] ??
                          enrollment.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
