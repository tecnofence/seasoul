'use client'

import Link from 'next/link'
import { useState } from 'react'
import { CheckCircle, ArrowLeft, Phone, Mail, MapPin } from 'lucide-react'

const benefits = [
  'Sessão ao vivo de 45 minutos com um especialista',
  'Demonstração personalizada para o seu tipo de hotel',
  'Resposta em menos de 24 horas',
  'Sem compromisso — totalmente gratuito',
]

const modules = [
  { id: 'pms', label: 'PMS — Reservas' },
  { id: 'pos', label: 'POS — Ponto de Venda' },
  { id: 'rh', label: 'RH & Salários' },
  { id: 'stock', label: 'Stock & Compras' },
  { id: 'locks', label: 'Smart Locks' },
  { id: 'analytics', label: 'Analytics & KPIs' },
]

export default function DemoPage() {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedModules, setSelectedModules] = useState<string[]>([])

  const toggleModule = (id: string) => {
    setSelectedModules((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setLoading(false)
    setSubmitted(true)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Minimal top bar */}
      <div className="border-b border-gray-100 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao início
          </Link>
          <span className="text-lg font-bold text-slate-900">
            ENGERIS <span className="text-teal-500">ONE</span>
          </span>
        </div>
      </div>

      <div className="grid min-h-[calc(100vh-65px)] grid-cols-1 lg:grid-cols-2">
        {/* ── LEFT PITCH PANEL ── */}
        <div className="flex flex-col justify-center bg-slate-900 px-10 py-16 lg:px-16">
          <div className="max-w-md">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 px-3 py-1.5 text-xs font-medium text-teal-400">
              Demonstração Gratuita
            </div>
            <h1 className="mb-4 text-4xl font-bold leading-tight text-white">
              Veja o ENGERIS ONE<br />
              <span className="text-teal-400">em ação</span>
            </h1>
            <p className="mb-10 text-lg leading-relaxed text-gray-400">
              Agende uma sessão personalizada e descubra como o ENGERIS ONE pode transformar a gestão do seu hotel.
            </p>

            <ul className="mb-12 space-y-4">
              {benefits.map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-teal-400" />
                  <span className="text-sm leading-relaxed text-gray-300">{b}</span>
                </li>
              ))}
            </ul>

            <div className="space-y-3 border-t border-white/10 pt-8">
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <Mail className="h-4 w-4 text-teal-400" />
                hello@engeris.co.ao
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <Phone className="h-4 w-4 text-teal-400" />
                +244 923 000 000
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <MapPin className="h-4 w-4 text-teal-400" />
                Luanda, Angola
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT FORM PANEL ── */}
        <div className="flex flex-col justify-center px-10 py-16 lg:px-16">
          {submitted ? (
            <div className="max-w-md text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-teal-50">
                <CheckCircle className="h-10 w-10 text-teal-500" />
              </div>
              <h2 className="mb-3 text-2xl font-bold text-slate-900">Pedido recebido!</h2>
              <p className="mb-8 text-gray-600">
                Obrigado! Entraremos em contacto em menos de 24 horas para agendar a sua demonstração.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-xl bg-teal-500 px-6 py-3 text-sm font-semibold text-white hover:bg-teal-400"
              >
                Voltar ao início
              </Link>
            </div>
          ) : (
            <div className="max-w-md">
              <h2 className="mb-2 text-2xl font-bold text-slate-900">Agendar Demonstração</h2>
              <p className="mb-8 text-sm text-gray-600">Preencha o formulário e entraremos em contacto.</p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Nome completo <span className="text-red-400">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none transition-colors focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20"
                      placeholder="João Silva"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Cargo <span className="text-red-400">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none transition-colors focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20"
                      placeholder="Director Geral"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Hotel / Empresa <span className="text-red-400">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none transition-colors focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20"
                    placeholder="Hotel Palmeira"
                  />
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Email <span className="text-red-400">*</span>
                    </label>
                    <input
                      required
                      type="email"
                      className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none transition-colors focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20"
                      placeholder="joao@hotel.ao"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Telefone
                    </label>
                    <input
                      type="tel"
                      className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none transition-colors focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20"
                      placeholder="+244 9xx xxx xxx"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Numero de quartos
                  </label>
                  <select className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20">
                    <option value="">Selecione...</option>
                    <option value="lt20">Menos de 20 quartos</option>
                    <option value="20-50">20 a 50 quartos</option>
                    <option value="50-100">50 a 100 quartos</option>
                    <option value="100+">Mais de 100 quartos</option>
                  </select>
                </div>

                <div>
                  <label className="mb-3 block text-sm font-medium text-gray-700">
                    Módulos de interesse
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {modules.map((mod) => (
                      <label
                        key={mod.id}
                        className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                          selectedModules.includes(mod.id)
                            ? 'border-teal-300 bg-teal-50 text-teal-700'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={selectedModules.includes(mod.id)}
                          onChange={() => toggleModule(mod.id)}
                        />
                        <span
                          className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border ${
                            selectedModules.includes(mod.id)
                              ? 'border-teal-500 bg-teal-500'
                              : 'border-gray-300'
                          }`}
                        >
                          {selectedModules.includes(mod.id) && (
                            <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </span>
                        {mod.label}
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-teal-500 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? 'A enviar...' : 'Agendar Demonstração'}
                </button>

                <p className="text-center text-xs text-gray-400">
                  Ao submeter, aceita a nossa{' '}
                  <a href="#" className="text-teal-600 hover:underline">política de privacidade</a>.
                </p>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
