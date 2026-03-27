'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatDateTime } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { FileText, Download, Trash2 } from 'lucide-react'

const typeLabel: Record<string, string> = {
  ID_DOCUMENT: 'Documento ID',
  CONTRACT: 'Contrato',
  INVOICE: 'Fatura',
  PHOTO: 'Foto',
  MEDICAL: 'Médico',
  VISA: 'Visto',
  OTHER: 'Outro',
}

const typeVariant: Record<string, 'info' | 'success' | 'warning' | 'default'> = {
  ID_DOCUMENT: 'info',
  CONTRACT: 'success',
  INVOICE: 'warning',
  PHOTO: 'default',
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function DocumentsPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [entityType, setEntityType] = useState('')
  const [entityId, setEntityId] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['documents', page, entityType, entityId],
    queryFn: () =>
      api.get('/documents', {
        params: { page, limit: 20, entityType: entityType || undefined, entityId: entityId || undefined },
      }).then((r) => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/documents/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documents'] }),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Documentos</h1>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <select
          value={entityType}
          onChange={(e) => { setEntityType(e.target.value); setPage(1) }}
          className="flex h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm sm:w-48"
        >
          <option value="">Todas as entidades</option>
          <option value="guest">Hóspedes</option>
          <option value="employee">Colaboradores</option>
          <option value="reservation">Reservas</option>
          <option value="supplier">Fornecedores</option>
        </select>
        <Input
          placeholder="ID da entidade..."
          value={entityId}
          onChange={(e) => { setEntityId(e.target.value); setPage(1) }}
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
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Entidade</TableHead>
                <TableHead>Tamanho</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.data?.map((doc: any) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-400 shrink-0" />
                      <span className="font-medium truncate max-w-[200px]">{doc.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={typeVariant[doc.type] ?? 'default'}>
                      {typeLabel[doc.type] ?? doc.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    <span className="text-gray-500">{doc.entityType}</span>
                    <span className="ml-1 font-mono text-xs text-gray-400">{doc.entityId?.slice(0, 8)}</span>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">{formatBytes(doc.sizeBytes)}</TableCell>
                  <TableCell className="text-sm">{formatDateTime(doc.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="sm"><Download className="h-4 w-4" /></Button>
                      </a>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm('Apagar este documento?')) deleteMutation.mutate(doc.id)
                        }}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!data?.data?.length && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500">Sem documentos</TableCell>
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
