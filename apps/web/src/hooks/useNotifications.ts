'use client'

import { useContext } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { NotificationContext } from '@/providers/notification-provider'

export function useNotifications() {
  const queryClient = useQueryClient()
  const { addToast, toasts, removeToast } = useContext(NotificationContext)

  // Buscar todas as notificações do utilizador
  const { data, isLoading } = useQuery({
    queryKey: ['notifications-me'],
    queryFn: () => api.get('/notifications/me').then((r) => r.data),
    refetchInterval: 30000, // Polling a cada 30 segundos
  })

  // Buscar apenas não lidas (para o bell)
  const { data: unreadData } = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: () =>
      api
        .get('/notifications/me', { params: { unread: true, limit: 5 } })
        .then((r) => r.data),
    refetchInterval: 30000,
  })

  const markAsRead = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-me'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] })
    },
  })

  const markAllAsRead = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-me'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/notifications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-me'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] })
    },
  })

  const notifications = data?.data ?? []
  const unreadCount = data?.unread ?? 0
  const recentUnread = unreadData?.data ?? []

  return {
    notifications,
    unreadCount,
    recentUnread,
    isLoading,
    markAsRead: markAsRead.mutate,
    markAllAsRead: markAllAsRead.mutate,
    deleteNotification: deleteMutation.mutate,
    isMarkingRead: markAsRead.isPending,
    isMarkingAllRead: markAllAsRead.isPending,
    addToast,
    toasts,
    removeToast,
  }
}
