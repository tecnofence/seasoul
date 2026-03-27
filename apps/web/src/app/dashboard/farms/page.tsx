'use client'

import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Wheat, Plus, MapPin, Maximize } from 'lucide-react'

export default function FarmsPage() {
  const router = useRouter()

  const { data, isLoading } = useQuery({
    queryKey: ['farms'],
    queryFn: () => api.get('/agriculture/farms', { params: { limit: 50 } }).then((r) => r.data),
  })

  const farms = data?.data ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Agricultura — Fazendas</h1>
        <Button onClick={() => router.push('/dashboard/farms/new')}><Plus className="mr-2 h-4 w-4" /> Nova Fazenda</Button>
      </div>

      {isLoading ? <p className="text-gray-500">A carregar...</p> : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {farms.map((f: any) => (
            <div key={f.id} className="cursor-pointer rounded-lg border bg-white p-5 shadow-sm transition-shadow hover:shadow-md" onClick={() => router.push(`/dashboard/farms/${f.id}`)}>
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><Wheat className="h-5 w-5 text-primary" /></div>
                  <div>
                    <h3 className="font-semibold">{f.name}</h3>
                    <p className="flex items-center gap-1 text-sm text-gray-500"><MapPin className="h-3 w-3" />{f.location ?? '—'}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1"><Maximize className="h-3 w-3" />{f.totalArea ?? '—'} ha</span>
                <span className="rounded bg-gray-100 px-2 py-0.5">{f.cropCount ?? f.crops?.length ?? 0} culturas</span>
              </div>
            </div>
          ))}
          {farms.length === 0 && (
            <div className="col-span-full rounded-lg border bg-white p-12 text-center">
              <Wheat className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-gray-500">Nenhuma fazenda registada</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
