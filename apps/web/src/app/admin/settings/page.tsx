'use client'

import { useState } from 'react'
import { Save, Globe, FileText, Bell, ShieldCheck, Wrench } from 'lucide-react'

function SectionCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
          <Icon className="h-4 w-4 text-indigo-600" />
        </div>
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="px-6 py-5 space-y-5">{children}</div>
    </div>
  )
}

function FormField({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3 sm:items-start">
      <div>
        <label className="text-sm font-medium text-gray-700">{label}</label>
        {hint && <p className="text-xs text-gray-400">{hint}</p>}
      </div>
      <div className="sm:col-span-2">{children}</div>
    </div>
  )
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
        checked ? 'bg-indigo-600' : 'bg-gray-200'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200 ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

const inputCls =
  'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400'

export default function SettingsPage() {
  // Geral
  const [platformName, setPlatformName] = useState('ENGERIS ONE')
  const [supportEmail, setSupportEmail] = useState('suporte@engeris.ao')
  const [currency, setCurrency] = useState('AOA')
  const [language, setLanguage] = useState('pt-AO')

  // Faturação AGT
  const [agtEndpoint, setAgtEndpoint] = useState('https://agt.minfin.gv.ao/api/v1')
  const [certExpiry, setCertExpiry] = useState('2026-12-31')
  const [agtTestMode, setAgtTestMode] = useState(true)

  // Notificações
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [smsAlerts, setSmsAlerts] = useState(false)
  const [webhookUrl, setWebhookUrl] = useState('')

  // Segurança
  const [sessionTimeout, setSessionTimeout] = useState('60')
  const [maxLoginAttempts, setMaxLoginAttempts] = useState('5')
  const [require2FA, setRequire2FA] = useState(true)

  // Manutenção
  const [readOnly, setReadOnly] = useState(false)
  const [maintenanceWindow, setMaintenanceWindow] = useState('Domingos 02:00–04:00 UTC+1')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações da Plataforma</h1>
        <p className="text-sm text-gray-500">
          Parâmetros globais da instância ENGERIS ONE. Alterações afectam todos os tenants.
        </p>
      </div>

      {/* 1. Geral */}
      <SectionCard icon={Globe} title="Geral">
        <FormField label="Nome da plataforma">
          <input
            className={inputCls}
            value={platformName}
            onChange={(e) => setPlatformName(e.target.value)}
          />
        </FormField>
        <FormField label="Email de suporte">
          <input
            className={inputCls}
            type="email"
            value={supportEmail}
            onChange={(e) => setSupportEmail(e.target.value)}
          />
        </FormField>
        <FormField label="Moeda predefinida">
          <select
            className={inputCls}
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            <option value="AOA">AOA — Kwanza Angolano</option>
            <option value="USD">USD — Dólar Americano</option>
            <option value="EUR">EUR — Euro</option>
          </select>
        </FormField>
        <FormField label="Idioma predefinido">
          <select
            className={inputCls}
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="pt-AO">Português — Angola</option>
            <option value="en">English</option>
            <option value="fr">Français</option>
            <option value="es">Español</option>
          </select>
        </FormField>
      </SectionCard>

      {/* 2. Faturação AGT */}
      <SectionCard icon={FileText} title="Faturação AGT">
        <FormField label="Endpoint AGT API" hint="URL da API da Autoridade Geral Tributária">
          <input
            className={inputCls}
            value={agtEndpoint}
            onChange={(e) => setAgtEndpoint(e.target.value)}
          />
        </FormField>
        <FormField label="Validade do certificado">
          <input
            className={inputCls}
            type="date"
            value={certExpiry}
            onChange={(e) => setCertExpiry(e.target.value)}
          />
        </FormField>
        <FormField label="Modo de teste" hint="Activar sandbox da AGT">
          <div className="flex items-center gap-3 pt-1">
            <Toggle checked={agtTestMode} onChange={setAgtTestMode} />
            <span className="text-sm text-gray-600">{agtTestMode ? 'Sandbox activo' : 'Produção'}</span>
          </div>
        </FormField>
      </SectionCard>

      {/* 3. Notificações */}
      <SectionCard icon={Bell} title="Notificações">
        <FormField label="Notificações por email">
          <div className="flex items-center gap-3 pt-1">
            <Toggle checked={emailNotifications} onChange={setEmailNotifications} />
            <span className="text-sm text-gray-600">
              {emailNotifications ? 'Activadas' : 'Desactivadas'}
            </span>
          </div>
        </FormField>
        <FormField label="Alertas SMS">
          <div className="flex items-center gap-3 pt-1">
            <Toggle checked={smsAlerts} onChange={setSmsAlerts} />
            <span className="text-sm text-gray-600">
              {smsAlerts ? 'Activados' : 'Desactivados'}
            </span>
          </div>
        </FormField>
        <FormField label="URL do Webhook" hint="Notificações de eventos críticos">
          <input
            className={inputCls}
            type="url"
            placeholder="https://..."
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
          />
        </FormField>
      </SectionCard>

      {/* 4. Segurança */}
      <SectionCard icon={ShieldCheck} title="Segurança">
        <FormField label="Timeout de sessão (min)" hint="Inactividade antes do logout automático">
          <input
            className={inputCls}
            type="number"
            min={5}
            max={480}
            value={sessionTimeout}
            onChange={(e) => setSessionTimeout(e.target.value)}
          />
        </FormField>
        <FormField label="Máx. tentativas de login">
          <input
            className={inputCls}
            type="number"
            min={1}
            max={20}
            value={maxLoginAttempts}
            onChange={(e) => setMaxLoginAttempts(e.target.value)}
          />
        </FormField>
        <FormField label="2FA obrigatório para admins">
          <div className="flex items-center gap-3 pt-1">
            <Toggle checked={require2FA} onChange={setRequire2FA} />
            <span className="text-sm text-gray-600">
              {require2FA ? 'Obrigatório' : 'Opcional'}
            </span>
          </div>
        </FormField>
      </SectionCard>

      {/* 5. Manutenção */}
      <SectionCard icon={Wrench} title="Manutenção">
        <FormField label="Modo só de leitura" hint="Bloqueia escrita na base de dados">
          <div className="flex items-center gap-3 pt-1">
            <Toggle checked={readOnly} onChange={setReadOnly} />
            <span className={`text-sm font-medium ${readOnly ? 'text-amber-600' : 'text-gray-600'}`}>
              {readOnly ? 'Activo — escrita bloqueada' : 'Desactivado'}
            </span>
          </div>
        </FormField>
        <FormField label="Janela de manutenção" hint="Período agendado para actualizações">
          <input
            className={inputCls}
            value={maintenanceWindow}
            onChange={(e) => setMaintenanceWindow(e.target.value)}
          />
        </FormField>
      </SectionCard>

      {/* Save Button */}
      <div className="flex justify-end pb-4">
        <button
          onClick={() => alert('Configurações guardadas com sucesso')}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
        >
          <Save className="h-4 w-4" />
          Guardar Alterações
        </button>
      </div>
    </div>
  )
}
