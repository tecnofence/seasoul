'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatKwanza, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { ArrowLeft, Printer, XCircle, AlertTriangle } from 'lucide-react'

const DOC_LABELS: Record<string, string> = {
  FT: 'Fatura', FR: 'Fatura-Recibo', NC: 'Nota de Crédito',
  ND: 'Nota de Débito', ORC: 'Orçamento', PF: 'Proforma',
  RC: 'Recibo', GT: 'Guia Transporte', AM: 'Auto Medição', CS: 'Contrato',
}

const DOC_COLORS: Record<string, string> = {
  FT: 'bg-blue-100 text-blue-800', FR: 'bg-green-100 text-green-800',
  NC: 'bg-red-100 text-red-800', ND: 'bg-orange-100 text-orange-800',
  ORC: 'bg-purple-100 text-purple-800', PF: 'bg-indigo-100 text-indigo-800',
  RC: 'bg-teal-100 text-teal-800', GT: 'bg-yellow-100 text-yellow-800',
  AM: 'bg-cyan-100 text-cyan-800', CS: 'bg-pink-100 text-pink-800',
}

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [error, setError] = useState('')

  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => api.get(`/invoicing/${id}`).then((r) => r.data.data),
  })

  const cancelMutation = useMutation({
    mutationFn: () => api.patch(`/invoicing/${id}/cancel`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] })
      setError('')
    },
    onError: (err: any) => setError(err.response?.data?.error || 'Erro ao anular documento'),
  })

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center text-gray-500">A carregar...</div>
  }

  if (!invoice) {
    return <div className="flex h-64 items-center justify-center text-gray-500">Documento não encontrado</div>
  }

  const items = invoice.items ?? []
  const subtotal = items.reduce((sum: number, item: any) => {
    const base = Number(item.quantity) * Number(item.unitPrice)
    const afterDiscount = base * (1 - Number(item.discount || 0) / 100)
    return sum + afterDiscount
  }, 0)
  const taxTotal = items.reduce((sum: number, item: any) => {
    const base = Number(item.quantity) * Number(item.unitPrice)
    const afterDiscount = base * (1 - Number(item.discount || 0) / 100)
    return sum + afterDiscount * (Number(item.taxRate || 0) / 100)
  }, 0)
  const total = Number(invoice.totalAmount) || subtotal + taxTotal

  const isCancelled = !!invoice.cancelledAt
  const isPaid = !!invoice.paidAt

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className={`rounded px-2 py-0.5 text-xs font-medium ${DOC_COLORS[invoice.documentType] ?? 'bg-gray-100'}`}>
                {invoice.documentType}
              </span>
              <h1 className="text-2xl font-bold">{invoice.fullNumber}</h1>
              {invoice.isTraining && (
                <Badge variant="warning">TREINO</Badge>
              )}
            </div>
            <p className="text-sm text-gray-500">
              {DOC_LABELS[invoice.documentType] ?? invoice.documentType} — {formatDate(invoice.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isCancelled ? (
            <Badge variant="danger">Anulada</Badge>
          ) : isPaid ? (
            <Badge variant="success">Paga</Badge>
          ) : (
            <Badge variant="info">Emitida</Badge>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Informação do cliente */}
        <Card className="lg:col-span-2">
          <CardTitle>Dados do Cliente</CardTitle>
          <CardContent>
            <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-gray-500">Nome</dt>
                <dd className="font-medium">{invoice.clientName}</dd>
              </div>
              <div>
                <dt className="text-gray-500">NIF</dt>
                <dd>{invoice.clientNif || '—'}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-gray-500">Morada</dt>
                <dd>{invoice.clientAddress || '—'}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Ações */}
        <Card>
          <CardTitle>Ações</CardTitle>
          <CardContent className="space-y-3">
            <Button
              className="w-full"
              onClick={() => window.print()}
            >
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Button>

            {!isCancelled && !isPaid && (
              <Button
                variant="danger"
                className="w-full"
                onClick={() => {
                  if (confirm('Tem a certeza que quer anular este documento? Esta ação não pode ser revertida.')) {
                    cancelMutation.mutate()
                  }
                }}
                disabled={cancelMutation.isPending}
              >
                <XCircle className="mr-2 h-4 w-4" />
                {cancelMutation.isPending ? 'A anular...' : 'Anular Documento'}
              </Button>
            )}

            <Button
              variant="ghost"
              className="w-full"
              onClick={() => router.push('/dashboard/invoicing')}
            >
              Voltar à Lista
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de itens */}
      <Card>
        <CardTitle>Itens</CardTitle>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Qtd</TableHead>
                <TableHead className="text-right">Preço Unit.</TableHead>
                <TableHead className="text-right">IVA %</TableHead>
                <TableHead className="text-right">Desc %</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item: any, index: number) => {
                const base = Number(item.quantity) * Number(item.unitPrice)
                const afterDiscount = base * (1 - Number(item.discount || 0) / 100)
                const tax = afterDiscount * (Number(item.taxRate || 0) / 100)
                const itemTotal = afterDiscount + tax

                return (
                  <TableRow key={item.id || index}>
                    <TableCell className="font-medium">{item.description}</TableCell>
                    <TableCell className="text-right">{Number(item.quantity)}</TableCell>
                    <TableCell className="text-right">{formatKwanza(Number(item.unitPrice))}</TableCell>
                    <TableCell className="text-right">{Number(item.taxRate || 0)}%</TableCell>
                    <TableCell className="text-right">{Number(item.discount || 0)}%</TableCell>
                    <TableCell className="text-right font-medium">{formatKwanza(itemTotal)}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Resumo financeiro */}
      <Card className="mx-auto max-w-md">
        <CardTitle>Resumo</CardTitle>
        <CardContent>
          <dl className="space-y-3">
            <div className="flex justify-between text-sm">
              <dt className="text-gray-500">Subtotal</dt>
              <dd className="font-medium">{formatKwanza(subtotal)}</dd>
            </div>
            <div className="flex justify-between text-sm">
              <dt className="text-gray-500">IVA</dt>
              <dd className="font-medium">{formatKwanza(taxTotal)}</dd>
            </div>
            <div className="border-t pt-3">
              <div className="flex justify-between text-lg font-bold">
                <dt>Total</dt>
                <dd className="text-primary">{formatKwanza(total)}</dd>
              </div>
            </div>
          </dl>

          {invoice.isTraining && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
              <AlertTriangle className="h-4 w-4" />
              <span>Documento emitido em modo de formação. Sem valor fiscal.</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notas */}
      {invoice.notes && (
        <Card>
          <CardTitle>Observações</CardTitle>
          <CardContent>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
