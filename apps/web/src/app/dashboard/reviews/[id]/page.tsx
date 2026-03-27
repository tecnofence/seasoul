'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardTitle, CardContent } from '@/components/ui/card'
import { ArrowLeft, Star, MessageSquare } from 'lucide-react'

const CATEGORY_LABELS: Record<string, string> = {
  GENERAL: 'Geral',
  ROOM: 'Quarto',
  FOOD: 'Alimentação',
  SERVICE: 'Serviço',
  CLEANLINESS: 'Limpeza',
  FACILITIES: 'Instalações',
  LOCATION: 'Localização',
}

export default function ReviewDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [error, setError] = useState('')
  const [replyText, setReplyText] = useState('')
  const [showReplyBox, setShowReplyBox] = useState(false)

  const { data: review, isLoading, isError } = useQuery({
    queryKey: ['review', id],
    queryFn: () => api.get(`/reviews/${id}`).then((r) => r.data.data),
    enabled: !!id,
  })

  const replyMutation = useMutation({
    mutationFn: (reply: string) => api.post(`/reviews/${id}/reply`, { reply }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review', id] })
      setShowReplyBox(false)
      setReplyText('')
      setError('')
    },
    onError: (err: any) => setError(err.response?.data?.error || 'Erro ao enviar resposta'),
  })

  const publishMutation = useMutation({
    mutationFn: (published: boolean) => api.patch(`/reviews/${id}`, { published }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review', id] })
      setError('')
    },
    onError: (err: any) => setError(err.response?.data?.error || 'Erro ao atualizar publicação'),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (isError || !review) {
    return (
      <div className="py-20 text-center">
        <p className="text-gray-500">Avaliação não encontrada.</p>
        <Button variant="secondary" className="mt-4" onClick={() => router.back()}>Voltar</Button>
      </div>
    )
  }

  const rating: number = review.rating ?? review.overallRating ?? 0

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="rounded-md p-1 text-gray-400 hover:text-gray-600">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{review.guestName}</h1>
            <p className="text-sm text-gray-500">{formatDate(review.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={review.published ? 'success' : 'default'}>
            {review.published ? 'Publicada' : 'Não Publicada'}
          </Badge>
          <Button
            size="sm"
            variant={review.published ? 'secondary' : 'primary'}
            onClick={() => publishMutation.mutate(!review.published)}
            disabled={publishMutation.isPending}
          >
            {review.published ? 'Despublicar' : 'Publicar'}
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Detalhes da avaliação */}
        <Card>
          <CardTitle className="mb-4">Avaliação</CardTitle>
          <CardContent>
            <dl className="space-y-3">
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <dt className="text-sm text-gray-500">Hóspede</dt>
                <dd className="text-sm font-medium">{review.guestName}</dd>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <dt className="text-sm text-gray-500">Categoria</dt>
                <dd className="text-sm font-medium">{CATEGORY_LABELS[review.category] || review.category}</dd>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <dt className="text-sm text-gray-500">Data</dt>
                <dd className="text-sm font-medium">{formatDate(review.createdAt)}</dd>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <dt className="text-sm text-gray-500">Classificação</dt>
                <dd className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                    />
                  ))}
                  <span className="ml-1 text-sm font-medium text-gray-700">{rating}/5</span>
                </dd>
              </div>
              {review.reservationId && (
                <div className="flex justify-between border-b border-gray-100 pb-2">
                  <dt className="text-sm text-gray-500">Reserva</dt>
                  <dd className="text-sm font-medium">{review.reservationId}</dd>
                </div>
              )}
            </dl>

            {review.comment && (
              <div className="mt-4">
                <p className="mb-1 text-sm font-medium text-gray-700">Comentário</p>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{review.comment}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resposta da gestão */}
        <Card>
          <CardTitle className="mb-4 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Resposta da Gestão
          </CardTitle>
          <CardContent>
            {review.reply ? (
              <div className="rounded-md bg-gray-50 p-4">
                <p className="text-xs font-medium text-gray-500 mb-2">Resposta registada</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{review.reply}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Ainda sem resposta da gestão.</p>
            )}

            {!showReplyBox ? (
              <Button
                size="sm"
                variant="secondary"
                className="mt-4"
                onClick={() => {
                  setReplyText(review.reply || '')
                  setShowReplyBox(true)
                }}
              >
                {review.reply ? 'Editar Resposta' : 'Responder'}
              </Button>
            ) : (
              <div className="mt-4 space-y-3">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm min-h-[100px]"
                  placeholder="Escreva a resposta da gestão..."
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => replyMutation.mutate(replyText)}
                    disabled={replyMutation.isPending || !replyText.trim()}
                  >
                    {replyMutation.isPending ? 'A enviar...' : 'Enviar Resposta'}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => { setShowReplyBox(false); setError('') }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
