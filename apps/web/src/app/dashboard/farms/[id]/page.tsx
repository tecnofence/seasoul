'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import api from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardTitle, CardContent } from '@/components/ui/card'
import { ArrowLeft, Leaf, Wheat, Pencil, X } from 'lucide-react'

const editSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  location: z.string().min(2, 'Localização obrigatória'),
})

type EditFormData = z.infer<typeof editSchema>

const CROP_STATUS_LABEL: Record<string, string> = {
  PLANTED: 'Plantado',
  GROWING: 'A crescer',
  READY: 'Pronto para colheita',
  HARVESTED: 'Colhido',
  FAILED: 'Falhou',
}

const CROP_STATUS_VARIANT: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  PLANTED: 'info',
  GROWING: 'info',
  READY: 'warning',
  HARVESTED: 'success',
  FAILED: 'danger',
}

export default function FarmDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)

  const { data: farm, isLoading } = useQuery({
    queryKey: ['farm', id],
    queryFn: () => api.get(`/agriculture/farms/${id}`).then((r) => r.data.data),
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
  })

  const editMutation = useMutation({
    mutationFn: (data: EditFormData) => api.put(`/agriculture/farms/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farm', id] })
      setEditing(false)
      setError('')
    },
    onError: (err: any) => setError(err.response?.data?.error || 'Erro ao atualizar fazenda'),
  })

  const handleEditOpen = () => {
    reset({ name: farm?.name ?? '', location: farm?.location ?? '' })
    setEditing(true)
  }

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center text-gray-500">A carregar...</div>
  }

  if (!farm) {
    return <div className="flex h-64 items-center justify-center text-gray-500">Fazenda não encontrada</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{farm.name}</h1>
          <p className="text-sm text-gray-500">{farm.location}</p>
        </div>
        <Button variant="secondary" onClick={handleEditOpen}>
          <Pencil className="mr-2 h-4 w-4" />
          Editar
        </Button>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>}

      {/* Edit modal */}
      {editing && (
        <Card>
          <CardTitle className="flex items-center justify-between">
            Editar Fazenda
            <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          </CardTitle>
          <CardContent>
            <form onSubmit={handleSubmit((data) => editMutation.mutate(data))} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Nome da Fazenda</label>
                <Input {...register('name')} />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Localização</label>
                <Input {...register('location')} />
                {errors.location && <p className="text-xs text-red-500 mt-1">{errors.location.message}</p>}
              </div>
              <div className="flex gap-3">
                <Button type="submit" disabled={editMutation.isPending}>
                  {editMutation.isPending ? 'A guardar...' : 'Guardar'}
                </Button>
                <Button type="button" variant="secondary" onClick={() => setEditing(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardTitle>Informações da Fazenda</CardTitle>
          <CardContent>
            <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-gray-500">Nome</dt>
                <dd className="font-medium">{farm.name}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Localização</dt>
                <dd className="font-medium">{farm.location}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Área Total</dt>
                <dd className="font-medium">{farm.totalArea} ha</dd>
              </div>
              <div>
                <dt className="text-gray-500">Resort</dt>
                <dd className="font-medium">{farm.resort?.name || '—'}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardTitle>Resumo</CardTitle>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Culturas Ativas</span>
              <span className="font-semibold">
                {farm.crops?.filter((c: any) => c.status !== 'HARVESTED' && c.status !== 'FAILED').length ?? 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Total Culturas</span>
              <span className="font-semibold">{farm.crops?.length ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Total Colheitas</span>
              <span className="font-semibold">{farm.harvests?.length ?? 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Crops table */}
      <Card>
        <CardTitle className="flex items-center gap-2">
          <Leaf className="h-5 w-5 text-green-600" />
          Culturas
        </CardTitle>
        <CardContent>
          {farm.crops?.length > 0 ? (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-gray-50 text-left text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Cultura</th>
                    <th className="px-4 py-3">Data de Plantação</th>
                    <th className="px-4 py-3">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {farm.crops.map((crop: any) => (
                    <tr key={crop.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{crop.cropName}</td>
                      <td className="px-4 py-3 text-gray-500">
                        {crop.plantedDate ? formatDate(crop.plantedDate) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={CROP_STATUS_VARIANT[crop.status] ?? 'default'}>
                          {CROP_STATUS_LABEL[crop.status] ?? crop.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center">
              <Leaf className="mx-auto h-10 w-10 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">Nenhuma cultura registada</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Harvests table */}
      <Card>
        <CardTitle className="flex items-center gap-2">
          <Wheat className="h-5 w-5 text-amber-600" />
          Colheitas
        </CardTitle>
        <CardContent>
          {farm.harvests?.length > 0 ? (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-gray-50 text-left text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Cultura</th>
                    <th className="px-4 py-3">Data de Colheita</th>
                    <th className="px-4 py-3">Quantidade</th>
                    <th className="px-4 py-3">Unidade</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {farm.harvests.map((harvest: any) => (
                    <tr key={harvest.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{harvest.cropName}</td>
                      <td className="px-4 py-3 text-gray-500">
                        {harvest.harvestDate ? formatDate(harvest.harvestDate) : '—'}
                      </td>
                      <td className="px-4 py-3 font-semibold">{harvest.quantity ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{harvest.unit || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center">
              <Wheat className="mx-auto h-10 w-10 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">Nenhuma colheita registada</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
