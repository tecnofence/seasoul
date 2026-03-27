'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatDateTime } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Bell, CheckCheck, Mail, MailOpen } from 'lucide-react'

const channelLabel: Record<string, string> = {
  SYSTEM: 'Sistema',
  EMAIL: 'Email',
  SMS: 'SMS',
  PUSH: 'Push',
}

export default function NotificationsPage() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['notifications-me'],
    queryFn: () => api.get('/notifications/me').then((r) => r.data),
  })

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications-me'] }),
  })

  const markAllReadMutation = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications-me'] }),
  })

  const notifications = data?.data ?? []
  const unread = data?.unread ?? 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Notificações</h1>
          {unread > 0 && (
            <Badge variant="danger">{unread} não lida{unread > 1 ? 's' : ''}</Badge>
          )}
        </div>
        {unread > 0 && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
          >
            <CheckCheck className="mr-2 h-4 w-4" />
            Marcar Todas como Lidas
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex h-32 items-center justify-center text-gray-500">A carregar...</div>
      ) : notifications.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-12 text-gray-400">
          <Bell className="mb-3 h-12 w-12" />
          <p className="text-lg font-medium">Sem notificações</p>
          <p className="text-sm">Está tudo em dia!</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n: any) => {
            const isRead = !!n.readAt
            return (
              <Card
                key={n.id}
                className={`flex items-start gap-4 transition-colors ${!isRead ? 'border-primary/30 bg-primary/5' : ''}`}
              >
                <div className="mt-0.5 shrink-0">
                  {isRead ? (
                    <MailOpen className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Mail className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className={`text-sm ${!isRead ? 'font-semibold' : 'font-medium text-gray-600'}`}>
                      {n.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">{channelLabel[n.channel] ?? n.channel}</Badge>
                      <span className="text-xs text-gray-400">{formatDateTime(n.createdAt)}</span>
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">{n.message}</p>
                </div>
                {!isRead && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0"
                    onClick={() => markReadMutation.mutate(n.id)}
                    disabled={markReadMutation.isPending}
                  >
                    Lida
                  </Button>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
