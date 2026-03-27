'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatKwanza, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardTitle, CardContent } from '@/components/ui/card'
import { ArrowLeft, Calendar, CheckCircle, PlayCircle, PauseCircle, XCircle, ClipboardList } from 'lucide-react'

const STATUS_LABEL: Record<string, string> = {
  PROPOSAL: 'Proposta',
  APPROVED: 'Aprovado',
  IN_PROGRESS: 'Em Curso',
  ON_HOLD: 'Em Espera',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
}

const STATUS_VARIANT: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  PROPOSAL: 'info',
  APPROVED: 'info',
  IN_PROGRESS: 'warning',
  ON_HOLD: 'default',
  COMPLETED: 'success',
  CANCELLED: 'danger',
}

const PROJECT_TYPE_LABEL: Record<string, string> = {
  AUDIT: 'Auditoria',
  STRATEGY: 'Estratégia',
  TECHNOLOGY: 'Tecnologia',
  FINANCIAL: 'Financeiro',
  LEGAL: 'Jurídico',
  HR: 'Recursos Humanos',
  OPERATIONS: 'Operações',
  OTHER: 'Outro',
}

export default function ConsultingProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [error, setError] = useState('')

  const { data: project, isLoading } = useQuery({
    queryKey: ['consulting', id],
    queryFn: () => api.get(`/consulting/${id}`).then((r) => r.data.data),
  })

  const actionMutation = useMutation({
    mutationFn: (action: string) => api.patch(`/consulting/${id}/${action}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consulting', id] })
      setError('')
    },
    onError: (err: any) =>
      setError(err.response?.data?.error || 'Erro ao atualizar estado do projeto'),
  })

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        A carregar...
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        Projeto não encontrado
      </div>
    )
  }

  const tasks = project.tasks ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold">{project.title}</h1>
          <p className="text-sm text-gray-500">{project.clientName}</p>
        </div>
        <Badge variant={STATUS_VARIANT[project.status] ?? 'default'}>
          {STATUS_LABEL[project.status] ?? project.status}
        </Badge>
      </div>

      {error && (
        <p className="rounded bg-red-50 p-3 text-sm text-red-600">{error}</p>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardTitle>Detalhes do Projeto</CardTitle>
          <CardContent>
            <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-gray-500">Cliente</dt>
                <dd className="font-medium">{project.clientName}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Tipo de Projeto</dt>
                <dd className="font-medium">
                  {PROJECT_TYPE_LABEL[project.projectType] ?? project.projectType}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Orçamento</dt>
                <dd className="font-semibold text-primary">
                  {project.budget ? formatKwanza(Number(project.budget)) : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Horas Trabalhadas / Estimadas</dt>
                <dd className="font-medium">
                  {project.hoursWorked ?? 0}h / {project.estimatedHours ?? 0}h
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Data de Início</dt>
                <dd className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  {project.startDate ? formatDate(project.startDate) : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Data de Fim</dt>
                <dd className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  {project.endDate ? formatDate(project.endDate) : 'Indeterminado'}
                </dd>
              </div>
            </dl>

            {project.description && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-500">Descrição</h4>
                <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">
                  {project.description}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardTitle>Ações</CardTitle>
          <CardContent className="space-y-3">
            {project.status === 'PROPOSAL' && (
              <Button
                className="w-full"
                onClick={() => {
                  if (confirm('Aprovar este projeto de consultoria?')) {
                    actionMutation.mutate('approve')
                  }
                }}
                disabled={actionMutation.isPending}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Aprovar
              </Button>
            )}

            {project.status === 'APPROVED' && (
              <Button
                className="w-full"
                onClick={() => {
                  if (confirm('Iniciar este projeto?')) {
                    actionMutation.mutate('start')
                  }
                }}
                disabled={actionMutation.isPending}
              >
                <PlayCircle className="mr-2 h-4 w-4" />
                Iniciar
              </Button>
            )}

            {project.status === 'IN_PROGRESS' && (
              <>
                <Button
                  className="w-full"
                  onClick={() => {
                    if (confirm('Marcar este projeto como concluído?')) {
                      actionMutation.mutate('complete')
                    }
                  }}
                  disabled={actionMutation.isPending}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Concluir
                </Button>
                <Button
                  className="w-full"
                  variant="secondary"
                  onClick={() => {
                    if (confirm('Colocar este projeto em espera?')) {
                      actionMutation.mutate('hold')
                    }
                  }}
                  disabled={actionMutation.isPending}
                >
                  <PauseCircle className="mr-2 h-4 w-4" />
                  Colocar em Espera
                </Button>
              </>
            )}

            {project.status !== 'CANCELLED' && (
              <Button
                variant="danger"
                className="w-full"
                onClick={() => {
                  if (
                    confirm(
                      'Tem a certeza que quer cancelar este projeto? Esta ação não pode ser revertida.'
                    )
                  ) {
                    actionMutation.mutate('cancel')
                  }
                }}
                disabled={actionMutation.isPending}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
            )}

            <Button
              variant="ghost"
              className="w-full"
              onClick={() => router.push('/dashboard/consulting')}
            >
              Voltar à Lista
            </Button>
          </CardContent>
        </Card>
      </div>

      {tasks.length > 0 && (
        <Card>
          <CardTitle>Tarefas</CardTitle>
          <CardContent>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-gray-50 text-left text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Tarefa</th>
                    <th className="px-4 py-3">Responsável</th>
                    <th className="px-4 py-3">Prazo</th>
                    <th className="px-4 py-3">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {tasks.map((task: any) => (
                    <tr key={task.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{task.title || task.name || '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{task.assignee || task.assignedTo || '—'}</td>
                      <td className="px-4 py-3 text-gray-500">
                        {task.dueDate ? formatDate(task.dueDate) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                          {task.status || '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {tasks.length === 0 && (
        <Card>
          <CardTitle>Tarefas</CardTitle>
          <CardContent>
            <div className="py-8 text-center">
              <ClipboardList className="mx-auto h-10 w-10 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">Nenhuma tarefa associada</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
