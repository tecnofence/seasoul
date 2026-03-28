'use client'

import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatDateTime } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, MessageSquare, Search, User, Clock } from 'lucide-react'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Conversation {
  id: string
  guestName: string
  lastMessage: string
  unread: number
  reservationId: string
  updatedAt?: string
}

interface Message {
  id: string
  body?: string
  content?: string
  senderType?: string
  senderId?: string
  userId?: string
  createdAt: string
}

// ─── Dados de fallback ────────────────────────────────────────────────────────

const MOCK_CONVERSATIONS: Conversation[] = [
  { id: '1', guestName: 'João Silva',    lastMessage: 'Preciso de toalhas extra',  unread: 2, reservationId: 'RES-001' },
  { id: '2', guestName: 'Maria Santos',  lastMessage: 'Quando é o check-out?',      unread: 0, reservationId: 'RES-002' },
  { id: '3', guestName: 'Carlos Mendes', lastMessage: 'Obrigado pela ajuda!',       unread: 0, reservationId: 'RES-003' },
  { id: '4', guestName: 'Ana Ferreira',  lastMessage: 'O ar condicionado não funciona', unread: 1, reservationId: 'RES-004' },
  { id: '5', guestName: 'Pedro Costa',   lastMessage: 'Boa tarde, tudo bem?',       unread: 0, reservationId: 'RES-005' },
]

// ─── Componente principal ─────────────────────────────────────────────────────

export default function ChatPage() {
  const queryClient = useQueryClient()
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [search, setSearch] = useState('')
  const [messageInput, setMessageInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // ── Lista de conversas ───────────────────────────────────────────────────
  const { data: conversationsData } = useQuery({
    queryKey: ['chat', 'conversations'],
    queryFn: () =>
      api.get('/chat/conversations', { params: { limit: 50 } })
        .then((r) => r.data)
        .catch(() => ({ data: MOCK_CONVERSATIONS })),
    refetchInterval: 10000,
  })

  const conversations: Conversation[] = conversationsData?.data ?? MOCK_CONVERSATIONS

  const filteredConversations = conversations.filter((c) =>
    c.guestName.toLowerCase().includes(search.toLowerCase()) ||
    c.reservationId.toLowerCase().includes(search.toLowerCase())
  )

  // ── Mensagens da conversa activa ─────────────────────────────────────────
  const { data: messagesData, isLoading: isLoadingMessages } = useQuery({
    queryKey: ['chat', 'messages', selectedConversation?.id],
    queryFn: () =>
      api.get(`/chat/messages/${selectedConversation!.id}`)
        .then((r) => r.data)
        .catch(() => ({ data: [] })),
    enabled: !!selectedConversation,
    refetchInterval: 5000,
  })

  const messages: Message[] = messagesData?.data ?? []

  // ── Enviar mensagem ──────────────────────────────────────────────────────
  const sendMutation = useMutation({
    mutationFn: (body: string) =>
      api.post('/chat/messages', {
        conversationId: selectedConversation!.id,
        body,
        senderId: 'staff',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'messages', selectedConversation?.id] })
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] })
      setMessageInput('')
    },
  })

  // ── Marcar como lidas ao seleccionar ────────────────────────────────────
  const markReadMutation = useMutation({
    mutationFn: (conversationId: string) =>
      api.patch('/chat/read', { conversationId }).catch(() => null),
  })

  useEffect(() => {
    if (selectedConversation) {
      markReadMutation.mutate(selectedConversation.id)
    }
  }, [selectedConversation?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Scroll para o fundo ──────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleSelectConversation(conv: Conversation) {
    setSelectedConversation(conv)
    setMessageInput('')
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (messageInput.trim()) {
      sendMutation.mutate(messageInput.trim())
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex h-[calc(100vh-112px)] overflow-hidden rounded-xl border bg-white shadow-sm">

      {/* ── Painel esquerdo — lista de conversas ──────────────────────────── */}
      <div className="flex w-80 flex-shrink-0 flex-col border-r">
        {/* Cabeçalho */}
        <div className="border-b px-4 py-4">
          <h1 className="mb-3 text-lg font-bold text-gray-900">Mensagens</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar hóspede ou reserva..."
              className="pl-9 text-sm"
            />
          </div>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-gray-400">Nenhuma conversa encontrada</p>
          ) : (
            filteredConversations.map((conv) => {
              const isActive = selectedConversation?.id === conv.id
              return (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv)}
                  className={`flex w-full items-start gap-3 border-b px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
                    isActive ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                  }`}
                >
                  {/* Avatar */}
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  {/* Conteúdo */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="truncate text-sm font-semibold text-gray-900">{conv.guestName}</span>
                      {conv.unread > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-white">
                          {conv.unread}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-gray-500">{conv.lastMessage}</p>
                    <p className="mt-0.5 text-xs text-gray-400">{conv.reservationId}</p>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* ── Painel direito — conversa activa ──────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {!selectedConversation ? (
          /* Estado vazio */
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-gray-400">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <MessageSquare className="h-8 w-8 text-gray-300" />
            </div>
            <p className="text-base font-medium">Selecione uma conversa</p>
            <p className="text-sm text-gray-400">Escolha uma conversa à esquerda para começar</p>
          </div>
        ) : (
          <>
            {/* Cabeçalho da conversa */}
            <div className="flex items-center gap-3 border-b bg-gray-50 px-5 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">{selectedConversation.guestName}</p>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {selectedConversation.reservationId}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-green-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    Online
                  </span>
                </div>
              </div>
            </div>

            {/* Área de mensagens */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {isLoadingMessages ? (
                <p className="py-8 text-center text-sm text-gray-400">A carregar mensagens...</p>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2 text-gray-400">
                  <MessageSquare className="h-8 w-8 text-gray-300" />
                  <p className="text-sm">Sem mensagens nesta conversa</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isStaff = msg.senderType === 'staff' || !!msg.userId
                  const text = msg.body ?? msg.content ?? ''
                  return (
                    <div key={msg.id} className={`flex ${isStaff ? 'justify-end' : 'justify-start'}`}>
                      {!isStaff && (
                        <div className="mr-2 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 self-end mb-5">
                          <User className="h-3.5 w-3.5 text-gray-500" />
                        </div>
                      )}
                      <div className={`max-w-[72%] rounded-2xl px-4 py-2.5 ${
                        isStaff
                          ? 'rounded-br-sm bg-primary text-white'
                          : 'rounded-bl-sm bg-white text-gray-900 shadow-sm border border-gray-100'
                      }`}>
                        <p className="text-sm leading-relaxed">{text}</p>
                        <div className={`mt-1 flex items-center gap-1 ${isStaff ? 'justify-end' : 'justify-start'}`}>
                          <Clock className={`h-3 w-3 ${isStaff ? 'text-white/50' : 'text-gray-400'}`} />
                          <p className={`text-xs ${isStaff ? 'text-white/60' : 'text-gray-400'}`}>
                            {formatDateTime(msg.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input de mensagem */}
            <div className="border-t bg-white px-4 py-3">
              <form onSubmit={handleSend} className="flex gap-2">
                <Input
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder={`Responder a ${selectedConversation.guestName}...`}
                  className="flex-1"
                  disabled={sendMutation.isPending}
                />
                <Button
                  type="submit"
                  disabled={!messageInput.trim() || sendMutation.isPending}
                  className="bg-primary text-white hover:bg-primary/90"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
