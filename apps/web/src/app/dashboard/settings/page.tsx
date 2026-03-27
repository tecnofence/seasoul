'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Settings, Building2, Palette, Briefcase, Package, MapPin } from 'lucide-react'

const ALL_MODULES = [
  { id: 'PMS', label: 'Gestão Hoteleira (PMS)' },
  { id: 'POS', label: 'Ponto de Venda (POS)' },
  { id: 'STOCK', label: 'Gestão de Stock' },
  { id: 'HR', label: 'Recursos Humanos' },
  { id: 'INVOICING', label: 'Faturação' },
  { id: 'MAINTENANCE', label: 'Manutenção' },
  { id: 'LOCKS', label: 'Fechaduras Inteligentes' },
  { id: 'GUEST_APP', label: 'App do Hóspede' },
  { id: 'CONTRACTS', label: 'Contratos' },
  { id: 'PROJECTS', label: 'Projetos' },
  { id: 'SECURITY', label: 'Segurança' },
  { id: 'VEHICLES', label: 'Veículos' },
]

export default function SettingsPage() {
  const [enabledModules, setEnabledModules] = useState<Record<string, boolean>>({})
  const [branding, setBranding] = useState({ logoUrl: '', primaryColor: '#1A3E6E' })
  const [business, setBusiness] = useState({ nif: '', address: '', contact: '' })

  const { data: tenant, isLoading } = useQuery({
    queryKey: ['tenant-settings'],
    queryFn: () => api.get('/tenants/me/modules').then((r) => r.data.data),
  })

  useEffect(() => {
    if (!tenant) return
    if (tenant.modules) {
      const modules: Record<string, boolean> = {}
      tenant.modules.forEach((m: any) => {
        modules[m.moduleId] = m.active
      })
      setEnabledModules(modules)
    }
    if (tenant.logoUrl) setBranding((b) => ({ ...b, logoUrl: tenant.logoUrl }))
    if (tenant.primaryColor) setBranding((b) => ({ ...b, primaryColor: tenant.primaryColor }))
    if (tenant.nif) setBusiness((b) => ({ ...b, nif: tenant.nif }))
    if (tenant.address) setBusiness((b) => ({ ...b, address: tenant.address }))
    if (tenant.contact) setBusiness((b) => ({ ...b, contact: tenant.contact }))
  }, [tenant])

  const toggleModule = (moduleId: string) => {
    setEnabledModules((prev) => ({ ...prev, [moduleId]: !prev[moduleId] }))
  }

  const activeCount = Object.values(enabledModules).filter(Boolean).length

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center text-gray-500">A carregar...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6 text-gray-500" />
        <h1 className="text-2xl font-bold text-gray-900">Definições</h1>
      </div>

      {/* Informação do Tenant */}
      <Card>
        <CardTitle>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Informação da Organização
          </div>
        </CardTitle>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-gray-500">Nome</dt>
              <dd className="font-medium">{tenant?.name || tenant?.tenant?.name || '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Plano</dt>
              <dd>
                <Badge variant="info">{tenant?.plan || tenant?.tenant?.plan || '—'}</Badge>
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Módulos Ativos</dt>
              <dd className="font-medium">{activeCount} de {ALL_MODULES.length}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Módulos */}
      <Card>
        <CardTitle>
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Módulos
          </div>
        </CardTitle>
        <CardContent>
          <p className="mb-4 text-sm text-gray-500">Ative ou desative os módulos disponíveis para a sua organização.</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ALL_MODULES.map((mod) => (
              <div
                key={mod.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <p className="text-sm font-medium">{mod.label}</p>
                  <p className="text-xs text-gray-400">{mod.id}</p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleModule(mod.id)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    enabledModules[mod.id] ? 'bg-primary' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      enabledModules[mod.id] ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filiais */}
      <Card>
        <CardTitle>
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Filiais
          </div>
        </CardTitle>
        <CardContent>
          {tenant?.branches && tenant.branches.length > 0 ? (
            <div className="space-y-3">
              {tenant.branches.map((branch: any) => (
                <div key={branch.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">{branch.name}</p>
                    <p className="text-xs text-gray-500">{branch.address || '—'}</p>
                  </div>
                  <Badge variant={branch.active ? 'success' : 'default'}>
                    {branch.active ? 'Ativa' : 'Inativa'}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Nenhuma filial configurada.</p>
          )}
        </CardContent>
      </Card>

      {/* Branding */}
      <Card>
        <CardTitle>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            Marca e Aparência
          </div>
        </CardTitle>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">URL do Logotipo</label>
              <Input
                value={branding.logoUrl}
                onChange={(e) => setBranding({ ...branding, logoUrl: e.target.value })}
                placeholder="https://exemplo.ao/logo.png"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Cor Primária</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={branding.primaryColor}
                  onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                  className="h-10 w-12 cursor-pointer rounded border"
                />
                <Input
                  value={branding.primaryColor}
                  onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                  placeholder="#1A3E6E"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informação Comercial */}
      <Card>
        <CardTitle>
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            Informação Comercial
          </div>
        </CardTitle>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium">NIF</label>
              <Input
                value={business.nif}
                onChange={(e) => setBusiness({ ...business, nif: e.target.value })}
                placeholder="5000000000"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Morada</label>
              <Input
                value={business.address}
                onChange={(e) => setBusiness({ ...business, address: e.target.value })}
                placeholder="Morada da empresa"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Contacto</label>
              <Input
                value={business.contact}
                onChange={(e) => setBusiness({ ...business, contact: e.target.value })}
                placeholder="+244 900 000 000"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botão guardar */}
      <div className="flex justify-end">
        <Button size="lg">
          Guardar Definições
        </Button>
      </div>
    </div>
  )
}
