'use client'

import { useState, type ReactNode, type ChangeEvent } from 'react'
import { Save, Globe, FileText, Bell, ShieldCheck, Wrench, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

// ── Componentes base ──────────────────────────────

const inputCls =
  'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/60 transition-colors'

const selectCls =
  'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/60 transition-colors'

function FormField({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3 sm:items-start">
      <div className="pt-1">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        {hint && <p className="mt-0.5 text-xs text-gray-400">{hint}</p>}
      </div>
      <div className="sm:col-span-2">{children}</div>
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 ${
        checked ? 'bg-primary' : 'bg-gray-200'
      }`}
      aria-pressed={checked}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200 ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-gray-300 text-primary accent-primary focus:ring-primary/30"
      />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  )
}

// ── Feedback de submissão ─────────────────────────

type SaveStatus = 'idle' | 'saving' | 'success' | 'error'

function SaveFeedback({ status }: { status: SaveStatus }) {
  if (status === 'idle') return null
  if (status === 'saving')
    return (
      <span className="flex items-center gap-1.5 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        A guardar…
      </span>
    )
  if (status === 'success')
    return (
      <span className="flex items-center gap-1.5 text-sm text-green-700">
        <CheckCircle2 className="h-4 w-4" />
        Guardado com sucesso
      </span>
    )
  return (
    <span className="flex items-center gap-1.5 text-sm text-red-600">
      <XCircle className="h-4 w-4" />
      Erro ao guardar
    </span>
  )
}

function useSave() {
  const [status, setStatus] = useState<SaveStatus>('idle')

  async function save(_data: Record<string, unknown>) {
    setStatus('saving')
    // Simula PATCH /admin/settings — substitui pela chamada real quando a API estiver pronta
    await new Promise(resolve => setTimeout(resolve, 500))
    // Em produção: await api.patch('/admin/settings', data)
    setStatus('success')
    setTimeout(() => setStatus('idle'), 3000)
  }

  return { status, save }
}

// ── Tab 1 — Plataforma ────────────────────────────

function TabPlataforma() {
  const [nome, setNome] = useState('ENGERIS ONE')
  const [urlBase, setUrlBase] = useState('app.engeris.ao')
  const [moeda, setMoeda] = useState('AOA')
  const [fuso, setFuso] = useState('Africa/Luanda')
  const [idioma, setIdioma] = useState('Português')
  const { status, save } = useSave()

  function handleSave() {
    save({ nome, urlBase, moeda, fuso, idioma })
  }

  return (
    <div className="space-y-5">
      <FormField label="Nome da Plataforma">
        <input className={inputCls} value={nome} onChange={e => setNome(e.target.value)} />
      </FormField>
      <FormField label="URL base">
        <input className={inputCls} value={urlBase} onChange={e => setUrlBase(e.target.value)} placeholder="app.engeris.ao" />
      </FormField>
      <FormField label="Moeda padrão">
        <select className={selectCls} value={moeda} onChange={e => setMoeda(e.target.value)}>
          <option value="AOA">AOA — Kwanza Angolano</option>
          <option value="USD">USD — Dólar Americano</option>
          <option value="EUR">EUR — Euro</option>
        </select>
      </FormField>
      <FormField label="Fuso horário">
        <select className={selectCls} value={fuso} onChange={e => setFuso(e.target.value)}>
          <option value="Africa/Luanda">Africa/Luanda (UTC+1)</option>
          <option value="UTC">UTC</option>
          <option value="Europe/Lisbon">Europe/Lisbon</option>
        </select>
      </FormField>
      <FormField label="Idioma padrão">
        <select className={selectCls} value={idioma} onChange={e => setIdioma(e.target.value)}>
          <option value="Português">Português</option>
          <option value="English">English</option>
          <option value="Français">Français</option>
        </select>
      </FormField>
      <div className="flex items-center justify-end gap-4 border-t border-gray-100 pt-4">
        <SaveFeedback status={status} />
        <Button onClick={handleSave} disabled={status === 'saving'} className="gap-2">
          <Save className="h-4 w-4" />
          Guardar
        </Button>
      </div>
    </div>
  )
}

// ── Tab 2 — AGT / Faturação ───────────────────────

function TabAGT() {
  const [endpoint, setEndpoint] = useState('')
  const [nif, setNif] = useState('')
  const [serie, setSerie] = useState('2026/A')
  const [iva, setIva] = useState(14)
  const [retencao, setRetencao] = useState(false)
  const { status, save } = useSave()

  function handleSave() {
    save({ endpoint, nif, serie, iva, retencao })
  }

  return (
    <div className="space-y-5">
      <FormField label="Endpoint AGT" hint="URL da API da Autoridade Geral Tributária">
        <input
          className={inputCls}
          value={endpoint}
          onChange={e => setEndpoint(e.target.value)}
          placeholder="https://efatura.agt.minfin.gov.ao"
        />
      </FormField>
      <FormField label="NIF da Plataforma">
        <input className={inputCls} value={nif} onChange={e => setNif(e.target.value)} placeholder="000000000" />
      </FormField>
      <FormField label="Série de Faturas">
        <input className={inputCls} value={serie} onChange={e => setSerie(e.target.value)} />
      </FormField>
      <FormField label="IVA padrão (%)" hint="Taxa de IVA em Angola: 14%">
        <input
          className={inputCls}
          type="number"
          min={0}
          max={100}
          value={iva}
          onChange={e => setIva(Number(e.target.value))}
        />
      </FormField>
      <FormField label="Retenção na fonte">
        <div className="pt-1">
          <CheckboxField
            label="Aplicar retenção na fonte automaticamente"
            checked={retencao}
            onChange={setRetencao}
          />
        </div>
      </FormField>
      <div className="flex items-center justify-end gap-4 border-t border-gray-100 pt-4">
        <SaveFeedback status={status} />
        <Button onClick={handleSave} disabled={status === 'saving'} className="gap-2">
          <Save className="h-4 w-4" />
          Guardar
        </Button>
      </div>
    </div>
  )
}

// ── Tab 3 — Notificações ──────────────────────────

function TabNotificacoes() {
  const [emailSender, setEmailSender] = useState('')
  const [smsProvider, setSmsProvider] = useState("Africa's Talking")
  const [notifExpiracao, setNotifExpiracao] = useState(false)
  const [diasExpiracao, setDiasExpiracao] = useState(7)
  const [notifReservas, setNotifReservas] = useState(true)
  const { status, save } = useSave()

  function handleSave() {
    save({ emailSender, smsProvider, notifExpiracao, diasExpiracao, notifReservas })
  }

  return (
    <div className="space-y-5">
      <FormField label="Email remetente" hint="Endereço usado para envio de emails">
        <input
          className={inputCls}
          type="email"
          value={emailSender}
          onChange={e => setEmailSender(e.target.value)}
          placeholder="noreply@seasoul.ao"
        />
      </FormField>
      <FormField label="Fornecedor SMS">
        <select className={selectCls} value={smsProvider} onChange={e => setSmsProvider(e.target.value)}>
          <option value="Africa's Talking">Africa's Talking</option>
          <option value="Vonage">Vonage</option>
        </select>
      </FormField>
      <FormField label="Expiração de tenant" hint="Notificar antes do fim do contrato">
        <div className="space-y-2 pt-1">
          <CheckboxField
            label="Notificar expiração de tenant"
            checked={notifExpiracao}
            onChange={setNotifExpiracao}
          />
          {notifExpiracao && (
            <div className="flex items-center gap-2 pl-6">
              <input
                className={`${inputCls} w-20`}
                type="number"
                min={1}
                max={90}
                value={diasExpiracao}
                onChange={e => setDiasExpiracao(Number(e.target.value))}
              />
              <span className="text-sm text-gray-500">dias antes</span>
            </div>
          )}
        </div>
      </FormField>
      <FormField label="Notificações de reservas">
        <div className="pt-1">
          <CheckboxField
            label="Notificar novas reservas e check-ins"
            checked={notifReservas}
            onChange={setNotifReservas}
          />
        </div>
      </FormField>
      <div className="flex items-center justify-end gap-4 border-t border-gray-100 pt-4">
        <SaveFeedback status={status} />
        <Button onClick={handleSave} disabled={status === 'saving'} className="gap-2">
          <Save className="h-4 w-4" />
          Guardar
        </Button>
      </div>
    </div>
  )
}

// ── Tab 4 — Segurança ─────────────────────────────

function TabSeguranca() {
  const [sessaoMaxima, setSessaoMaxima] = useState('8h')
  const [require2FA, setRequire2FA] = useState(true)
  const [maxTentativas, setMaxTentativas] = useState(5)
  const [rateLimit, setRateLimit] = useState(100)
  const { status, save } = useSave()

  function handleSave() {
    save({ sessaoMaxima, require2FA, maxTentativas, rateLimit })
  }

  return (
    <div className="space-y-5">
      <FormField label="Sessão máxima" hint="Tempo máximo de sessão por utilizador">
        <select className={selectCls} value={sessaoMaxima} onChange={e => setSessaoMaxima(e.target.value)}>
          <option value="8h">8 horas</option>
          <option value="24h">24 horas</option>
          <option value="7d">7 dias</option>
        </select>
      </FormField>
      <FormField label="2FA obrigatório para admins">
        <div className="flex items-center gap-3 pt-1">
          <Toggle checked={require2FA} onChange={setRequire2FA} />
          <span className="text-sm text-gray-600">
            {require2FA ? 'Obrigatório' : 'Opcional'}
          </span>
        </div>
      </FormField>
      <FormField label="Tentativas máx. de login" hint="Bloqueio após N tentativas falhadas">
        <input
          className={inputCls}
          type="number"
          min={1}
          max={20}
          value={maxTentativas}
          onChange={e => setMaxTentativas(Number(e.target.value))}
        />
      </FormField>
      <FormField label="Rate limit por IP" hint="Requisições por minuto">
        <div className="flex items-center gap-2">
          <input
            className={`${inputCls} w-28`}
            type="number"
            min={10}
            max={1000}
            value={rateLimit}
            onChange={e => setRateLimit(Number(e.target.value))}
          />
          <span className="text-sm text-gray-500">req/min</span>
        </div>
      </FormField>
      <div className="flex items-center justify-end gap-4 border-t border-gray-100 pt-4">
        <SaveFeedback status={status} />
        <Button onClick={handleSave} disabled={status === 'saving'} className="gap-2">
          <Save className="h-4 w-4" />
          Guardar
        </Button>
      </div>
    </div>
  )
}

// ── Tab 5 — Manutenção ────────────────────────────

function TabManutencao() {
  const [modoManutencao, setModoManutencao] = useState(false)
  const [mensagem, setMensagem] = useState('O sistema está temporariamente em manutenção. Por favor tente novamente mais tarde.')
  const [janelaData, setJanelaData] = useState('')
  const [janelaHora, setJanelaHora] = useState('02:00')
  const [backupAuto, setBackupAuto] = useState(true)
  const [frequenciaBackup, setFrequenciaBackup] = useState('daily')
  const { status, save } = useSave()

  function handleSave() {
    save({ modoManutencao, mensagem, janelaData, janelaHora, backupAuto, frequenciaBackup })
  }

  return (
    <div className="space-y-5">
      <FormField label="Modo de manutenção" hint="Bloqueia acesso a todos os utilizadores não-admin">
        <div className="flex items-center gap-3 pt-1">
          <Toggle checked={modoManutencao} onChange={setModoManutencao} />
          <span className={`text-sm font-medium ${modoManutencao ? 'text-amber-600' : 'text-gray-600'}`}>
            {modoManutencao ? 'Ativo — sistema bloqueado' : 'Desativado'}
          </span>
        </div>
      </FormField>
      <FormField label="Mensagem de manutenção" hint="Apresentada aos utilizadores durante a manutenção">
        <textarea
          className={`${inputCls} min-h-[80px] resize-y`}
          value={mensagem}
          onChange={e => setMensagem(e.target.value)}
          rows={3}
        />
      </FormField>
      <FormField label="Janela de manutenção" hint="Data e hora de início previstas">
        <div className="flex items-center gap-2">
          <input
            className={`${inputCls} flex-1`}
            type="date"
            value={janelaData}
            onChange={e => setJanelaData(e.target.value)}
          />
          <input
            className={`${inputCls} w-28`}
            type="time"
            value={janelaHora}
            onChange={e => setJanelaHora(e.target.value)}
          />
        </div>
      </FormField>
      <FormField label="Backup automático">
        <div className="space-y-2 pt-1">
          <CheckboxField
            label="Ativar backup automático"
            checked={backupAuto}
            onChange={setBackupAuto}
          />
          {backupAuto && (
            <div className="pl-6">
              <select
                className={`${selectCls} w-auto`}
                value={frequenciaBackup}
                onChange={e => setFrequenciaBackup(e.target.value)}
              >
                <option value="hourly">A cada hora</option>
                <option value="daily">Diário</option>
                <option value="weekly">Semanal</option>
              </select>
            </div>
          )}
        </div>
      </FormField>
      <div className="flex items-center justify-end gap-4 border-t border-gray-100 pt-4">
        <SaveFeedback status={status} />
        <Button onClick={handleSave} disabled={status === 'saving'} className="gap-2">
          <Save className="h-4 w-4" />
          Guardar
        </Button>
      </div>
    </div>
  )
}

// ── Configuração dos tabs ─────────────────────────

interface TabConfig {
  key: string
  label: string
  icon: typeof Globe
  component: () => ReactNode
}

const TABS: TabConfig[] = [
  { key: 'plataforma',    label: 'Plataforma',      icon: Globe,        component: TabPlataforma    },
  { key: 'agt',           label: 'AGT / Faturação', icon: FileText,     component: TabAGT           },
  { key: 'notificacoes',  label: 'Notificações',    icon: Bell,         component: TabNotificacoes  },
  { key: 'seguranca',     label: 'Segurança',       icon: ShieldCheck,  component: TabSeguranca     },
  { key: 'manutencao',    label: 'Manutenção',      icon: Wrench,       component: TabManutencao    },
]

// ── Página principal ──────────────────────────────

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('plataforma')
  const current = TABS.find(t => t.key === activeTab) ?? TABS[0]
  const TabComponent = current.component

  return (
    <div className="space-y-6">

      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações da Plataforma</h1>
        <p className="text-sm text-gray-500">
          Parâmetros globais da instância ENGERIS ONE. Alterações afetam todos os tenants.
        </p>
      </div>

      {/* Tabs + Painel */}
      <div className="flex flex-col gap-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm lg:flex-row">

        {/* Sidebar de tabs */}
        <nav className="flex shrink-0 flex-row overflow-x-auto border-b border-gray-200 lg:w-52 lg:flex-col lg:border-b-0 lg:border-r">
          {TABS.map(tab => {
            const TabIcon = tab.icon
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2.5 whitespace-nowrap px-4 py-3.5 text-sm font-medium transition-colors lg:w-full lg:whitespace-normal ${
                  isActive
                    ? 'border-b-2 border-primary bg-primary/5 text-primary lg:border-b-0 lg:border-l-2'
                    : 'border-b-2 border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900 lg:border-b-0 lg:border-l-2 lg:border-transparent'
                }`}
              >
                <TabIcon className="h-4 w-4 shrink-0" />
                {tab.label}
              </button>
            )
          })}
        </nav>

        {/* Conteúdo do tab activo */}
        <div className="flex-1 px-6 py-6">
          <h2 className="mb-6 flex items-center gap-2 text-base font-semibold text-gray-900">
            <current.icon className="h-4 w-4 text-primary" />
            {current.label}
          </h2>
          <TabComponent />
        </div>

      </div>
    </div>
  )
}
