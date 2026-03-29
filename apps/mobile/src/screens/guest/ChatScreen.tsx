import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import api, { getUserInfo } from '../../services/api'

// ---------------------------------------------------------------------------
// Constantes de cor
// ---------------------------------------------------------------------------
const COLORS = {
  primary: '#0A7EA4',
  primaryDark: '#075E78',
  primaryLight: '#E0F4FB',
  background: '#F0F9FF',
  white: '#FFFFFF',
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  border: '#CBD5E1',
  guestBubble: '#0A7EA4',
  guestBubbleText: '#FFFFFF',
  receptionBubble: '#f0f0f0',
  receptionBubbleText: '#0F172A',
  inputBg: '#FFFFFF',
  online: '#10B981',
  sendBtn: '#0A7EA4',
  chipBg: '#E0F4FB',
  chipText: '#0A7EA4',
  chipBorder: '#BAE6FD',
}

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------
interface ChatMessage {
  id: string
  content: string
  sender: 'GUEST' | 'RECEPTION'
  createdAt: string
  reservationId?: string
}

// ---------------------------------------------------------------------------
// Dados mock (fallback quando API indisponível)
// ---------------------------------------------------------------------------
const MOCK_MESSAGES: ChatMessage[] = [
  {
    id: 'm1',
    content: 'Bem-vindo(a) ao Sea and Soul! Como posso ajudá-lo(a)?',
    sender: 'RECEPTION',
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: 'm2',
    content: 'Precisaria de toalhas extra no quarto, por favor.',
    sender: 'GUEST',
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
  },
  {
    id: 'm3',
    content: 'Claro! Enviaremos as toalhas em breve. Precisa de mais alguma coisa?',
    sender: 'RECEPTION',
    createdAt: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
  },
]

// ---------------------------------------------------------------------------
// Respostas rápidas
// ---------------------------------------------------------------------------
const QUICK_REPLIES = [
  'Preciso de ajuda',
  'Obrigado',
  'Quando é o check-out?',
  'Preciso de toalhas',
]

// ---------------------------------------------------------------------------
// Utilitários
// ---------------------------------------------------------------------------
function formatTime(isoDate: string): string {
  const d = new Date(isoDate)
  return d.toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' })
}

// ---------------------------------------------------------------------------
// Sub-componentes
// ---------------------------------------------------------------------------
function MessageBubble({ message }: { message: ChatMessage }) {
  const isGuest = message.sender === 'GUEST'
  return (
    <View
      style={[
        styles.bubbleWrapper,
        isGuest ? styles.bubbleWrapperGuest : styles.bubbleWrapperReception,
      ]}
    >
      {!isGuest && (
        <View style={styles.avatarSmall}>
          <Ionicons name="person" size={14} color={COLORS.primary} />
        </View>
      )}
      <View
        style={[
          styles.bubble,
          isGuest ? styles.bubbleGuest : styles.bubbleReception,
        ]}
      >
        <Text
          style={[
            styles.bubbleText,
            isGuest ? styles.bubbleTextGuest : styles.bubbleTextReception,
          ]}
        >
          {message.content}
        </Text>
        <Text
          style={[
            styles.bubbleTime,
            isGuest ? styles.bubbleTimeGuest : styles.bubbleTimeReception,
          ]}
        >
          {formatTime(message.createdAt)}
        </Text>
      </View>
    </View>
  )
}

