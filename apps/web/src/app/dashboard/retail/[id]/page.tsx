'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatKwanza, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardTitle, CardContent } from '@/components/ui/card'
import { ArrowLeft, ShoppingCart, Receipt } from 'lucide-react'

const ANGOLA_TAX_RATE = 0.14

const STATUS_VARIANT: Record<string, 'warning' | 'success' | 'danger'> = {
  PENDING: 'warning',
  INVOICED: 'success',
  CANCELLED: 'danger',
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendente',
  INVOICED: 'Faturado',
  CANCELLED: 'Cancelado',
}

export default function RetailDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const { data: order, isLoading } = useQuery({
    queryKey: ['retail', id],
    queryFn: () => api.get(`/retail/${id}`).then((r) => r.data.data),
  })

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center text-gray-500">A carregar...</div>
  }

  if (!order) {
    return <div className="flex h-64 items-center justify-center text-gray-500">Registo não encontrado</div>
  }

  const status = order.status ?? 'PENDING'
  const items: any[] = order.items ?? []

  const subtotal = items.reduce((sum: number, item: any) => {
    const lineTotal = Number(item.total ?? item.unitPrice * item.quantity ?? 0)
    return sum + lineTotal
  }, 0)

  const taxAmount = subtotal * ANGOLA_TAX_RATE
  const total = subtotal + taxAmount

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">
            Encomenda — {order.orderNumber ?? `#${id.slice(0, 8).toUpperCase()}`}
          </h1>
          <p className="text-sm text-gray-500">{order.date ? formatDate(order.date) : '—'}</p>
        </div>
        <Badge variant={STATUS_VARIANT[status] ?? 'default'}>
          {STATUS_LABEL[status] ?? status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardTitle>Informações</CardTitle>
          <CardContent>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <dt className="text-gray-500">Nº da Encomenda</dt>
                <dd className="font-mono font-medium">{order.orderNumber ?? '—'}</dd>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <dt className="text-gray-500">Cliente</dt>
                <dd className="font-medium">{order.clientName ?? order.client?.name ?? '—'}</dd>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <dt className="text-gray-500">Data</dt>
                <dd>{order.date ? formatDate(order.date) : '—'}</dd>
              </div>
              <div className="flex justify-between">
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

        <Card className="lg:col-span-2">
          <CardTitle>
            <ShoppingCart className="mr-2 inline h-5 w-5 text-primary" />
            Artigos
          </CardTitle>
          <CardContent>
            {items.length === 0 ? (
              <p className="text-sm text-gray-400">Nenhum artigo encontrado.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-500">
                    <th className="pb-2 font-medium">Produto</th>
                    <th className="pb-2 text-right font-medium">Qtd.</th>
                    <th className="pb-2 text-right font-medium">P. Unit.</th>
                    <th className="pb-2 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item: any, i: number) => (
                    <tr key={item.id ?? i}>
                      <td className="py-2 font-medium">{item.productName ?? item.name ?? '—'}</td>
                      <td className="py-2 text-right">{item.quantity}</td>
                      <td className="py-2 text-right">{formatKwanza(item.unitPrice)}</td>
                      <td className="py-2 text-right font-medium">
                        {formatKwanza(item.total ?? item.unitPrice * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div className="mt-4 space-y-2 border-t border-gray-200 pt-4 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
                <span>{formatKwanza(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>IVA (14%)</span>
                <span>{formatKwanza(taxAmount)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-bold">
                <span>
                  <Receipt className="mr-1 inline h-4 w-4 text-primary" />
                  Total
                </span>
                <span className="text-primary">{formatKwanza(total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
