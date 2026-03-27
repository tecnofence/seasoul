'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'

const schema = z.object({
  title: z.string().min(2, 'Título obrigatório'),
  description: z.string().optional(),
  propertyType: z.enum(
    ['APARTMENT', 'HOUSE', 'LAND', 'COMMERCIAL', 'WAREHOUSE', 'OFFICE'],
    { required_error: 'Tipo de propriedade obrigatório' },
  ),
  purpose: z.enum(['SALE', 'RENT'], { required_error: 'Finalidade obrigatória' }),
  price: z
    .string()
    .min(1, 'Preço obrigatório')
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0, 'Preço inválido'),
  area: z
    .string()
    .min(1, 'Área obrigatória')
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, 'Área deve ser um número positivo'),
  bedrooms: z.string().optional(),
  bathrooms: z.string().optional(),
  location: z.string().min(2, 'Localização obrigatória'),
  address: z.string().min(2, 'Endereço obrigatório'),
})

type FormData = z.infer<typeof schema>

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

export default function NewPropertyPage() {
  const router = useRouter()
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      propertyType: 'APARTMENT',
      purpose: 'SALE',
    },
  })

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      api.post('/real-estate', {
        title: data.title,
        description: data.description || undefined,
        propertyType: data.propertyType,
        purpose: data.purpose,
        price: parseFloat(data.price),
        area: parseFloat(data.area),
        bedrooms: data.bedrooms ? parseInt(data.bedrooms, 10) : undefined,
        bathrooms: data.bathrooms ? parseInt(data.bathrooms, 10) : undefined,
        location: data.location,
        address: data.address,
      }),
    onSuccess: () => router.push('/dashboard/properties'),
    onError: (err: any) => setError(err.response?.data?.error || 'Erro ao criar imóvel'),
  })

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="rounded-md p-1 text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold">Novo Imóvel</h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>}

          <div>
            <label className="mb-1 block text-sm font-medium">Título</label>
            <Input {...register('title')} placeholder="Ex: Moradia T3 com piscina" />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Tipo de Imóvel</label>
              <select
                {...register('propertyType')}
                className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {Object.entries(PROPERTY_TYPE_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              {errors.propertyType && <p className="text-xs text-red-500 mt-1">{errors.propertyType.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Finalidade</label>
              <select
                {...register('purpose')}
                className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {Object.entries(PURPOSE_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              {errors.purpose && <p className="text-xs text-red-500 mt-1">{errors.purpose.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Preço (AOA)</label>
              <Input {...register('price')} type="number" step="0.01" min="0" placeholder="0.00" />
              {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Área (m²)</label>
              <Input {...register('area')} type="number" step="0.01" min="0.01" placeholder="0.00" />
              {errors.area && <p className="text-xs text-red-500 mt-1">{errors.area.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Quartos</label>
              <Input {...register('bedrooms')} type="number" min="0" placeholder="—" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Casas de Banho</label>
              <Input {...register('bathrooms')} type="number" min="0" placeholder="—" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Localização</label>
            <Input {...register('location')} placeholder="Ex: Cabo Ledo, Luanda" />
            {errors.location && <p className="text-xs text-red-500 mt-1">{errors.location.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Endereço</label>
            <Input {...register('address')} placeholder="Endereço completo" />
            {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Descrição</label>
            <textarea
              {...register('description')}
              className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm min-h-[80px]"
              placeholder="Descrição do imóvel..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'A criar...' : 'Criar Imóvel'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.back()}>
              Cancelar
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
