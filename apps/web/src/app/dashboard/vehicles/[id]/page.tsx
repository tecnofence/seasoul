'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import api from '@/lib/api'
import { formatDate, formatDateTime, formatKwanza } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { ArrowLeft, Pencil, Car, Fuel, Gauge, Plus } from 'lucide-react'

const TYPE_LABEL: Record<string, string> = { CAR: 'Ligeiro', VAN: 'Carrinha', TRUCK: 'Camião', MOTORCYCLE: 'Mota', BUS: 'Autocarro', EQUIPMENT: 'Equipamento' }
const STATUS_LABEL: Record<string, string> = { AVAILABLE: 'Disponível', IN_USE: 'Em Uso', MAINTENANCE: 'Manutenção', DECOMMISSIONED: 'Abatido' }
const STATUS_VARIANT: Record<string, 'success' | 'info' | 'warning' | 'danger'> = { AVAILABLE: 'success', IN_USE: 'info', MAINTENANCE: 'warning', DECOMMISSIONED: 'danger' }

const fuelLogSchema = z.object({
  liters: z.coerce.number().min(0.1, 'Litros obrigatório'),
  cost: z.coerce.number().min(0, 'Custo obrigatório'),
  mileage: z.coerce.number().min(0, 'Quilometragem obrigatória'),
  fuelType: z.string().optional(),
  notes: z.string().optional(),
})

type FuelLogForm = z.infer<typeof fuelLogSchema>

export default function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [showFuelForm, setShowFuelForm] = useState(false)
  const [fuelError, setFuelError] = useState('')

  const { data: vehicle, isLoading } = useQuery({
    queryKey: ['vehicle', id],
    queryFn: () => api.get(`/fleet/${id}`).then((r) => r.data.data),
  })

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FuelLogForm>({
    resolver: zodResolver(fuelLogSchema),
  })

  const fuelMutation = useMutation({
    mutationFn: (data: FuelLogForm) => api.post(`/fleet/${id}/fuel-logs`, {
      ...data,
      fuelType: data.fuelType || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle', id] })
      setShowFuelForm(false)
      setFuelError('')
      reset()
    },
    onError: (err: any) => setFuelError(err.response?.data?.error || 'Erro ao registar abastecimento'),
  })

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center text-gray-500">A carregar...</div>
  }

  if (!vehicle) {
    return <div className="flex h-64 items-center justify-center text-gray-500">Veículo não encontrado</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft size={20} />
        </button>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Car className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{vehicle.brand} {vehicle.model}</h1>
          <p className="font-mono text-sm text-gray-500">{vehicle.plate}</p>
        </div>
        <Badge variant={STATUS_VARIANT[vehicle.status] ?? 'default'}>
          {STATUS_LABEL[vehicle.status] ?? vehicle.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardTitle>Detalhes do Veículo</CardTitle>
          <CardContent>
            <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-gray-500">Matrícula</dt>
                <dd className="font-medium font-mono">{vehicle.plate}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Tipo</dt>
                <dd>{TYPE_LABEL[vehicle.type] ?? vehicle.type}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Marca / Modelo</dt>
                <dd>{vehicle.brand} {vehicle.model}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Ano</dt>
                <dd>{vehicle.year || '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Combustível</dt>
                <dd className="flex items-center gap-1"><Fuel className="h-4 w-4 text-gray-400" />{vehicle.fuelType || '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Quilometragem</dt>
                <dd className="flex items-center gap-1"><Gauge className="h-4 w-4 text-gray-400" />{vehicle.mileage?.toLocaleString() ?? '—'} km</dd>
              </div>
              <div>
                <dt className="text-gray-500">Cor</dt>
                <dd>{vehicle.color || '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">VIN (Chassi)</dt>
                <dd className="font-mono text-xs">{vehicle.vin || '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Validade do Seguro</dt>
                <dd>{vehicle.insuranceExpiry ? formatDate(vehicle.insuranceExpiry) : '—'}</dd>
              </div>
            </dl>
            {vehicle.notes && (
              <div className="mt-4 text-sm">
                <dt className="text-gray-500">Notas</dt>
                <dd className="mt-1 whitespace-pre-wrap">{vehicle.notes}</dd>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardTitle>Ações</CardTitle>
          <CardContent className="space-y-3">
            <Button className="w-full" onClick={() => router.push(`/dashboard/vehicles/${id}/edit`)}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Button>
            <Button variant="secondary" className="w-full" onClick={() => setShowFuelForm(!showFuelForm)}>
              <Plus className="mr-2 h-4 w-4" />
              Registar Abastecimento
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Formulário inline de abastecimento */}
      {showFuelForm && (
        <Card>
          <CardTitle>Novo Abastecimento</CardTitle>
          <CardContent>
            <form onSubmit={handleSubmit((data) => fuelMutation.mutate(data))} className="space-y-4">
              {fuelError && <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{fuelError}</p>}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">Litros</label>
                  <Input {...register('liters')} type="number" step="0.01" placeholder="0.00" />
                  {errors.liters && <p className="text-xs text-red-500 mt-1">{errors.liters.message}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Custo (AOA)</label>
                  <Input {...register('cost')} type="number" step="0.01" placeholder="0.00" />
                  {errors.cost && <p className="text-xs text-red-500 mt-1">{errors.cost.message}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Quilometragem Atual</label>
                  <Input {...register('mileage')} type="number" placeholder="0" />
                  {errors.mileage && <p className="text-xs text-red-500 mt-1">{errors.mileage.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">Tipo de Combustível</label>
                  <select {...register('fuelType')} className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">
                    <option value="">Selecionar</option>
                    <option value="DIESEL">Diesel</option>
                    <option value="GASOLINE">Gasolina</option>
                    <option value="ELECTRIC">Elétrico</option>
                    <option value="HYBRID">Híbrido</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Notas</label>
                  <Input {...register('notes')} placeholder="Observações..." />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={fuelMutation.isPending}>
                  {fuelMutation.isPending ? 'A registar...' : 'Registar'}
                </Button>
                <Button type="button" variant="secondary" onClick={() => { setShowFuelForm(false); setFuelError('') }}>Cancelar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tabela de abastecimentos */}
      {vehicle.fuelLogs?.length > 0 && (
        <Card>
          <CardTitle>Histórico de Abastecimentos</CardTitle>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Litros</TableHead>
                  <TableHead>Custo</TableHead>
                  <TableHead>Quilometragem</TableHead>
                  <TableHead>Combustível</TableHead>
                  <TableHead>Notas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicle.fuelLogs.map((log: any) => (
                  <TableRow key={log.id}>
                    <TableCell>{formatDateTime(log.createdAt)}</TableCell>
                    <TableCell>{parseFloat(log.liters).toFixed(2)} L</TableCell>
                    <TableCell>{formatKwanza(Number(log.cost))}</TableCell>
                    <TableCell>{log.mileage?.toLocaleString()} km</TableCell>
                    <TableCell>{log.fuelType || '—'}</TableCell>
                    <TableCell className="text-gray-500">{log.notes || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