// ---------------------------------------------------------------------------
// Ecrã principal
// ---------------------------------------------------------------------------
export default function ChatScreen() {
  const queryClient = useQueryClient()
  const [inputText, setInputText] = useState('')
  const [reservationId, setReservationId] = useState<string | null>(null)
  const [useMock, setUseMock] = useState(false)
  const [optimisticMessages, setOptimisticMessages] = useState<ChatMessage[]>([])
  const flatListRef = useRef<FlatList<ChatMessage>>(null)

  // Carrega o reservationId do utilizador atual
  useEffect(() => {
    getUserInfo().then((info) => {
      if (info?.id) setReservationId(info.id)
    })
  }, [])

  // Busca mensagens do chat
  const {
    data: apiMessages,
    isLoading,
    isError,
  } = useQuery<ChatMessage[]>({
    queryKey: ['chat', reservationId],
    queryFn: async () => {
      if (!reservationId) return []
      const res = await api.get<{ data: ChatMessage[] }>(
        `/chat?reservationId=${reservationId}`
      )
      return res.data.data
    },
    enabled: !!reservationId,
    refetchInterval: 8000, // polling a cada 8 segundos
    retry: 1,
    onError: () => {
      setUseMock(true)
    },
  } as Parameters<typeof useQuery>[0])

  const messages: ChatMessage[] = useMock
    ? [...MOCK_MESSAGES, ...optimisticMessages]
    : [...(apiMessages ?? []), ...optimisticMessages]

  // Mutação para enviar mensagem
  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await api.post<{ data: ChatMessage }>('/chat', {
        content,
        reservationId,
        sender: 'GUEST',
      })
      return res.data.data
    },
    onSuccess: () => {
      setOptimisticMessages([])
      queryClient.invalidateQueries({ queryKey: ['chat', reservationId] })
    },
    onError: () => {
      // Mensagem optimista mantida no estado
    },
  })

  const handleSend = useCallback(
    (text: string) => {
      const trimmed = text.trim()
      if (!trimmed) return

      // Adiciona mensagem optimista imediatamente
      const optimistic: ChatMessage = {
        id: `opt-${Date.now()}`,
        content: trimmed,
        sender: 'GUEST',
        createdAt: new Date().toISOString(),
        reservationId: reservationId ?? undefined,
      }
      setOptimisticMessages((prev) => [...prev, optimistic])
      setInputText('')

      // Tenta enviar para a API
      if (!useMock && reservationId) {
        sendMutation.mutate(trimmed)
      }
    },
    [reservationId, useMock, sendMutation]
  )

  // Auto-scroll para o fim quando chegam novas mensagens
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true })
      }, 100)
    }
  }, [messages.length])

  const renderMessage = useCallback(
    ({ item }: { item: ChatMessage }) => <MessageBubble message={item} />,
    []
  )

  const keyExtractor = useCallback((item: ChatMessage) => item.id, [])

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerAvatar}>
            <Ionicons name="headset" size={22} color={COLORS.white} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Chat com a Receção</Text>
            <View style={styles.onlineRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Online — a responder</Text>
            </View>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Lista de mensagens */}
        {isLoading && !useMock ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>A carregar conversa...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={keyExtractor}
            renderItem={renderMessage}
            contentContainerStyle={
              messages.length === 0
                ? styles.emptyContent
                : styles.messagesContent
            }
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <View style={styles.emptyIconWrap}>
                  <Ionicons name="chatbubbles-outline" size={48} color={COLORS.primary} />
                </View>
                <Text style={styles.emptyTitle}>Sem mensagens ainda</Text>
                <Text style={styles.emptyBody}>
                  Envie uma mensagem para a receção
                </Text>
              </View>
            }
          />
        )}

        {/* Respostas rápidas */}
        <View style={styles.quickRepliesWrapper}>
          <FlatList
            data={QUICK_REPLIES}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item}
            contentContainerStyle={styles.quickRepliesRow}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.quickChip}
                onPress={() => handleSend(item)}
                activeOpacity={0.75}
              >
                <Text style={styles.quickChipText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Barra de input */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            placeholder="Escreva uma mensagem..."
            placeholderTextColor={COLORS.textMuted}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            returnKeyType="default"
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              !inputText.trim() && styles.sendButtonDisabled,
            ]}
            onPress={() => handleSend(inputText)}
            disabled={!inputText.trim()}
            activeOpacity={0.8}
          >
            <Ionicons
              name="send"
              size={20}
              color={inputText.trim() ? COLORS.white : COLORS.textMuted}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

// ---------------------------------------------------------------------------
// Estilos
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
  },
  // ---------- Header ----------
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  onlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.online,
  },
  onlineText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '500',
  },
  // ---------- Loading ----------
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  // ---------- Messages ----------
  messagesContent: {
    padding: 12,
    paddingBottom: 8,
    gap: 4,
  },
  emptyContent: {
    flex: 1,
  },
  // ---------- Bubble ----------
  bubbleWrapper: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-end',
  },
  bubbleWrapperGuest: {
    justifyContent: 'flex-end',
  },
  bubbleWrapperReception: {
    justifyContent: 'flex-start',
    gap: 8,
  },
  avatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  bubble: {
    maxWidth: '75%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  bubbleGuest: {
    backgroundColor: COLORS.guestBubble,
    borderBottomRightRadius: 4,
  },
  bubbleReception: {
    backgroundColor: COLORS.receptionBubble,
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 21,
  },
  bubbleTextGuest: {
    color: COLORS.guestBubbleText,
  },
  bubbleTextReception: {
    color: COLORS.receptionBubbleText,
  },
  bubbleTime: {
    fontSize: 11,
    marginTop: 4,
  },
  bubbleTimeGuest: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'right',
  },
  bubbleTimeReception: {
    color: COLORS.textMuted,
  },
  // ---------- Empty State ----------
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 10,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  emptyBody: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  // ---------- Quick Replies ----------
  quickRepliesWrapper: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.white,
    paddingVertical: 8,
  },
  quickRepliesRow: {
    paddingHorizontal: 12,
    gap: 8,
  },
  quickChip: {
    backgroundColor: COLORS.chipBg,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: COLORS.chipBorder,
  },
  quickChipText: {
    color: COLORS.chipText,
    fontSize: 13,
    fontWeight: '600',
  },
  // ---------- Input Bar ----------
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: COLORS.inputBg,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 15,
    color: COLORS.text,
    maxHeight: 100,
    lineHeight: 20,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.sendBtn,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.border,
  },
})
