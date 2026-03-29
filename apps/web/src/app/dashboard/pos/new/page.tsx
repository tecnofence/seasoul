'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatKwanza } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Minus, Trash2, ShoppingCart, Wifi, WifiOff, Calculator, User } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CartItem {
  productId: string
  name: string
  unitPrice: number
  taxRate: number
  qty: number
  category: string
}

interface Product {
  id: string
  name: string
  unitPrice: number | string
  taxRate: number | string
  category: string
  stockQty?: number
}

// ─── Category colour palette ──────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  'Alimentação':    'bg-orange-50 border-orange-200 text-orange-700',
  'Bebidas':        'bg-blue-50 border-blue-200 text-blue-700',
  'Spa':            'bg-purple-50 border-purple-200 text-purple-700',
  'Atividades':     'bg-green-50 border-green-200 text-green-700',
  'Alojamento':     'bg-indigo-50 border-indigo-200 text-indigo-700',
  'Loja':           'bg-pink-50 border-pink-200 text-pink-700',
  'Lavandaria':     'bg-teal-50 border-teal-200 text-teal-700',
}

function getCategoryStyle(cat: string) {
  return CATEGORY_COLORS[cat] ?? 'bg-gray-50 border-gray-200 text-gray-700'
}

// ─── Payment methods ──────────────────────────────────────────────────────────

