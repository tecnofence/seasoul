'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardTitle, CardContent } from '@/components/ui/card'
import { GraduationCap, Power, PowerOff, Trash2, AlertTriangle, FileText, CheckCircle } from 'lucide-react'

export default function TrainingModePage() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['training-mode'],
    queryFn: () => api.get('/training-mode').then((r) => r.data.data),
  })

  const activateMutation = useMutation({
    mutationFn: () => api.post('/training-mode/activate'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-mode'] })
      queryClient.invalidateQueries({ queryKey: ['tenant-modules'] })
    },
  })

  const deactivateMutation = useMutation({
    mutationFn: () => api.post('/training-mode/deactivate'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-mode'] })
      queryClient.invalidateQueries({ queryKey: ['tenant-modules'] })
    },
  })

  const purgeMutation = useMutation({
    mutationFn: () => api.delete('/training-mode/purge'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-mode'] })
    },
  })

  const isEnabled = data?.enabled ?? false
  const docCount = data?.trainingDocuments ?? 0

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-gray-500">A carregar...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Modo Formação</h1>

      {/* Banner de estado */}
      <div className={`rounded-lg p-6 ${isEnabled ? 'bg-amber-50 border-2 border-amber-300' : 'bg-gray-50 border border-gray-200'}`}>
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className={`flex h-14 w-14 items-center justify-center rounded-full ${isEnabled ? 'bg-amber-200' : 'bg-gray-200'}`}>
              <GraduationCap className={`h-7 w-7 ${isEnabled ? 'text-amber-700' : 'text-gray-500'}`} />
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {isEnabled ? 'Modo Formação ATIVO' : 'Modo Formação Desativado'}
              </h2>
              <p className="text-sm text-gray-600">
                {isEnabled
                  ? 'Todos os documentos fiscais criados são fictícios e não são reportados à AGT.'
                  : 'Ative o modo formação para treinar a equipa com dados fictícios sem afetar dados reais.'}
              </p>
            </div>
          </div>
          <div>
            {isEnabled ? (
              <Button
                variant="ghost"
                onClick={() => deactivateMutation.mutate()}
                disabled={deactivateMutation.isPending}
                className="border-amber-400 text-amber-700 hover:bg-amber-100"
              >
                <PowerOff className="mr-2 h-4 w-4" />
                {deactivateMutation.isPending ? 'A desativar...' : 'Desativar'}
              </Button>
            ) : (
              <Button
                onClick={() => activateMutation.mutate()}
                disabled={activateMutation.isPending}
              >
                <Power className="mr-2 h-4 w-4" />
                {activateMutation.isPending ? 'A ativar...' : 'Ativar Modo Formação'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Estatísticas e ações */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardTitle>Documentos de Formação</CardTitle>
          <CardContent>
            <div className="flex items-center gap-4">
              <FileText className="h-10 w-10 text-blue-500" />
              <div>
                <p className="text-3xl font-bold">{docCount}</p>
                <p className="text-sm text-gray-500">documentos fictícios criados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardTitle>Como Funciona</CardTitle>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                Faturas usam série "TREINO" — nunca contam
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                Banner amarelo sempre visível no ecrã
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                Dados de formação não são enviados à AGT
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                Pode limpar todos os dados quando quiser
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardTitle>Limpar Dados</CardTitle>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-2 rounded-md bg-red-50 p-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <p className="text-sm text-red-700">
                  Esta ação elimina <strong>todos</strong> os documentos de formação permanentemente.
                </p>
              </div>
              <Button
                variant="ghost"
                className="w-full border-red-300 text-red-600 hover:bg-red-50"
                onClick={() => {
                  if (confirm('Tem a certeza que quer eliminar TODOS os dados de formação? Esta ação é irreversível.')) {
                    purgeMutation.mutate()
                  }
                }}
                disabled={purgeMutation.isPending || docCount === 0}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {purgeMutation.isPending ? 'A limpar...' : `Limpar ${docCount} documentos`}
              </Button>
              {purgeMutation.isSuccess && (
                <p className="text-center text-sm text-green-600">Dados limpos com sucesso!</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Séries de formação */}
      {isEnabled && (
        <Card>
          <CardTitle>Séries de Formação Ativas</CardTitle>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {['FT', 'FR', 'NC', 'ORC', 'PF', 'RC'].map((tipo) => (
                <div key={tipo} className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-center">
                  <p className="text-lg font-bold text-amber-800">{tipo}-TREINO</p>
                  <p className="text-xs text-amber-600">Série TREINO</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
