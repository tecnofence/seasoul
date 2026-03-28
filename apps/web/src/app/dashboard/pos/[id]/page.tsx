'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatKwanza, formatDateTime } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  ArrowLeft,
  Banknote,
  CreditCard,
  ArrowLeftRight,
  Smartphone,
  User,
  BedDouble,
  Calendar,
  FileText,
  Printer,
  XCircle,
  CheckCircle,
  Eye,
  AlertTriangle,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER' | 'MULTICAIXA'
type SaleStatus = 'PENDING' | 'INVOICED' | 'CANCELLED'

interface SaleItem {
  id: string
  product: { name: string }
  quantity: number
  unitPrice: number
  taxRate: number
  totalPrice: number
}

interface Sale {
  id: string
  createdAt: string
  paymentMethod: PaymentMethod
  status: SaleStatus
  totalAmount: number
  taxAmount: number
  subtotal?: number
  invoiceNumber?: string
  invoiceId?: string
  notes?: string
  staff?: { name: string }
  room?: { number: string }
  table?: { name: string }
  items: SaleItem[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_VARIANT: Record<SaleStatus, 'success' | 'warning' | 'danger'> = {
  PENDING: 'warning',
  INVOICED: 'success',
  CANCELLED: 'danger',
}

const STATUS_LABEL: Record<SaleStatus, string> = {
  PENDING: 'Pendente',
  INVOICED: 'Faturado',
  CANCELLED: 'Cancelado',
}

const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  CASH: 'Numerário',
  CARD: 'Cartão',
  TRANSFER: 'Transferência',
  MULTICAIXA: 'Multicaixa',
}

function PaymentIcon({ method }: { method: PaymentMethod }) {
  const cls = 'h-4 w-4'
  if (method === 'CASH') return <Banknote className={cls} />
  if (method === 'CARD') return <CreditCard className={cls} />
  if (method === 'TRANSFER') return <ArrowLeftRight className={cls} />
  return <Smartphone className={cls} />
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

function ConfirmDialog({
  open,
  title,
  description,
  onConfirm,
  onCancel,
  loading,
}: {
  open: boolean
  title: string
  description: string
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        </div>
        <p className="mb-5 text-sm text-gray-600">{description}</p>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onCancel} disabled={loading}>
            Voltar
          </Button>
          <Button variant="danger" className="flex-1" onClick={onConfirm} disabled={loading}>
            {loading ? 'A cancelar...' : 'Confirmar'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PosSaleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [showCancelDialog, setShowCancelDialog] = useState(false)

  const { data, isLoading, isError } = useQuery<Sale>({
    queryKey: ['pos-sale', id],
    queryFn: () => api.get(`/pos/${id}`).then((r) => r.data?.data ?? r.data),
  })

  const invoiceMutation = useMutation({
    mutationFn: () => api.patch(`/pos/${id}`, { status: 'INVOICED' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pos-sale', id] })
      router.push(`/dashboard/invoicing/new?saleId=${id}`)
    },
  })

  const cancelMutation = useMutation({
    mutationFn: () => api.patch(`/pos/${id}`, { status: 'CANCELLED' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pos-sale', id] })
      queryClient.invalidateQueries({ queryKey: ['pos-list'] })
      setShowCancelDialog(false)
    },
  })

  // ── Derived values ──────────────────────────────────────────────────────────

  const items: SaleItem[] = data?.items ?? []
  const subtotal =
    data?.subtotal ??
    items.reduce((acc, item) => acc + Number(item.unitPrice) * Number(item.quantity), 0)
  const taxAmount = data?.taxAmount ?? 0
  const totalAmount = data?.totalAmount ?? 0

  // ── Loading / error states ──────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-gray-400">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
          <span className="text-sm">A carregar venda...</span>
        </div>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <p className="text-sm text-gray-500">Erro ao carregar a venda.</p>
        <Link href="/dashboard/pos">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao POS
          </Button>
        </Link>
      </div>
    )
  }

  const sale = data

  return (
    <>
      <ConfirmDialog
        open={showCancelDialog}
        title="Cancelar venda?"
        description="Esta acção é irreversível. A venda será marcada como cancelada e não poderá ser faturada."
        onConfirm={() => cancelMutation.mutate()}
        onCancel={() => setShowCancelDialog(false)}
        loading={cancelMutation.isPending}
      />

      <div className="space-y-6">
        {/* ── Header ── */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard/pos">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Venda{' '}
              <span className="font-mono text-primary">
                #{sale.id.slice(-8).toUpperCase()}
              </span>
            </h1>
            <p className="mt-0.5 text-sm text-gray-500">
              {formatDateTime(sale.createdAt)}
            </p>
          </div>
          <div className="ml-auto">
            <Badge variant={STATUS_VARIANT[sale.status]}>
              {STATUS_LABEL[sale.status]}
            </Badge>
          </div>
        </div>

        {/* ── 2-column layout ── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* ── LEFT column (2/3) ── */}
          <div className="space-y-6 lg:col-span-2">
            {/* Sale info card */}
            <Card>
              <CardHeader>
                <CardTitle>Informação da Venda</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
                  <div>
                    <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gray-500">
                      <Calendar className="h-3.5 w-3.5" /> Data / Hora
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-gray-900">
                      {formatDateTime(sale.createdAt)}
                    </dd>
                  </div>
                  <div>
                    <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gray-500">
                      <PaymentIcon method={sale.paymentMethod} /> Pagamento
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-gray-900">
                      {PAYMENT_LABEL[sale.paymentMethod] ?? sale.paymentMethod}
                    </dd>
                  </div>
                  {sale.staff && (
                    <div>
                      <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gray-500">
                        <User className="h-3.5 w-3.5" /> Colaborador
                      </dt>
                      <dd className="mt-1 text-sm font-medium text-gray-900">
                        {sale.staff.name}
                      </dd>
                    </div>
                  )}
                  {(sale.room || sale.table) && (
                    <div>
                      <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gray-500">
                        <BedDouble className="h-3.5 w-3.5" />{' '}
                        {sale.room ? 'Quarto' : 'Mesa'}
                      </dt>
                      <dd className="mt-1 text-sm font-medium text-gray-900">
                        {sale.room?.number ?? sale.table?.name}
                      </dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>

            {/* Items table */}
            <Card className="p-0">
              <div className="border-b px-6 py-4">
                <CardTitle>Artigos</CardTitle>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50 text-left">
                      <th className="px-6 py-3 font-medium text-gray-500">Produto</th>
                      <th className="px-4 py-3 text-center font-medium text-gray-500">Qty</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-500">
                        Preço Unit.
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-gray-500">IVA %</th>
                      <th className="px-6 py-3 text-right font-medium text-gray-500">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {items.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                          Sem artigos registados
                        </td>
                      </tr>
                    )}
                    {items.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3 font-medium text-gray-900">
                          {item.product?.name ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-700">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-700">
                          {formatKwanza(item.unitPrice)}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-500">
                          {parseFloat(String(item.taxRate))}%
                        </td>
                        <td className="px-6 py-3 text-right font-semibold text-gray-900">
                          {formatKwanza(item.totalPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-gray-200 bg-gray-50">
                    <tr>
                      <td colSpan={4} className="px-6 py-2 text-right text-sm text-gray-500">
                        Subtotal
                      </td>
                      <td className="px-6 py-2 text-right text-sm font-medium text-gray-900">
                        {formatKwanza(subtotal)}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={4} className="px-6 py-2 text-right text-sm text-gray-500">
                        IVA (14%)
                      </td>
                      <td className="px-6 py-2 text-right text-sm font-medium text-gray-700">
                        {formatKwanza(taxAmount)}
                      </td>
                    </tr>
                    <tr className="border-t border-gray-200">
                      <td colSpan={4} className="px-6 py-3 text-right text-base font-bold text-gray-900">
                        TOTAL
                      </td>
                      <td className="px-6 py-3 text-right text-base font-bold text-primary">
                        {formatKwanza(totalAmount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Card>

            {/* Notes */}
            {sale.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-400" /> Notas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 leading-relaxed">{sale.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* ── RIGHT column (1/3) ── */}
          <div className="space-y-4">
            {/* Status & Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Estado</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Estado actual</span>
                  <Badge variant={STATUS_VARIANT[sale.status]}>
                    {STATUS_LABEL[sale.status]}
                  </Badge>
                </div>

                {sale.status === 'PENDING' && (
                  <div className="space-y-2 border-t pt-4">
                    <Button
                      className="w-full"
                      onClick={() => invoiceMutation.mutate()}
                      disabled={invoiceMutation.isPending}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      {invoiceMutation.isPending ? 'A processar...' : 'Emitir Fatura'}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                      onClick={() => setShowCancelDialog(true)}
                      disabled={cancelMutation.isPending}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Cancelar Venda
                    </Button>
                  </div>
                )}

                {sale.status === 'INVOICED' && (
                  <div className="space-y-3 border-t pt-4">
                    {sale.invoiceNumber && (
                      <div className="rounded-lg bg-green-50 px-4 py-3">
                        <p className="text-xs text-green-600 font-medium">Nº de Fatura</p>
                        <p className="mt-0.5 font-mono text-sm font-bold text-green-800">
                          {sale.invoiceNumber}
                        </p>
                      </div>
                    )}
                    {sale.invoiceId && (
                      <Link href={`/dashboard/invoicing/${sale.invoiceId}`}>
                        <Button variant="outline" className="w-full">
                          <Eye className="mr-2 h-4 w-4" />
                          Ver Fatura
                        </Button>
                      </Link>
                    )}
                  </div>
                )}

                {sale.status === 'CANCELLED' && (
                  <div className="rounded-lg bg-red-50 px-4 py-3 border-t mt-4">
                    <p className="text-xs font-medium text-red-700">
                      Esta venda foi cancelada e não pode ser alterada.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment info */}
            <Card>
              <CardHeader>
                <CardTitle>Pagamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Método</span>
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-900">
                    <PaymentIcon method={sale.paymentMethod} />
                    {PAYMENT_LABEL[sale.paymentMethod] ?? sale.paymentMethod}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t pt-3">
                  <span className="text-sm font-medium text-gray-700">Valor Total</span>
                  <span className="text-base font-bold text-primary">
                    {formatKwanza(totalAmount)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Print */}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.print()}
            >
              <Printer className="mr-2 h-4 w-4" />
              Imprimir Recibo
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
