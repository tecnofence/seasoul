'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatKwanza } from '@/lib/utils'
import { Plus, Trash2, ArrowLeft } from 'lucide-react'

const DOC_TYPES = [
  { code: 'FT', label: 'Fatura' },
  { code: 'FR', label: 'Fatura-Recibo' },
  { code: 'NC', label: 'Nota de Crédito' },
  { code: 'ND', label: 'Nota de Débito' },
  { code: 'ORC', label: 'Orçamento' },
  { code: 'PF', label: 'Proforma' },
  { code: 'RC', label: 'Recibo' },
  { code: 'GT', label: 'Guia de Transporte' },
  { code: 'AM', label: 'Auto de Medição' },
  { code: 'CS', label: 'Contrato de Serviço' },
]

type InvoiceItem = {
  description: string
  quantity: number
  unitPrice: number
  taxRate: number
  discount: number
  unit: string
}

const emptyItem: InvoiceItem = { description: '', quantity: 1, unitPrice: 0, taxRate: 14, discount: 0, unit: 'un' }

export default function NewInvoicePage() {
  const router = useRouter()
  const [docType, setDocType] = useState('FT')
  const [client, setClient] = useState({ name: '', nif: '', address: '', email: '', phone: '' })
  const [currency, setCurrency] = useState('AOA')
  const [paymentMethod, setPaymentMethod] = useState('TRANSFER')
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<InvoiceItem[]>([{ ...emptyItem }])

  const mutation = useMutation({
    mutationFn: (data: any) => api.post('/invoicing', data),
    onSuccess: (res) => router.push(`/dashboard/invoicing/${res.data.data.id}`),
  })

  const addItem = () => setItems([...items, { ...emptyItem }])
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i))
  const updateItem = (i: number, field: keyof InvoiceItem, value: string | number) => {
    const updated = [...items]
    updated[i] = { ...updated[i], [field]: value }
    setItems(updated)
  }

  // Calcular totais
  const calcItemTotal = (item: InvoiceItem) => {
    const base = item.quantity * item.unitPrice
    const afterDiscount = base * (1 - item.discount / 100)
    const tax = afterDiscount * (item.taxRate / 100)
    return afterDiscount + tax
  }

  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice * (1 - i.discount / 100), 0)
  const taxTotal = items.reduce((sum, i) => {
    const base = i.quantity * i.unitPrice * (1 - i.discount / 100)
    return sum + base * (i.taxRate / 100)
  }, 0)
  const total = subtotal + taxTotal

  const handleSubmit = () => {
    if (!client.name || items.length === 0 || items.some((i) => !i.description)) return

    mutation.mutate({
      documentType: docType,
      clientName: client.name,
      clientNif: client.nif || undefined,
      clientAddress: client.address || undefined,
      clientEmail: client.email || undefined,
      clientPhone: client.phone || undefined,
      currency,
      paymentMethod,
      dueDate: dueDate || undefined,
      notes: notes || undefined,
      items: items.map((i) => ({
        description: i.description,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        taxRate: i.taxRate,
        discount: i.discount,
        unit: i.unit,
      })),
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="rounded-md p-1 text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Novo Documento Fiscal</h1>
      </div>

      {/* Tipo de documento */}
      <div className="rounded-lg border bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">Tipo de Documento</h2>
        <div className="flex flex-wrap gap-2">
          {DOC_TYPES.map((dt) => (
            <button
              key={dt.code}
              onClick={() => setDocType(dt.code)}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                docType === dt.code ? 'border-primary bg-primary/10 text-primary' : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              {dt.code} — {dt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dados do cliente */}
      <div className="rounded-lg border bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">Cliente</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Nome *</label>
            <Input value={client.name} onChange={(e) => setClient({ ...client, name: e.target.value })} placeholder="Nome do cliente" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">NIF</label>
            <Input value={client.nif} onChange={(e) => setClient({ ...client, nif: e.target.value })} placeholder="5000000000" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Telefone</label>
            <Input value={client.phone} onChange={(e) => setClient({ ...client, phone: e.target.value })} placeholder="+244 900 000 000" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <Input value={client.email} onChange={(e) => setClient({ ...client, email: e.target.value })} placeholder="email@exemplo.ao" />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">Morada</label>
            <Input value={client.address} onChange={(e) => setClient({ ...client, address: e.target.value })} placeholder="Morada completa" />
          </div>
        </div>
      </div>

      {/* Itens */}
      <div className="rounded-lg border bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Itens</h2>
          <Button size="sm" onClick={addItem}><Plus className="mr-1 h-4 w-4" /> Adicionar Item</Button>
        </div>

        <div className="space-y-4">
          {items.map((item, i) => (
            <div key={i} className="grid grid-cols-1 gap-3 rounded-md border bg-gray-50 p-4 sm:grid-cols-12">
              <div className="sm:col-span-4">
                <label className="mb-1 block text-xs text-gray-500">Descrição *</label>
                <Input value={item.description} onChange={(e) => updateItem(i, 'description', e.target.value)} placeholder="Serviço ou produto" />
              </div>
              <div className="sm:col-span-1">
                <label className="mb-1 block text-xs text-gray-500">Qtd</label>
                <Input type="number" min={1} value={item.quantity} onChange={(e) => updateItem(i, 'quantity', Number(e.target.value))} />
              </div>
              <div className="sm:col-span-1">
                <label className="mb-1 block text-xs text-gray-500">Un.</label>
                <Input value={item.unit} onChange={(e) => updateItem(i, 'unit', e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs text-gray-500">Preço Unit.</label>
                <Input type="number" min={0} step={0.01} value={item.unitPrice} onChange={(e) => updateItem(i, 'unitPrice', Number(e.target.value))} />
              </div>
              <div className="sm:col-span-1">
                <label className="mb-1 block text-xs text-gray-500">IVA %</label>
                <Input type="number" min={0} value={item.taxRate} onChange={(e) => updateItem(i, 'taxRate', Number(e.target.value))} />
              </div>
              <div className="sm:col-span-1">
                <label className="mb-1 block text-xs text-gray-500">Desc %</label>
                <Input type="number" min={0} max={100} value={item.discount} onChange={(e) => updateItem(i, 'discount', Number(e.target.value))} />
              </div>
              <div className="flex items-end gap-2 sm:col-span-2">
                <div className="flex-1">
                  <label className="mb-1 block text-xs text-gray-500">Total</label>
                  <p className="py-2 font-semibold">{formatKwanza(calcItemTotal(item))}</p>
                </div>
                {items.length > 1 && (
                  <button onClick={() => removeItem(i)} className="mb-2 rounded p-1 text-red-400 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Totais + Opções */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">Opções</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Moeda</label>
              <select className="w-full rounded-md border px-3 py-2" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                <option value="AOA">AOA — Kwanza</option>
                <option value="USD">USD — Dólar</option>
                <option value="EUR">EUR — Euro</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Pagamento</label>
              <select className="w-full rounded-md border px-3 py-2" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <option value="TRANSFER">Transferência</option>
                <option value="CASH">Numerário</option>
                <option value="CARD">Cartão</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Data de Vencimento</label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">Observações</label>
            <textarea className="w-full rounded-md border px-3 py-2 text-sm" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas adicionais..." />
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">Resumo</h2>
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

          <Button
            className="mt-6 w-full"
            size="lg"
            onClick={handleSubmit}
            disabled={!client.name || items.length === 0 || mutation.isPending}
          >
            {mutation.isPending ? 'A emitir...' : `Emitir ${docType}`}
          </Button>

          {mutation.isError && (
            <p className="mt-2 text-center text-sm text-red-600">Erro ao emitir documento</p>
          )}
        </div>
      </div>
    </div>
  )
}
