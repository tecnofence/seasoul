'use client'

import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatDateTime } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardTitle, CardContent } from '@/components/ui/card'
import { Send, MessageSquare } from 'lucide-react'

export default function ChatPage() {
  const queryClient = useQueryClient()
  const [reservationId, setReservationId] = useState('')
  const [activeReservation, setActiveReservation] = useState('')
  const [message, setMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { data: messages, isLoading } = useQuery({
    queryKey: ['chat', activeReservation],
    queryFn: () => api.get('/chat', { params: { reservationId: activeReservation, limit: 50 } }).then((r) => r.data),
    enabled: !!activeReservation,
    refetchInterval: 5000, // Poll a cada 5s
  })

  const sendMutation = useMutation({
    mutationFn: (content: string) => api.post('/chat', { reservationId: activeReservation, content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', activeReservation] })
      setMessage('')
    },
  })

  const markReadMutation = useMutation({
    mutationFn: () => api.patch('/chat/read', { reservationId: activeReservation }),
  })

  // Scroll para baixo ao carregar mensagens
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Marcar como lidas ao abrir
  useEffect(() => {
    if (activeReservation) {
      markReadMutation.mutate()
    }
  }, [activeReservation]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleLoadChat() {
    if (reservationId.trim()) {
      setActiveReservation(reservationId.trim())
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Chat — Mensagens</h1>

      {/* Seletor de reserva */}
      <Card>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium">ID da Reserva</label>
              <Input
                value={reservationId}
                onChange={(e) => setReservationId(e.target.value)}
                placeholder="Introduzir ID da reserva para ver mensagens"
                onKeyDown={(e) => e.key === 'Enter' && handleLoadChat()}
              />
            </div>
            <Button onClick={handleLoadChat} disabled={!reservationId.trim()}>
              <MessageSquare className="mr-2 h-4 w-4" />
              Carregar Chat
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Área de mensagens */}
      {activeReservation && (
        <Card className="flex flex-col" style={{ height: 'calc(100vh - 340px)', minHeight: '400px' }}>
          <div className="border-b px-6 py-3">
            <p className="text-sm font-medium text-gray-500">Reserva: <span className="text-gray-900">{activeReservation}</span></p>
          </div>

          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {isLoading ? (
              <p className="text-center text-sm text-gray-400 py-8">A carregar mensagens...</p>
            ) : !messages?.data?.length ? (
              <p className="text-center text-sm text-gray-400 py-8">Sem mensagens nesta reserva</p>
            ) : (
              messages.data.map((msg: any) => {
                const isStaff = msg.senderType === 'staff' || msg.userId
                return (
                  <div key={msg.id} className={`flex ${isStaff ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-lg px-4 py-2 ${isStaff ? 'bg-primary text-white' : 'bg-gray-100 text-gray-900'}`}>
                      <p className="text-sm">{msg.content}</p>
                      <p className={`mt-1 text-xs ${isStaff ? 'text-white/70' : 'text-gray-400'}`}>
                        {formatDateTime(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input de mensagem */}
          <div className="border-t p-4">
            <form
              onSubmit={(e) => { e.preventDefault(); if (message.trim()) sendMutation.mutate(message.trim()) }}
              className="flex gap-2"
            >
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Escrever mensagem..."
                className="flex-1"
              />
              <Button type="submit" disabled={!message.trim() || sendMutation.isPending}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </Card>
      )}
    </div>
  )
}
