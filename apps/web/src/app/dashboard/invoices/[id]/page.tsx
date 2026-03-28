'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Printer, FileCheck, XCircle, ShieldCheck } from 'lucide-react'
import api from '@/lib/api'
import { cn, formatKwanza, formatDateTime } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

// ─── Types ────────────────────────────────────────────────────────────────────

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number | string
  total: number | string
  vatRate: number | string
}

interface Invoice {
  id: string
  invoiceNumber: string
  createdAt: string
  status: 'DRAFT' | 'ISSUED' | 'CANCELLED'
  totalAmount: number | string
  taxAmount: number | string
  subtotal: number | string
  resort: { name: string }
  items: InvoiceItem[]
  hashValue?: string
  hashChain?: string
  qrCode?: string
}

// ─── Status helpers ────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<Invoice['status'], string> = {
  DRAFT: 'Rascunho',
  ISSUED: 'Emitida',
  CANCELLED: 'Anulada',
}

const STATUS_CLASSES: Record<Invoice['status'], string> = {
  DRAFT: 'bg-amber-100 text-amber-800 border-amber-200',
  ISSUED: 'bg-green-100 text-green-800 border-green-200',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200',
}

function StatusBadge({ status }: { status: Invoice['status'] }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        STATUS_CLASSES[status],
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [actionError, setActionError] = useState('')

  // Fetch invoice
  const { data, isLoading, isError } = useQuery<Invoice>({
    queryKey: ['invoice', id],
    queryFn: () => api.get(`/invoices/${id}`).then((r) => r.data.data ?? r.data),
    enabled: !!id,
  })

  // Status update mutation (issue or cancel)
  const statusMutation = useMutation({
    mutationFn: (status: 'ISSUED' | 'CANCELLED') =>
      api.patch(`/invoices/${id}`, { status }),
    onSuccess: () => {
      setActionError('')
      queryClient.invalidateQueries({ queryKey: ['invoice', id] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
    onError: (err: any) => {
      setActionError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          'Erro ao actualizar fatura.',
      )
    },
  })

  const handleCancel = () => {
    const confirmed = window.confirm(
      'Tem a certeza que deseja anular esta fatura? Esta acção é irreversível.',
    )
    if (confirmed) statusMutation.mutate('CANCELLED')
  }

  // ── Loading / error states ──────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        A carregar fatura...
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="space-y-4">
        <Link
          href="/dashboard/invoices"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Faturas
        </Link>
        <div className="rounded-md bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-700">Fatura não encontrada ou erro ao carregar.</p>
        </div>
      </div>
    )
  }

  const invoice = data
  const isPending = statusMutation.isPending

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/dashboard/invoices"
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Faturas
      </Link>

      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-mono text-3xl font-bold tracking-tight text-gray-900">
            {invoice.invoiceNumber}
          </h1>
          <StatusBadge status={invoice.status} />
        </div>
        <p className="text-sm text-gray-500">{formatDateTime(invoice.createdAt)}</p>
      </div>

      {/* ── Action error ─────────────────────────────────────────────────────── */}
      {actionError && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3">
          <p className="text-sm text-red-700">{actionError}</p>
        </div>
      )}

      {/* ── Resort info + Totals side by side ────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Resort info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-wide text-gray-500">
              Resort
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold text-gray-900">{invoice.resort?.name ?? '—'}</p>
          </CardContent>
        </Card>

        {/* Totals summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-wide text-gray-500">
              Resumo Financeiro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-1">
              <div className="flex justify-between text-sm text-gray-600">
                <dt>Subtotal</dt>
                <dd>{formatKwanza(invoice.subtotal)}</dd>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <dt>IVA (14%)</dt>
                <dd>{formatKwanza(invoice.taxAmount)}</dd>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-bold text-gray-900">
                <dt>Total</dt>
                <dd className="text-primary">{formatKwanza(invoice.totalAmount)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      {/* ── Items table ──────────────────────────────────────────────────────── */}
      <Card className="p-0">
        <div className="border-b border-gray-100 px-6 py-4">
          <CardTitle>Itens da Fatura</CardTitle>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-gray-600">Descrição</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Qtd</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Preço Unit.</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">IVA %</th>
                <th className="px-6 py-3 text-right font-medium text-gray-600">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {invoice.items?.length ? (
                invoice.items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/60">
                    <td className="px-6 py-3 text-gray-900">{item.description}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-700">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-700">
                      {formatKwanza(item.unitPrice)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-700">
                      {Number(item.vatRate)}%
                    </td>
                    <td className="px-6 py-3 text-right tabular-nums font-medium text-gray-900">
                      {formatKwanza(item.total)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                    Sem itens registados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer totals */}
        <div className="border-t border-gray-100 bg-gray-50/50 px-6 py-4">
          <div className="ml-auto max-w-xs space-y-1.5">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatKwanza(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>IVA (14%)</span>
              <span className="tabular-nums">{formatKwanza(invoice.taxAmount)}</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-bold text-gray-900">
              <span>Total</span>
              <span className="tabular-nums text-primary">{formatKwanza(invoice.totalAmount)}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* ── Hash / Integrity section ──────────────────────────────────────────── */}
      {invoice.hashValue && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <CardTitle>Integridade AGT</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-gray-600 w-28 shrink-0">Hash:</span>
                <code className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-800 break-all">
                  {invoice.hashValue.slice(0, 20)}...
                </code>
              </div>
              {invoice.hashChain && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-gray-600 w-28 shrink-0">Hash anterior:</span>
                  <code className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-800 break-all">
                    {invoice.hashChain.slice(0, 20)}...
                  </code>
                </div>
              )}
              {invoice.qrCode && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-gray-600 w-28 shrink-0">QR Code:</span>
                  <code className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-800 break-all">
                    {invoice.qrCode.slice(0, 20)}...
                  </code>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Action buttons ────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 border-t border-gray-100 pt-4">
        {invoice.status === 'DRAFT' && (
          <Button
            onClick={() => statusMutation.mutate('ISSUED')}
            disabled={isPending}
            className="gap-2"
          >
            <FileCheck className="h-4 w-4" />
            {isPending ? 'A emitir...' : 'Emitir Fatura'}
          </Button>
        )}

        {invoice.status === 'ISSUED' && (
          <>
            <Button
              variant="outline"
              onClick={() => window.print()}
              className="gap-2"
            >
              <Printer className="h-4 w-4" />
              Exportar PDF
            </Button>

            <Button
              variant="danger"
              onClick={handleCancel}
              disabled={isPending}
              className="gap-2"
            >
              <XCircle className="h-4 w-4" />
              {isPending ? 'A anular...' : 'Anular Fatura'}
            </Button>
          </>
        )}

        <Button variant="secondary" asChild={false} onClick={() => history.back()}>
          Voltar
        </Button>
      </div>
    </div>
  )
}
