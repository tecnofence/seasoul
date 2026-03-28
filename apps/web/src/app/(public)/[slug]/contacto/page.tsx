'use client'

import { useState } from 'react'
import { MapPin, Phone, Mail, Clock, MessageCircle, Map, CheckCircle2 } from 'lucide-react'

function formatKwanza(value: number) {
  return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(value)
}

const SUBJECT_OPTIONS = [
  { value: 'RESERVA', label: 'Reserva' },
  { value: 'INFORMACAO', label: 'Informação' },
  { value: 'RECLAMACAO', label: 'Reclamação' },
  { value: 'PARCERIA', label: 'Parceria' },
  { value: 'OUTRO', label: 'Outro' },
]

export default function ContactoPage() {
  const [form, setForm] = useState({
    nome: '',
    email: '',
    telefone: '',
    assunto: '',
    mensagem: '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setLoading(false)
    setSuccess(true)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-blue-900 to-teal-700 py-20 px-4 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-teal-300 blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm mb-6">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3">Contacte-nos</h1>
          <p className="text-lg text-blue-100 max-w-xl mx-auto">
            Estamos aqui para ajudar. Entre em contacto connosco.
          </p>
        </div>
      </section>

      {/* Two-column layout */}
      <section className="max-w-6xl mx-auto px-4 py-14">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">

          {/* Left: Contact Info */}
          <div className="space-y-5">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Informações de Contacto</h2>

            {/* Info cards */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Morada</p>
                <p className="text-gray-700 text-sm">Estrada de Cabo Ledo, Bengo, Angola</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-green-700">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Telefone</p>
                <a href="tel:+244900000000" className="text-gray-700 text-sm hover:text-blue-600 transition-colors">
                  +244 900 000 000
                </a>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Email</p>
                <a href="mailto:info@seaandsoul.ao" className="text-gray-700 text-sm hover:text-blue-600 transition-colors">
                  info@seaandsoul.ao
                </a>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Horário</p>
                <p className="text-gray-700 text-sm">Receção 24h | Check-in a partir das 14h</p>
              </div>
            </div>

            {/* WhatsApp Button */}
            <a
              href="https://wa.me/244900000000"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-4 rounded-2xl transition-colors shadow-sm"
            >
              <MessageCircle className="w-5 h-5" />
              Falar no WhatsApp
            </a>

            {/* Map Placeholder */}
            <div className="relative rounded-2xl overflow-hidden border border-gray-100 shadow-sm" style={{ height: '200px' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-200 to-teal-100" />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shadow-lg">
                  <Map className="w-5 h-5 text-white" />
                </div>
                <a
                  href="https://maps.google.com/?q=Cabo+Ledo+Angola"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-700 font-semibold text-sm hover:text-blue-900 underline underline-offset-2 transition-colors"
                >
                  Ver no Google Maps
                </a>
              </div>
            </div>
          </div>

          {/* Right: Contact Form */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Enviar Mensagem</h2>

            {success ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Mensagem enviada!</h3>
                <p className="text-gray-500 text-sm">
                  Entraremos em contacto em breve.
                </p>
                <button
                  onClick={() => {
                    setSuccess(false)
                    setForm({ nome: '', email: '', telefone: '', assunto: '', mensagem: '' })
                  }}
                  className="mt-6 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  Enviar outra mensagem
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Nome <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="nome"
                    name="nome"
                    type="text"
                    required
                    value={form.nome}
                    onChange={handleChange}
                    placeholder="O seu nome completo"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    placeholder="email@exemplo.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="telefone" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Telefone <span className="text-gray-400 font-normal">(opcional)</span>
                  </label>
                  <input
                    id="telefone"
                    name="telefone"
                    type="tel"
                    value={form.telefone}
                    onChange={handleChange}
                    placeholder="+244 900 000 000"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="assunto" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Assunto <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="assunto"
                    name="assunto"
                    required
                    value={form.assunto}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all bg-white"
                  >
                    <option value="" disabled>
                      Selecione um assunto
                    </option>
                    {SUBJECT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="mensagem" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Mensagem <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="mensagem"
                    name="mensagem"
                    required
                    value={form.mensagem}
                    onChange={handleChange}
                    placeholder="Escreva a sua mensagem aqui..."
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all resize-none min-h-32"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      A enviar...
                    </>
                  ) : (
                    'Enviar Mensagem'
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
