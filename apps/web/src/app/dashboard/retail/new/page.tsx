'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatKwanza } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardTitle, CardContent } from '@/components/ui/card'
import { Plus, Trash2 } from 'lucide-react'

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Dinheiro' },
  { value: 'CARD', label: 'Cartão' },
  { value: 'TRANSFER', label: 'Transferência' },
  { value: 'MULTICAIXA', label: 'Multicaixa' },
]

const TAX_RATE = 0.14

interface SaleItem {
  name: string
  quantity: number
  unitPrice: number
}

export default function NewRetailSalePage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [storeId, setStoreId] = useState('')
  const [clientName, setClientName] = useState('')
  const [clientNif, setClientNif] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [items, setItems] = useState<SaleItem[]>([{ name: '', quantity: 1, unitPrice: 0 }])

  function addItem() {
    setItems((prev) => [...prev, { name: '', quantity: 1, unitPrice: 0 }])
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  function updateItem(index: number, field: keyof SaleItem, value: string | number) {
    setItems((prev) => prev.map((item, i) => i === index ? { ...item, [field]: value } : item))
  }

  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)
  const tax = subtotal * TAX_RATE
  const total = subtotal + tax

  const mutation = useMutation({
    mutationFn: () => api.post('/retail/sales', {
      storeId,
      clientName: clientName || undefined,
      clientNif: clientNif || undefined,
      paymentMethod,
      items: items.filter((i) => i.name && i.quantity > 0).map((i) => ({
        name: i.name,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
    }),
    onSuccess: () => router.push('/dashboard/retail'),
    onError: (err: any) => setError(err.response?.data?.error || 'Erro ao registar venda'),
  })

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Nova Venda — Retalho</h1>

      {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>}

      <Card>
        <CardTitle>Dados da Venda</CardTitle>
        <CardContent>
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Loja (ID)</label>
                <Input value={storeId} onChange={(e) => setStoreId(e.target.value)} placeholder="ID da loja" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Método de Pagamento</label>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Nome do Cliente</label>
                <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Nome (opcional)" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">NIF do Cliente</label>
                <Input value={clientNif} onChange={(e) => setClientNif(e.target.value)} placeholder="NIF (opcional)" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <CardTitle>Itens</CardTitle>
          <Button variant="ghost" onClick={addItem}><Plus className="mr-1 h-4 w-4" /> Adicionar Item</Button>
        </div>
        <CardContent>
          <div className="mt-4 space-y-3">
            {items.map((item, index) => (
              <div key={index} className="flex items-end gap-3">
                <div className="flex-1">
                  {index === 0 && <label className="mb-1 block text-xs font-medium text-gray-500">Nome</label>}
                  <Input value={item.name} onChange={(e) => updateItem(index, 'name', e.target.value)} placeholder="Nome do artigo" />
                </div>
                <div className="w-24">
                  {index === 0 && <label className="mb-1 block text-xs font-medium text-gray-500">Qtd.</label>}
                  <Input type="number" min={1} value={item.quantity} onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)} />
                </div>
                <div className="w-32">
                  {index === 0 && <label className="mb-1 block text-xs font-medium text-gray-500">Preço Unit.</label>}
                  <Input type="number" step="0.01" min={0} value={item.unitPrice} onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)} />
                </div>
                <div className="w-32 text-right">
                  {index === 0 && <label className="mb-1 block text-xs font-medium text-gray-500">Subtotal</label>}
                  <p className="h-10 flex items-center justify-end text-sm font-medium">{formatKwanza(item.unitPrice * item.quantity)}</p>
                </div>
                <button onClick={() => removeItem(index)} className="rounded p-2 text-red-500 hover:bg-red-50" disabled={items.length === 1}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-1 border-t pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span>{formatKwanza(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">IVA (14%)</span>
              <span>{formatKwanza(tax)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-1">
              <span>Total</span>
              <span className="text-primary">{formatKwanza(total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button disabled={!storeId || items.every((i) => !i.name) || mutation.isPending} onClick={() => mutation.mutate()}>
          {mutation.isPending ? 'A processar...' : 'Finalizar Venda'}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>Cancelar</Button>
      </div>
    </div>
  )
}
