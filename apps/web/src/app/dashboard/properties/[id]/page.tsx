'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import api from '@/lib/api'
import { formatKwanza } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardTitle, CardContent } from '@/components/ui/card'
import { ArrowLeft, Pencil, X, Home } from 'lucide-react'

const editSchema = z.object({
  title: z.string().min(2, 'Título obrigatório'),
  price: z
    .string()
    .min(1, 'Preço obrigatório')
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0, 'Preço inválido'),
  status: z.enum(['AVAILABLE', 'SOLD', 'RENTED', 'RESERVED', 'UNDER_CONSTRUCTION'], {
    required_error: 'Estado obrigatório',
  }),
})

type EditFormData = z.infer<typeof editSchema>

const STATUS_LABEL: Record<string, string> = {
  AVAILABLE: 'Disponível',
  SOLD: 'Vendido',
  RENTED: 'Arrendado',
  RESERVED: 'Reservado',
  UNDER_CONSTRUCTION: 'Em Construção',
}

const STATUS_VARIANT: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  AVAILABLE: 'success',
  SOLD: 'danger',
  RENTED: 'info',
  RESERVED: 'warning',
  UNDER_CONSTRUCTION: 'default',
}

const PROPERTY_TYPE_LABEL: Record<string, string> = {
  APARTMENT: 'Apartamento',
  HOUSE: 'Casa',
  LAND: 'Terreno',
  COMMERCIAL: 'Comercial',
  WAREHOUSE: 'Armazém',
  OFFICE: 'Escritório',
}

const PURPOSE_LABEL: Record<string, string> = {
  SALE: 'Venda',
  RENT: 'Arrendamento',
}

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)

  const { data: property, isLoading } = useQuery({
    queryKey: ['property', id],
    queryFn: () => api.get(`/real-estate/${id}`).then((r) => r.data.data),
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
  })

  const editMutation = useMutation({
    mutationFn: (data: EditFormData) =>
      api.put(`/real-estate/${id}`, {
        title: data.title,
        price: parseFloat(data.price),
        status: data.status,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property', id] })
      setEditing(false)
      setError('')
    },
    onError: (err: any) => setError(err.response?.data?.error || 'Erro ao atualizar imóvel'),
  })

  const handleEditOpen = () => {
    reset({
      title: property?.title ?? '',
      price: property?.price != null ? String(property.price) : '',
      status: property?.status ?? 'AVAILABLE',
    })
    setEditing(true)
  }

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center text-gray-500">A carregar...</div>
  }

  if (!property) {
    return <div className="flex h-64 items-center justify-center text-gray-500">Imóvel não encontrado</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{property.title}</h1>
          <p className="text-sm text-gray-500">
            {PROPERTY_TYPE_LABEL[property.propertyType] ?? property.propertyType}
            {' · '}
            {PURPOSE_LABEL[property.purpose] ?? property.purpose}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={STATUS_VARIANT[property.status] ?? 'default'}>
            {STATUS_LABEL[property.status] ?? property.status}
          </Badge>
          <Button variant="secondary" onClick={handleEditOpen}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>}

      {/* Edit form */}
      {editing && (
        <Card>
          <CardTitle className="flex items-center justify-between">
            Editar Imóvel
            <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          </CardTitle>
          <CardContent>
            <form onSubmit={handleSubmit((data) => editMutation.mutate(data))} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Título</label>
                <Input {...register('title')} />
                {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Preço (AOA)</label>
                <Input {...register('price')} type="number" step="0.01" min="0" />
                {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price.message}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Estado</label>
                <select
                  {...register('status')}
                  className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {Object.entries(STATUS_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                {errors.status && <p className="text-xs text-red-500 mt-1">{errors.status.message}</p>}
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

      {/* Details */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardTitle>Detalhes do Imóvel</CardTitle>
          <CardContent>
            <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-gray-500">Título</dt>
                <dd className="font-medium">{property.title}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Tipo</dt>
                <dd>{PROPERTY_TYPE_LABEL[property.propertyType] ?? property.propertyType}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Finalidade</dt>
                <dd>{PURPOSE_LABEL[property.purpose] ?? property.purpose}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Estado</dt>
                <dd>
                  <Badge variant={STATUS_VARIANT[property.status] ?? 'default'}>
                    {STATUS_LABEL[property.status] ?? property.status}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Preço</dt>
                <dd className="font-semibold text-primary">
                  {property.price != null ? formatKwanza(Number(property.price)) : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Área</dt>
                <dd className="font-medium">{property.area} m²</dd>
              </div>
              {property.bedrooms != null && (
                <div>
                  <dt className="text-gray-500">Quartos</dt>
                  <dd>{property.bedrooms}</dd>
                </div>
              )}
              {property.bathrooms != null && (
                <div>
                  <dt className="text-gray-500">Casas de Banho</dt>
                  <dd>{property.bathrooms}</dd>
                </div>
              )}
              <div>
                <dt className="text-gray-500">Localização</dt>
                <dd>{property.location}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Endereço</dt>
                <dd>{property.address}</dd>
              </div>
            </dl>

            {property.description && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-500">Descrição</h4>
                <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{property.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardTitle>Ações</CardTitle>
          <CardContent className="space-y-3">
            <Button className="w-full" variant="secondary" onClick={handleEditOpen}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar Imóvel
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => router.push('/dashboard/properties')}
            >
              <Home className="mr-2 h-4 w-4" />
              Voltar à Lista
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
