'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Star } from 'lucide-react'

export default function ReviewsPage() {
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['reviews', page],
    queryFn: () => api.get('/reviews', { params: { page, limit: 20 } }).then((r) => r.data),
  })

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center text-gray-500">A carregar avaliações...</div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Avaliações</h1>

      <div className="space-y-4">
        {data?.data?.map((review: any) => (
          <Card key={review.id}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{review.guestName}</p>
                  <Badge variant={review.published ? 'success' : 'default'}>
                    {review.published ? 'Publicada' : 'Rascunho'}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500">{formatDate(review.createdAt)}</p>
              </div>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${i < review.overallRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                  />
                ))}
              </div>
            </div>
            {review.comment && <p className="mt-3 text-gray-700">{review.comment}</p>}
            {review.reply && (
              <div className="mt-3 rounded-md bg-gray-50 p-3">
                <p className="text-xs font-medium text-gray-500">Resposta da gestão</p>
                <p className="mt-1 text-sm text-gray-700">{review.reply}</p>
              </div>
            )}
          </Card>
        ))}

        {!data?.data?.length && (
          <p className="text-center text-gray-500">Sem avaliações</p>
        )}
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</Button>
          <span className="text-sm text-gray-600">Página {page} de {data.totalPages}</span>
          <Button variant="secondary" size="sm" disabled={page >= data.totalPages} onClick={() => setPage(page + 1)}>Seguinte</Button>
        </div>
      )}
    </div>
  )
}
