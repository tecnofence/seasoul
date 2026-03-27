'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardTitle, CardContent } from '@/components/ui/card'
import { ArrowLeft, Award, CalendarClock, AlertTriangle } from 'lucide-react'

function getDaysUntilExpiry(expiryDate: string | null | undefined): number | null {
  if (!expiryDate) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiry = new Date(expiryDate)
  expiry.setHours(0, 0, 0, 0)
  return Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function getExpiryBadgeVariant(
  status: string,
  days: number | null,
): 'success' | 'warning' | 'danger' | 'default' {
  if (status === 'EXPIRED') return 'danger'
  if (status !== 'ACTIVE') return 'default'
  if (days === null) return 'success'
  if (days < 0) return 'danger'
  if (days <= 30) return 'warning'
  return 'success'
}

const STATUS_VARIANT: Record<string, 'success' | 'danger' | 'warning' | 'default'> = {
  ACTIVE: 'success',
  EXPIRED: 'danger',
  SUSPENDED: 'warning',
  CANCELLED: 'default',
}

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Ativo',
  EXPIRED: 'Expirado',
  SUSPENDED: 'Suspenso',
  CANCELLED: 'Cancelado',
}

export default function CertificationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const { data: cert, isLoading } = useQuery({
    queryKey: ['certification', id],
    queryFn: () => api.get(`/electrical/certifications/${id}`).then((r) => r.data.data),
  })

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center text-gray-500">A carregar...</div>
  }

  if (!cert) {
    return <div className="flex h-64 items-center justify-center text-gray-500">Registo não encontrado</div>
  }

  const status = cert.status ?? 'ACTIVE'
  const daysUntilExpiry = getDaysUntilExpiry(cert.expiryDate)
  const expiryVariant = getExpiryBadgeVariant(status, daysUntilExpiry)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold flex-1">{cert.name ?? cert.title}</h1>
        <Badge variant={STATUS_VARIANT[status] ?? 'default'}>
          {STATUS_LABEL[status] ?? status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardTitle>
            <Award className="mr-2 inline h-5 w-5 text-primary" />
            Detalhes da Certificação
          </CardTitle>
          <CardContent>
            <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-gray-500">Nome / Título</dt>
                <dd className="font-medium">{cert.name ?? cert.title ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Cliente</dt>
                <dd>{cert.client ?? cert.clientName ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Número de Certificação</dt>
                <dd className="font-mono font-medium">{cert.certificationNumber ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Estado</dt>
                <dd>
                  <Badge variant={STATUS_VARIANT[status] ?? 'default'}>
                    {STATUS_LABEL[status] ?? status}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">
                  <CalendarClock className="mr-1 inline h-4 w-4" />
                  Data de Emissão
                </dt>
                <dd>{cert.issuedDate ? formatDate(cert.issuedDate) : '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">
                  <CalendarClock className="mr-1 inline h-4 w-4 text-orange-500" />
                  Data de Expiração
                </dt>
                <dd>{cert.expiryDate ? formatDate(cert.expiryDate) : '—'}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardTitle>Validade</CardTitle>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-4 text-center">
            {daysUntilExpiry !== null ? (
              <>
                <Badge variant={expiryVariant} className="px-4 py-2 text-base">
                  {daysUntilExpiry < 0
                    ? `Expirou há ${Math.abs(daysUntilExpiry)} dias`
                    : daysUntilExpiry === 0
                    ? 'Expira hoje'
                    : `${daysUntilExpiry} dias restantes`}
                </Badge>

                {daysUntilExpiry <= 30 && daysUntilExpiry >= 0 && (
                  <div className="flex items-center gap-1 text-sm text-orange-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Renovação urgente</span>
                  </div>
                )}

                {daysUntilExpiry < 0 && (
                  <div className="flex items-center gap-1 text-sm text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Certificação expirada</span>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-400">Sem data de expiração definida</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