const PAYMENT_OPTIONS = [
  { value: 'CASH',        label: '💵 Numerário',      showChange: true },
  { value: 'CARD',        label: '💳 Cartão',          showChange: false },
  { value: 'TRANSFER',    label: '🔄 Transferência',   showChange: false },
  { value: 'MULTICAIXA',  label: '📱 Multicaixa',      showChange: false },
  { value: 'ROOM_CHARGE', label: '🏨 Débito no Quarto', showChange: false },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function NewSalePage() {
  const router = useRouter()
  const [error, setError]           = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [loading, setLoading]       = useState(false)
  const [isOnline, setIsOnline]     = useState(true)

  // Carrinho persistido em localStorage
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const saved = localStorage.getItem('pos_cart')
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })

  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [resortId, setResortId]           = useState('')
  const [searchTerm, setSearchTerm]       = useState('')
  const [activeCategory, setActiveCategory] = useState('Todos')
  const [cashTendered, setCashTendered]   = useState('')
  const [roomNumber, setRoomNumber]       = useState('')
  const [offlineCount, setOfflineCount]   = useState(0)

  // ── Persistência ─────────────────────────────────────────────────────────

  useEffect(() => {
    localStorage.setItem('pos_cart', JSON.stringify(cart))
  }, [cart])

  useEffect(() => {
    const update = () => {
      setIsOnline(navigator.onLine)
      try {
        const q = JSON.parse(localStorage.getItem('pos_offline_queue') || '[]')
        setOfflineCount(q.length)
      } catch { setOfflineCount(0) }
    }
    update()
    window.addEventListener('online',  update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online',  update)
      window.removeEventListener('offline', update)
    }
  }, [])

  useEffect(() => {
    window.addEventListener('online', syncOfflineQueue)
    return () => window.removeEventListener('online', syncOfflineQueue)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Queries ───────────────────────────────────────────────────────────────

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['products-active'],
    queryFn: () => api.get('/products', { params: { limit: 200, active: true } }).then((r) => r.data.data ?? []),
  })

  const { data: resorts = [] } = useQuery<{ id: string; name: string }[]>({
    queryKey: ['resorts-list'],
    queryFn: () => api.get('/tenants').then((r) => r.data.data ?? r.data ?? []).catch(() => []),
    retry: 1,
  })

  // Pre-select first resort
  useEffect(() => {
    if (resorts.length > 0 && !resortId) setResortId(resorts[0].id)
  }, [resorts, resortId])

  // ── Derived data ──────────────────────────────────────────────────────────

  const categories = useMemo(() => {
    const cats = Array.from(new Set((products as Product[]).map((p) => p.category).filter(Boolean)))
    return ['Todos', ...cats]
  }, [products])

  const filteredProducts = useMemo(() => {
    return (products as Product[]).filter((p) => {
      const matchCategory = activeCategory === 'Todos' || p.category === activeCategory
      const matchSearch   = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            p.category.toLowerCase().includes(searchTerm.toLowerCase())
      return matchCategory && matchSearch
    })
  }, [products, activeCategory, searchTerm])

  const subtotal = cart.reduce((sum, i) => sum + i.unitPrice * i.qty, 0)
  const taxTotal = cart.reduce((sum, i) => sum + i.unitPrice * i.qty * (i.taxRate / 100), 0)
  const total    = subtotal + taxTotal

  const cashTenderedNum = parseFloat(cashTendered) || 0
  const change          = cashTenderedNum > 0 ? cashTenderedNum - total : 0

  const currentPayment = PAYMENT_OPTIONS.find((p) => p.value === paymentMethod)

  // ── Cart actions ──────────────────────────────────────────────────────────

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id)
      if (existing) {
        return prev.map((i) => i.productId === product.id ? { ...i, qty: i.qty + 1 } : i)
      }
      return [...prev, {
        productId: product.id,
        name:      product.name,
        unitPrice: parseFloat(String(product.unitPrice)),
        taxRate:   parseFloat(String(product.taxRate)),
        qty:       1,
        category:  product.category,
      }]
    })
  }

  function updateQty(productId: string, delta: number) {
    setCart((prev) =>
      prev.map((i) => i.productId === productId ? { ...i, qty: Math.max(0, i.qty + delta) } : i)
          .filter((i) => i.qty > 0)
    )
  }

  function setQtyDirect(productId: string, val: string) {
    const n = parseInt(val, 10)
    if (isNaN(n) || n < 0) return
    if (n === 0) {
      setCart((prev) => prev.filter((i) => i.productId !== productId))
    } else {
      setCart((prev) => prev.map((i) => i.productId === productId ? { ...i, qty: n } : i))
    }
  }

  function removeItem(productId: string) {
    setCart((prev) => prev.filter((i) => i.productId !== productId))
  }

  // ── Offline queue ─────────────────────────────────────────────────────────

  async function syncOfflineQueue() {
    try {
      const queue: any[] = JSON.parse(localStorage.getItem('pos_offline_queue') || '[]')
      if (queue.length === 0) return
      const remaining: any[] = []
      for (const item of queue) {
        try { await api.post('/pos/sales', item.payload) }
        catch { remaining.push(item) }
      }
      localStorage.setItem('pos_offline_queue', JSON.stringify(remaining))
      const synced = queue.length - remaining.length
      if (synced > 0) {
        setSuccessMsg(`${synced} venda(s) offline sincronizada(s).`)
        setOfflineCount(remaining.length)
        setTimeout(() => setSuccessMsg(''), 4000)
      }
    } catch { /* silent */ }
  }

  // ── Checkout ──────────────────────────────────────────────────────────────

  async function handleCheckout() {
    if (cart.length === 0) return
    setError('')
    setSuccessMsg('')
    setLoading(true)

    const payload: any = {
      resortId,
      paymentMethod,
      items: cart.map((i) => ({
        productId: i.productId,
        qty:       i.qty,
        unitPrice: i.unitPrice,
        taxRate:   i.taxRate,
      })),
    }
    if (paymentMethod === 'ROOM_CHARGE' && roomNumber) payload.roomNumber = roomNumber

    if (!navigator.onLine) {
      const offlineQueue: any[] = JSON.parse(localStorage.getItem('pos_offline_queue') || '[]')
      offlineQueue.push({ payload, timestamp: Date.now(), id: crypto.randomUUID() })
      localStorage.setItem('pos_offline_queue', JSON.stringify(offlineQueue))
      setCart([])
      localStorage.removeItem('pos_cart')
      setOfflineCount(offlineQueue.length)
      setSuccessMsg(`Venda guardada offline. ${offlineQueue.length} pendente(s).`)
      setTimeout(() => setSuccessMsg(''), 5000)
      setLoading(false)
      return
    }

    try {
      await api.post('/pos/sales', payload)
      setCart([])
      localStorage.removeItem('pos_cart')
      syncOfflineQueue()
      router.push('/dashboard/pos')
    } catch (err: any) {
      try {
        const offlineQueue: any[] = JSON.parse(localStorage.getItem('pos_offline_queue') || '[]')
        offlineQueue.push({ payload, timestamp: Date.now(), id: crypto.randomUUID() })
        localStorage.setItem('pos_offline_queue', JSON.stringify(offlineQueue))
        setCart([])
        localStorage.removeItem('pos_cart')
        setOfflineCount(offlineQueue.length)
        setSuccessMsg('API indisponível — venda guardada. Será sincronizada automaticamente.')
        setTimeout(() => setSuccessMsg(''), 5000)
      } catch {
        setError(err.response?.data?.error || 'Erro ao registar venda')
      }
    } finally {
      setLoading(false)
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col gap-0 overflow-hidden">

      {/* ── Top bar ── */}
      <div className="flex shrink-0 items-center justify-between border-b bg-white px-6 py-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Nova Venda</h1>
          <p className="text-xs text-gray-400">POS · {new Date().toLocaleDateString('pt-AO', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Resort selector */}
          {resorts.length > 0 ? (
            <select
              value={resortId}
              onChange={(e) => setResortId(e.target.value)}
              className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {resorts.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          ) : (
            <Input
              value={resortId}
              onChange={(e) => setResortId(e.target.value)}
              placeholder="Resort ID"
              className="h-8 w-44 text-sm"
            />
          )}
          {/* Online indicator */}
          <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${isOnline ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      {/* ── Alerts ── */}
      {(offlineCount > 0 || error || successMsg) && (
        <div className="shrink-0 px-6 pt-3 space-y-2">
          {offlineCount > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
              <WifiOff size={14} />
              <span className="font-semibold">{offlineCount} venda(s) offline pendente(s)</span>
              <span className="text-amber-600">— serão sincronizadas automaticamente</span>
            </div>
          )}
          {error     && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700 border border-red-200">{error}</p>}
          {successMsg && <p className="rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700 border border-green-200">{successMsg}</p>}
        </div>
      )}

      {/* ── Main content ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ══ LEFT: Products ═══════════════════════════════════════════════════ */}
        <div className="flex flex-1 flex-col overflow-hidden border-r bg-gray-50">

          {/* Search + category tabs */}
          <div className="shrink-0 space-y-3 border-b bg-white px-4 py-3">
            <Input
              placeholder="Pesquisar produto ou categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 text-sm"
            />
            <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition ${
                    activeCategory === cat
                      ? 'border-primary bg-primary text-white'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product grid */}
          <div className="flex-1 overflow-y-auto p-4">
            {filteredProducts.length === 0 ? (
              <div className="flex h-40 items-center justify-center text-sm text-gray-400">
                Nenhum produto encontrado
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4">
                {filteredProducts.map((p) => {
                  const inCart = cart.find((i) => i.productId === p.id)
                  return (
                    <button
                      key={p.id}
                      onClick={() => addToCart(p)}
                      className={`relative rounded-xl border-2 bg-white p-3 text-left transition hover:shadow-md active:scale-95 ${
                        inCart ? 'border-primary shadow-sm' : 'border-gray-100 hover:border-primary/40'
                      }`}
                    >
                      {/* Category pill */}
                      <span className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${getCategoryStyle(p.category)}`}>
                        {p.category}
                      </span>
                      <p className="mt-2 text-sm font-semibold text-gray-900 leading-tight line-clamp-2">{p.name}</p>
                      <p className="mt-1.5 text-base font-bold text-primary">{formatKwanza(p.unitPrice)}</p>

                      {/* Cart badge */}
                      {inCart && (
                        <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white shadow">
                          {inCart.qty}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* ══ RIGHT: Cart ══════════════════════════════════════════════════════ */}
        <div className="flex w-80 shrink-0 flex-col bg-white xl:w-96">

          {/* Cart header */}
          <div className="flex shrink-0 items-center justify-between border-b px-4 py-3">
            <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
              <ShoppingCart size={16} />
              Carrinho
              {cart.length > 0 && (
                <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {cart.reduce((s, i) => s + i.qty, 0)}
                </span>
              )}
            </h2>
            {cart.length > 0 && (
              <button
                onClick={() => { setCart([]); localStorage.removeItem('pos_cart') }}
                className="text-xs text-red-500 hover:underline"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-gray-300">
                <ShoppingCart size={40} strokeWidth={1} />
                <p className="text-sm">Carrinho vazio</p>
                <p className="text-xs text-gray-400">Clique num produto para adicionar</p>
              </div>
            ) : (
              <ul className="divide-y px-4">
                {cart.map((item) => (
                  <li key={item.productId} className="flex items-start gap-2 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 leading-tight truncate">{item.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatKwanza(item.unitPrice)} × {item.qty} = <span className="font-semibold text-gray-600">{formatKwanza(item.unitPrice * item.qty)}</span></p>
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5">
                      <button
                        onClick={() => updateQty(item.productId, -1)}
                        className="flex h-6 w-6 items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-50"
                      >
                        <Minus size={12} />
                      </button>
                      <input
                        type="number"
                        min={0}
                        value={item.qty}
                        onChange={(e) => setQtyDirect(item.productId, e.target.value)}
                        className="h-6 w-8 rounded border border-gray-200 text-center text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <button
                        onClick={() => updateQty(item.productId, 1)}
                        className="flex h-6 w-6 items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-50"
                      >
                        <Plus size={12} />
                      </button>
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="ml-1 flex h-6 w-6 items-center justify-center rounded text-red-400 hover:bg-red-50"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Totals + checkout */}
          <div className="shrink-0 border-t bg-gray-50 px-4 pb-4 pt-3 space-y-3">

            {/* Totals */}
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
                <span>{formatKwanza(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>IVA (14%)</span>
                <span>{formatKwanza(taxTotal)}</span>
              </div>
              <div className="flex justify-between pt-1 text-base font-bold text-gray-900 border-t">
                <span>Total</span>
                <span className="text-primary">{formatKwanza(total)}</span>
              </div>
            </div>

            {/* Payment method */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Método de Pagamento</label>
              <div className="grid grid-cols-2 gap-1.5">
                {PAYMENT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setPaymentMethod(opt.value)}
                    className={`rounded-lg border px-2 py-1.5 text-xs font-medium transition ${
                      paymentMethod === opt.value
                        ? 'border-primary bg-primary text-white'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Cash change calculator */}
            {currentPayment?.showChange && (
              <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 space-y-2">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-blue-700">
                  <Calculator size={12} /> Troco
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    step={100}
                    placeholder="Montante recebido"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    className="h-8 text-sm bg-white"
                  />
                </div>
                {cashTenderedNum > 0 && (
                  <div className={`flex justify-between rounded px-2 py-1 text-sm font-bold ${change >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    <span>Troco</span>
                    <span>{change >= 0 ? formatKwanza(change) : `Falta ${formatKwanza(-change)}`}</span>
                  </div>
                )}
              </div>
            )}

            {/* Room number for ROOM_CHARGE */}
            {paymentMethod === 'ROOM_CHARGE' && (
              <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-3 space-y-2">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-indigo-700">
                  <User size={12} /> Quarto
                </p>
                <Input
                  placeholder="Número do quarto"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  className="h-8 text-sm bg-white"
                />
              </div>
            )}

            {/* Checkout button */}
            <Button
              className="w-full"
              size="lg"
              disabled={
                cart.length === 0 ||
                !resortId ||
                loading ||
                (paymentMethod === 'ROOM_CHARGE' && !roomNumber) ||
                (currentPayment?.showChange && cashTenderedNum > 0 && change < 0)
              }
              onClick={handleCheckout}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  A processar...
                </span>
              ) : (
                `Finalizar — ${formatKwanza(total)}`
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
