'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatKwanza } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'

export default function ProductsPage() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['products', page, search],
    queryFn: () =>
      api.get('/products', { params: { page, limit: 20, search: search || undefined } }).then((r) => r.data),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Produtos</h1>
        <Link href="/dashboard/products/new">
          <Button>Novo Produto</Button>
        </Link>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Pesquisar produto..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="max-w-md"
        />
      </div>

      <Card className="p-0">
        {isLoading ? (
          <div className="flex h-32 items-center justify-center text-gray-500">A carregar...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Departamento</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>IVA</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.data?.map((p: any) => (
                <TableRow key={p.id} className="cursor-pointer hover:bg-gray-50" onClick={() => router.push(`/dashboard/products/${p.id}`)}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{p.category}</TableCell>
                  <TableCell>{p.department}</TableCell>
                  <TableCell>{formatKwanza(p.unitPrice)}</TableCell>
                  <TableCell>{parseFloat(p.taxRate)}%</TableCell>
                  <TableCell>
                    <Badge variant={p.active ? 'success' : 'danger'}>
                      {p.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {!data?.data?.length && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500">Sem produtos</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</Button>
          <span className="text-sm text-gray-600">Página {page} de {data.totalPages}</span>
          <Button variant="secondary" size="sm" disabled={page >= data.totalPages} onClick={() => setPage(page + 1)}>Seguinte</Button>
        </div>
      )}
    </div>
  )
}
