'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'

const roleLabel: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  RESORT_MANAGER: 'Gestor Resort',
  RECEPTIONIST: 'Rececionista',
  POS_OPERATOR: 'Operador POS',
  STOCK_MANAGER: 'Gestor Stock',
  HR_MANAGER: 'Gestor RH',
  MAINTENANCE: 'Manutenção',
  HOUSEKEEPING: 'Housekeeping',
}

export default function UsersPage() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, search],
    queryFn: () =>
      api.get('/users', { params: { page, limit: 20, search: search || undefined } }).then((r) => r.data),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Utilizadores</h1>
        <Link href="/dashboard/users/new">
          <Button>Novo Utilizador</Button>
        </Link>
      </div>

      <Input
        placeholder="Pesquisar por nome ou email..."
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1) }}
        className="max-w-md"
      />

      <Card className="p-0">
        {isLoading ? (
          <div className="flex h-32 items-center justify-center text-gray-500">A carregar...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>2FA</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.data?.map((user: any) => (
                <TableRow key={user.id} className="cursor-pointer hover:bg-gray-50" onClick={() => router.push(`/dashboard/users/${user.id}`)}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{roleLabel[user.role] ?? user.role}</TableCell>
                  <TableCell>
                    <Badge variant={user.twoFaEnabled ? 'success' : 'default'}>
                      {user.twoFaEnabled ? 'Ativo' : 'Não'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.active ? 'success' : 'danger'}>
                      {user.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {!data?.data?.length && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500">Sem utilizadores</TableCell>
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
