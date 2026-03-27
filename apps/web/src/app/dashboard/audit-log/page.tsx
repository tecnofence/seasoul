'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatDateTime } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'

const actionVariant: Record<string, 'success' | 'info' | 'warning' | 'danger'> = {
  CREATE: 'success',
  UPDATE: 'info',
  DELETE: 'danger',
  LOGIN: 'warning',
}

export default function AuditLogPage() {
  const [page, setPage] = useState(1)
  const [entity, setEntity] = useState('')
  const [action, setAction] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['audit-log', page, entity, action],
    queryFn: () =>
      api.get('/audit-log', {
        params: { page, limit: 30, entity: entity || undefined, action: action || undefined },
      }).then((r) => r.data),
  })

  const { data: entities } = useQuery({
    queryKey: ['audit-log-entities'],
    queryFn: () => api.get('/audit-log/entities').then((r) => r.data.data),
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Registo de Auditoria</h1>

      {/* Filtros */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <select
          value={entity}
          onChange={(e) => { setEntity(e.target.value); setPage(1) }}
          className="flex h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm sm:w-48"
        >
          <option value="">Todas as entidades</option>
          {(entities ?? []).map((e: string) => <option key={e} value={e}>{e}</option>)}
        </select>

        <Input
          placeholder="Filtrar por ação..."
          value={action}
          onChange={(e) => { setAction(e.target.value); setPage(1) }}
          className="sm:max-w-xs"
        />
      </div>

      <Card className="p-0">
        {isLoading ? (
          <div className="flex h-32 items-center justify-center text-gray-500">A carregar...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Utilizador</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Entidade</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.data?.map((log: any) => (
                <>
                  <TableRow
                    key={log.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                  >
                    <TableCell className="whitespace-nowrap">{formatDateTime(log.createdAt)}</TableCell>
                    <TableCell>{log.userEmail ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant={actionVariant[log.action] ?? 'default'}>{log.action}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{log.entity}</TableCell>
                    <TableCell className="font-mono text-xs">{log.entityId?.slice(0, 8)}...</TableCell>
                    <TableCell className="text-xs text-gray-400">{log.ipAddress ?? '—'}</TableCell>
                  </TableRow>
                  {expandedId === log.id && (
                    <TableRow key={`${log.id}-detail`}>
                      <TableCell colSpan={6} className="bg-gray-50 p-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          {log.before && (
                            <div>
                              <p className="mb-1 text-xs font-semibold text-gray-500">Antes</p>
                              <pre className="max-h-40 overflow-auto rounded bg-white p-2 text-xs">{JSON.stringify(log.before, null, 2)}</pre>
                            </div>
                          )}
                          {log.after && (
                            <div>
                              <p className="mb-1 text-xs font-semibold text-gray-500">Depois</p>
                              <pre className="max-h-40 overflow-auto rounded bg-white p-2 text-xs">{JSON.stringify(log.after, null, 2)}</pre>
                            </div>
                          )}
                          {!log.before && !log.after && (
                            <p className="text-sm text-gray-400">Sem dados de alteração disponíveis</p>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
              {!data?.data?.length && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500">Sem registos</TableCell>
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
