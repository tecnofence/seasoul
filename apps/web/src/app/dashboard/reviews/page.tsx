'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Star, MessageSquare, ChevronDown, ChevronUp, Send } from 'lucide-react'
import api from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { StatCard } from '@/components/ui/stat-card'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Review {
  id: string
  guestName: string
  overallRating: number
  comment?: string
  reply?: string
  published: boolean
  createdAt: string
  categories?: string[]
  rooms?: number
  service?: number
  food?: number
  pool?: number
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_LABEL: Record<string, string> = {
  ROOMS: 'Quartos',
  SERVICE: 'Serviço',
  FOOD: 'Restauração',
  POOL: 'Piscina',
  OVERALL: 'Geral',
}

const CATEGORY_COLOR: Record<string, string> = {
  ROOMS: 'bg-primary/10 text-primary',
  SERVICE: 'bg-green-100 text-green-700',
  FOOD: 'bg-amber-100 text-amber-700',
  POOL: 'bg-sky-100 text-sky-700',
  OVERALL: 'bg-purple-100 text-purple-700',
}

const FILTER_TABS = [
  { key: '', label: 'Todos' },
  { key: 'pending', label: 'Pendentes' },
  { key: 'responded', label: 'Respondidas' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function StarDisplay({ rating, size = 'md' }: { rating: number; size?: 'sm' | 'md' }) {
  const sz = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4.5 w-4.5'
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${sz} ${
            i < Math.round(rating)
              ? 'fill-yellow-400 text-yellow-400'
              : 'fill-gray-200 text-gray-200'
          }`}
        />
      ))}
    </div>
  )
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

function avatarColor(name: string): string {
  const colors = [
    'bg-primary/20 text-primary',
    'bg-green-100 text-green-700',
    'bg-amber-100 text-amber-700',
    'bg-purple-100 text-purple-700',
    'bg-sky-100 text-sky-700',
    'bg-red-100 text-red-700',
  ]
  let hash = 0
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) % colors.length
  return colors[hash]
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${
      type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
    }`}>
      {message}
    </div>
  )
}

// ─── RatingBar ────────────────────────────────────────────────────────────────

function RatingBar({ star, count, total }: { star: number; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="flex w-12 shrink-0 items-center justify-end gap-0.5">
        <span className="text-xs font-medium text-gray-700">{star}</span>
        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
      </div>
      <div className="flex-1 overflow-hidden rounded-full bg-gray-100 h-2">
        <div
          className="h-2 rounded-full bg-yellow-400 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-10 shrink-0 text-right text-xs text-gray-500">{pct}%</span>
      <span className="w-6 shrink-0 text-right text-xs text-gray-400">{count}</span>
    </div>
  )
}

// ─── ReviewCard ───────────────────────────────────────────────────────────────

function ReviewCard({ review, onRespondSuccess }: { review: Review; onRespondSuccess: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const [replyOpen, setReplyOpen] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const { mutate: postReply, isPending } = useMutation({
    mutationFn: () =>
      api.post(`/reviews/${review.id}/respond`, { reply: replyText }).then((r) => r.data),
    onSuccess: () => {
      setReplyOpen(false)
      setReplyText('')
      setToast({ message: 'Resposta publicada com sucesso.', type: 'success' })
      setTimeout(() => setToast(null), 3000)
      onRespondSuccess()
    },
    onError: () => {
      setToast({ message: 'Erro ao publicar resposta.', type: 'error' })
      setTimeout(() => setToast(null), 3000)
    },
  })

  const isLong = (review.comment?.length ?? 0) > 200

  return (
    <Card className="space-y-4">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${avatarColor(review.guestName)}`}>
            {getInitials(review.guestName)}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{review.guestName}</p>
            <p className="text-xs text-gray-400">{formatDate(review.createdAt)}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <StarDisplay rating={review.overallRating} />
          <span className="text-xs font-semibold text-gray-600">{review.overallRating.toFixed(1)}</span>
        </div>
      </div>

      {/* Category badges */}
      {review.categories && review.categories.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {review.categories.map((cat) => (
            <span
              key={cat}
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                CATEGORY_COLOR[cat] ?? 'bg-gray-100 text-gray-600'
              }`}
            >
              {CATEGORY_LABEL[cat] ?? cat}
            </span>
          ))}
        </div>
      )}

      {/* Comment */}
      {review.comment && (
        <div>
          <p className={`text-sm text-gray-700 leading-relaxed ${!expanded && isLong ? 'line-clamp-3' : ''}`}>
            {review.comment}
          </p>
          {isLong && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-1 flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              {expanded ? (
                <><ChevronUp className="h-3 w-3" /> Ver menos</>
              ) : (
                <><ChevronDown className="h-3 w-3" /> Ver mais</>
              )}
            </button>
          )}
        </div>
      )}

      {/* Existing reply */}
      {review.reply && (
        <div className="rounded-md border border-gray-100 bg-gray-50 p-3">
          <p className="text-xs font-semibold text-gray-500 mb-1">Resposta da gestão</p>
          <p className="text-sm text-gray-700">{review.reply}</p>
        </div>
      )}

      {/* Reply button / form */}
      {!review.reply && (
        <div>
          {!replyOpen ? (
            <button
              onClick={() => setReplyOpen(true)}
              className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Responder
            </button>
          ) : (
            <div className="space-y-2">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Escreva a sua resposta..."
                rows={3}
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  disabled={!replyText.trim() || isPending}
                  onClick={() => postReply()}
                >
                  {isPending ? (
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <>
                      <Send className="mr-1.5 h-3.5 w-3.5" />
                      Publicar resposta
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => { setReplyOpen(false); setReplyText('') }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} />}
    </Card>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ReviewsPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [ratingFilter, setRatingFilter] = useState(0)

  const { data, isLoading } = useQuery({
    queryKey: ['reviews', page, statusFilter, ratingFilter],
    queryFn: () =>
      api.get('/reviews', {
        params: {
          page,
          limit: 20,
          status: statusFilter || undefined,
          rating: ratingFilter || undefined,
        },
      }).then((r) => r.data),
  })

  const reviews: Review[] = data?.data ?? []
  const totalPages: number = data?.totalPages ?? 1

  // ── Stats ──────────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    if (data?.stats) return data.stats
    // Compute from current page as fallback
    const total = data?.total ?? reviews.length
    const avg =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.overallRating, 0) / reviews.length
        : 0
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const recent = reviews.filter((r) => new Date(r.createdAt) >= thirtyDaysAgo).length
    const responded = reviews.filter((r) => !!r.reply).length
    return { total, avg, recent, responded }
  }, [data, reviews])

  // ── Rating distribution ────────────────────────────────────────────────────

  const ratingDist = useMemo(() => {
    if (data?.ratingDistribution) return data.ratingDistribution as Record<number, number>
    const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    reviews.forEach((r) => {
      const key = Math.round(r.overallRating)
      if (key >= 1 && key <= 5) dist[key]++
    })
    return dist
  }, [data, reviews])

  const totalForDist = Object.values(ratingDist).reduce((a, b) => a + b, 0)

  function invalidateReviews() {
    queryClient.invalidateQueries({ queryKey: ['reviews'] })
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Avaliações</h1>
          <p className="mt-0.5 text-sm text-gray-500">Satisfação dos hóspedes e reputação do resort</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          title="Total Avaliações"
          value={stats.total ?? 0}
          icon={<Star size={22} />}
          className="border-l-4 border-l-primary"
        />
        <StatCard
          title="Nota Média"
          value={
            <div className="flex items-center gap-2">
              <span>{typeof stats.avg === 'number' ? stats.avg.toFixed(1) : '—'}</span>
              {typeof stats.avg === 'number' && stats.avg > 0 && (
                <StarDisplay rating={stats.avg} size="sm" />
              )}
            </div>
          }
          icon={<Star size={22} />}
          className="border-l-4 border-l-yellow-400"
        />
        <StatCard
          title="Últimos 30 Dias"
          value={stats.recent ?? 0}
          icon={<MessageSquare size={22} />}
          className="border-l-4 border-l-green-500"
        />
        <StatCard
          title="Respondidas"
          value={stats.responded ?? 0}
          icon={<MessageSquare size={22} />}
          className="border-l-4 border-l-sky-500"
        />
      </div>

      {/* Rating distribution */}
      <Card>
        <h2 className="mb-4 text-sm font-semibold text-gray-700">Distribuição de Notas</h2>
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((star) => (
            <RatingBar
              key={star}
              star={star}
              count={ratingDist[star] ?? 0}
              total={totalForDist}
            />
          ))}
        </div>
      </Card>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Status filter tabs */}
        <div className="flex items-center gap-2">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setStatusFilter(tab.key); setPage(1) }}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                statusFilter === tab.key
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Star filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-medium">Nota:</span>
          {[0, 5, 4, 3, 2, 1].map((r) => (
            <button
              key={r}
              onClick={() => { setRatingFilter(r); setPage(1) }}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors flex items-center gap-1 ${
                ratingFilter === r
                  ? 'bg-yellow-400 text-gray-900 shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {r === 0 ? (
                'Todas'
              ) : (
                <>
                  {r}
                  <Star className="h-3 w-3 fill-current" />
                </>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews list */}
      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-gray-400">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
            <span className="text-sm">A carregar avaliações...</span>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} onRespondSuccess={invalidateReviews} />
          ))}
          {reviews.length === 0 && (
            <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-gray-200 text-gray-400">
              Sem avaliações para os filtros selecionados.
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Anterior
          </Button>
          <span className="px-2 text-sm text-gray-600">
            Página <span className="font-medium">{page}</span> de{' '}
            <span className="font-medium">{totalPages}</span>
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
            Seguinte
          </Button>
        </div>
      )}
    </div>
  )
}
