'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatDate, formatDateTime } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardTitle, CardContent } from '@/components/ui/card'
import { ArrowLeft, UserCheck, Clock } from 'lucide-react'

const STATUS_VARIANT: Record<string, 'success' | 'danger' | 'warning' | 'info' | 'default'> = {
  PRESENT: 'success',
  ABSENT: 'danger',
  LATE: 'warning',
  HALF_DAY: 'info',
  LEAVE: 'default',
  HOLIDAY: 'default',
}

const STATUS_LABEL: Record<string, string> = {
  PRESENT: 'Presente',
  ABSENT: 'Ausente',
  LATE: 'Atraso',
  HALF_DAY: 'Meio Dia',
  LEAVE: 'Licença',
  HOLIDAY: 'Feriado',
}

export default function AttendanceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const { data: record, isLoading } = useQuery({
    queryKey: ['attendance', id],
    queryFn: () => api.get(`/attendance/${id}`).then((r) => r.data.data),
  })

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center text-gray-500">A carregar...</div>
  }

  if (!record) {
    return <div className="flex h-64 items-center justify-center text-gray-500">Registo não encontrado</div>
  }

  const status = record.status ?? 'PRESENT'

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold flex-1">
          Presença — {record.employeeName ?? record.employee?.name}
        </h1>
        <Badge variant={STATUS_VARIANT[status] ?? 'default'}>
          {STATUS_LABEL[status] ?? status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>
            <UserCheck className="mr-2 inline h-5 w-5 text-primary" />
            Informação do Registo
          </CardTitle>
          <CardContent>
            <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-gray-500">Colaborador</dt>
                <dd className="font-medium">{record.employeeName ?? record.employee?.name ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Data</dt>
                <dd>{record.date ? formatDate(record.date) : '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">
                  <Clock className="mr-1 inline h-4 w-4 text-green-500" />
                  Entrada
                </dt>
                <dd>{record.checkIn ? formatDateTime(record.checkIn) : '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">
                  <Clock className="mr-1 inline h-4 w-4 text-red-500" />
                  Saída
                </dt>
                <dd>{record.checkOut ? formatDateTime(record.checkOut) : '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Horas Trabalhadas</dt>
                <dd className="font-semibold text-primary">
                  {record.hoursWorked != null ? `${record.hoursWorked}h` : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Estado</dt>
                <dd>
                  <Badge variant={STATUS_VARIANT[status] ?? 'default'}>
                    {STATUS_LABEL[status] ?? status}
                  </Badge>
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {record.notes && (
          <Card>
            <CardTitle>Notas</CardTitle>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm text-gray-700">{record.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
