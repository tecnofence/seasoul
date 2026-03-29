'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatKwanza } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { SkeletonTable } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Store, Plus } from 'lucide-react'

export default function StoresPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['retail-stores'],
    queryFn: () => api.get('/v1/retail/stores').then((r) => r.data),
  })

  const stores: any[] = data?.data ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A3E6E]">Lojas</h1>
          <p className="text-sm text-gray-500 mt-1">Gestão de lojas do módulo Retail</p>
        </div>
        <Link href="/dashboard/retail/stores/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nova Loja
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <SkeletonTable rows={5} cols={4} />
      ) : stores.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Store className="w-12 h-12 mb-4 opacity-30" />
            <p className="font-medium">Nenhuma loja registada</p>
            <p className="text-sm mt-1">Crie a primeira loja para começar</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stores.map((store: any) => (
            <Link key={store.id} href={`/dashboard/retail/stores/${store.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Store className="w-5 h-5 text-[#1A3E6E]" />
                      <span className="font-semibold text-gray-900">{store.name}</span>
                    </div>
                    <Badge variant={store.status === 'ACTIVE' ? 'success' : 'secondary'}>
                      {store.status === 'ACTIVE' ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </div>
                  {store.address && (
                    <p className="text-sm text-gray-500 mb-2">{store.address}</p>
                  )}
                  {store.revenue != null && (
                    <p className="text-sm font-medium text-gray-700">
                      Receita: {formatKwanza(store.revenue)}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
