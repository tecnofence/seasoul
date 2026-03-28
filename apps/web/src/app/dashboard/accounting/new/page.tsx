'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Calculator, ArrowLeft, CheckCircle } from 'lucide-react'

type EntryType = 'RECEITA' | 'DESPESA' | 'TRANSFERENCIA'

const RECEITA_CATEGORIES = [
  { value: 'ALOJAMENTO', label: 'Alojamento' },
  { value: 'FB', label: 'F&B' },
  { value: 'SPA', label: 'Spa' },
  { value: 'ATIVIDADES', label: 'Atividades' },
  { value: 'LOJA', label: 'Loja' },
  { value: 'OUTRO', label: 'Outro' },
]

const DESPESA_CATEGORIES = [
  { value: 'SALARIOS', label: 'Salários' },
  { value: 'FORNECEDORES', label: 'Fornecedores' },
  { value: 'MANUTENCAO', label: 'Manutenção' },
  { value: 'UTILITIES', label: 'Utilities' },
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'OUTRO', label: 'Outro' },
]

const ACCOUNTS = [
  { value: 'CAIXA', label: 'Caixa' },
  { value: 'BANCO_BAI', label: 'Banco BAI' },
  { value: 'BANCO_BFA', label: 'Banco BFA' },
  { value: 'TRANSFERENCIA', label: 'Transferência' },
]

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export default function NewAccountingEntryPage() {
  const router = useRouter()

  const [tipo, setTipo] = useState<EntryType>('RECEITA')
  const [data, setData] = useState(todayISO())
  const [descricao, setDescricao] = useState('')
  const [categoria, setCategoria] = useState('')
  const [valor, setValor] = useState('')
  const [referencia, setReferencia] = useState('')
  const [notas, setNotas] = useState('')
  const [conta, setConta] = useState('')
  const [successMsg, setSuccessMsg] = useState(false)

  const categories = tipo === 'RECEITA' ? RECEITA_CATEGORIES : tipo === 'DESPESA' ? DESPESA_CATEGORIES : []

  const mutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.post('/accounting/entries', payload),
    onSuccess: () => {
      setSuccessMsg(true)
      setTimeout(() => router.push('/dashboard/accounting'), 1200)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!descricao.trim() || !valor || Number(valor) <= 0) return

    mutation.mutate({
      tipo,
      data,
      descricao: descricao.trim(),
      categoria: categoria || undefined,
      valor: Number(valor),
      referencia: referencia.trim() || undefined,
      notas: notas.trim() || undefined,
      conta: conta || undefined,
    })
  }

  const isValid = descricao.trim().length > 0 && Number(valor) > 0

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/accounting"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Contabilidade
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1A3E6E]/10">
          <Calculator className="h-5 w-5 text-[#1A3E6E]" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Novo Lançamento Contabilístico</h1>
      </div>

      {/* Formulário */}
      <form onSubmit={handleSubmit}>
        <div className="mx-auto max-w-2xl rounded-lg border bg-white p-6 shadow-sm space-y-6">

          {/* Tipo */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Tipo <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3E6E]/40"
              value={tipo}
              onChange={(e) => {
                setTipo(e.target.value as EntryType)
                setCategoria('')
              }}
            >
              <option value="RECEITA">Receita</option>
              <option value="DESPESA">Despesa</option>
              <option value="TRANSFERENCIA">Transferência interna</option>
            </select>
          </div>

          {/* Data */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Data <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3E6E]/40"
              value={data}
              onChange={(e) => setData(e.target.value)}
              required
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Descrição <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3E6E]/40"
              placeholder="Descrição do lançamento"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              required
            />
          </div>

          {/* Categoria */}
          {categories.length > 0 && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Categoria</label>
              <select
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3E6E]/40"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
              >
                <option value="">— Selecionar categoria —</option>
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Valor */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Valor (AOA) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-gray-400">
                Kz
              </span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3E6E]/40"
                placeholder="0.00"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Referência */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Referência{' '}
              <span className="text-xs font-normal text-gray-400">(opcional — ex: nº de factura)</span>
            </label>
            <input
              type="text"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3E6E]/40"
              placeholder="FT 2026/0001"
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
            />
          </div>

          {/* Conta */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Conta{' '}
              <span className="text-xs font-normal text-gray-400">(opcional)</span>
            </label>
            <select
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3E6E]/40"
              value={conta}
              onChange={(e) => setConta(e.target.value)}
            >
              <option value="">— Selecionar conta —</option>
              {ACCOUNTS.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>

          {/* Notas */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Notas{' '}
              <span className="text-xs font-normal text-gray-400">(opcional)</span>
            </label>
            <textarea
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3E6E]/40"
              rows={3}
              placeholder="Observações adicionais..."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
            />
          </div>

          {/* Feedback de erro */}
          {mutation.isError && (
            <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
              Erro ao registar o lançamento. Por favor, tente novamente.
            </p>
          )}

          {/* Feedback de sucesso */}
          {successMsg && (
            <div className="flex items-center gap-2 rounded-md bg-green-50 px-4 py-3 text-sm text-green-700">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              Lançamento registado com sucesso! A redirecionar...
            </div>
          )}

          {/* Acções */}
          <div className="flex items-center justify-end gap-3 border-t pt-4">
            <Link
              href="/dashboard/accounting"
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </Link>
            <Button
              type="submit"
              disabled={!isValid || mutation.isPending || successMsg}
            >
              {mutation.isPending ? 'A guardar...' : 'Guardar Lançamento'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
