'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatKwanza } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardTitle, CardContent } from '@/components/ui/card'
import { Plus, Minus, Trash2 } from 'lucide-react'

interface CartItem {
  productId: string
  name: string
  unitPrice: number
  taxRate: number
  qty: number
}

export default function NewSalePage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [resortId, setResortId] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const { data: products } = useQuery({
    queryKey: ['products-active'],
    queryFn: () => api.get('/products', { params: { limit: 100, active: true } }).then((r) => r.data.data),
  })

  const filteredProducts = (products || []).filter((p: any) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  function addToCart(product: any) {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id)
      if (existing) {
        return prev.map((i) => i.productId === product.id ? { ...i, qty: i.qty + 1 } : i)
      }
      return [...prev, {
        productId: product.id,
        name: product.name,
        unitPrice: parseFloat(product.unitPrice),
        taxRate: parseFloat(product.taxRate),
        qty: 1,
      }]
    })
  }

  function updateQty(productId: string, delta: number) {
    setCart((prev) => prev
      .map((i) => i.productId === productId ? { ...i, qty: Math.max(0, i.qty + delta) } : i)
      .filter((i) => i.qty > 0)
    )
  }

  function removeItem(productId: string) {
    setCart((prev) => prev.filter((i) => i.productId !== productId))
  }

  const subtotal = cart.reduce((sum, i) => sum + i.unitPrice * i.qty, 0)
  const taxTotal = cart.reduce((sum, i) => sum + i.unitPrice * i.qty * (i.taxRate / 100), 0)
  const total = subtotal + taxTotal

  const mutation = useMutation({
    mutationFn: () => api.post('/pos', {
      resortId,
      paymentMethod,
      items: cart.map((i) => ({
        productId: i.productId,
        qty: i.qty,
        unitPrice: i.unitPrice,
        taxRate: i.taxRate,
      })),
    }),
    onSuccess: () => router.push('/dashboard/pos'),
    onError: (err: any) => setError(err.response?.data?.error || 'Erro ao registar venda'),
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Nova Venda</h1>

      {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Produtos */}
        <div className="lg:col-span-2 space-y-4">
          <Input
            placeholder="Pesquisar produto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {filteredProducts.map((p: any) => (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                className="rounded-lg border bg-white p-3 text-left transition hover:border-primary hover:shadow-sm"
              >
                <p className="text-sm font-medium truncate">{p.name}</p>
                <p className="text-xs text-gray-500">{p.category}</p>
                <p className="mt-1 text-sm font-semibold text-primary">{formatKwanza(p.unitPrice)}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Carrinho */}
        <Card className="sticky top-6">
          <CardTitle>Carrinho</CardTitle>
          <CardContent>
            <div className="mb-4">
              <label className="mb-1 block text-xs font-medium text-gray-500">Resort ID</label>
              <Input value={resortId} onChange={(e) => setResortId(e.target.value)} placeholder="ID do resort" className="text-sm" />
            </div>

            {cart.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Carrinho vazio</p>
            ) : (
              <ul className="divide-y">
                {cart.map((item) => (
                  <li key={item.productId} className="flex items-center justify-between py-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-gray-500">{formatKwanza(item.unitPrice)} x {item.qty}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateQty(item.productId, -1)} className="rounded p-1 hover:bg-gray-100">
                        <Minus size={14} />
                      </button>
                      <span className="w-6 text-center text-sm">{item.qty}</span>
                      <button onClick={() => updateQty(item.productId, 1)} className="rounded p-1 hover:bg-gray-100">
                        <Plus size={14} />
                      </button>
                      <button onClick={() => removeItem(item.productId)} className="rounded p-1 text-red-500 hover:bg-red-50 ml-1">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4 space-y-1 border-t pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span>{formatKwanza(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">IVA</span>
                <span>{formatKwanza(taxTotal)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-1">
                <span>Total</span>
                <span className="text-primary">{formatKwanza(total)}</span>
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-1 block text-xs font-medium text-gray-500">Pagamento</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                <option value="CASH">Dinheiro</option>
                <option value="CARD">Cartão</option>
                <option value="TRANSFER">Transferência</option>
                <option value="ROOM_CHARGE">Débito no Quarto</option>
              </select>
            </div>

            <Button
              className="mt-4 w-full"
              size="lg"
              disabled={cart.length === 0 || !resortId || mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? 'A processar...' : `Finalizar Venda — ${formatKwanza(total)}`}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
