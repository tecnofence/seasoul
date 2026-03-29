import React, { useState, useCallback, useMemo } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
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
  accent: '#10B981',
  accentLight: '#D1FAE5',
  white: '#FFFFFF',
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  border: '#CBD5E1',
  card: '#FFFFFF',
  aquatic: '#0369A1',
  aquaticLight: '#DBEAFE',
  terrestrial: '#059669',
  terrestrialLight: '#D1FAE5',
  cultural: '#7C3AED',
  culturalLight: '#EDE9FE',
  gastro: '#D97706',
  gastroLight: '#FEF3C7',
  included: '#10B981',
}

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------
type ActivityCategory = 'Todos' | 'Aquáticos' | 'Terrestres' | 'Cultural' | 'Gastronómico'

interface Activity {
  id: string
  name: string
  duration: string
  price: number | null // null = Incluído
  category: ActivityCategory
  difficulty?: string
  description?: string
  icon: keyof typeof Ionicons.glyphMap
  color: string
  bgColor: string
}

interface BookedActivity {
  id: string
  activityId: string
  activityName: string
  date: string
  status: 'CONFIRMED' | 'PENDING' | 'CANCELLED'
}

// ---------------------------------------------------------------------------
// Dados mock
// ---------------------------------------------------------------------------
const MOCK_ACTIVITIES: Activity[] = [
  {
    id: 'a1',
    name: 'Aula de Surf',
    duration: '2h',
    price: 5000,
    category: 'Aquáticos',
    difficulty: 'Iniciante',
    description: 'Aprenda a surfar nas ondas de Cabo Ledo com instrutores certificados.',
    icon: 'water',
    color: COLORS.aquatic,
    bgColor: COLORS.aquaticLight,
  },
  {
    id: 'a2',
    name: 'Voleibol de Praia',
    duration: '1h',
    price: null,
    category: 'Terrestres',
    difficulty: 'Todos os níveis',
    description: 'Jogo informal de voleibol na praia. Material incluído.',
    icon: 'basketball',
    color: COLORS.terrestrial,
    bgColor: COLORS.terrestrialLight,
  },
  {
    id: 'a3',
    name: 'Prova de Vinhos',
    duration: '1h 30m',
    price: 3500,
    category: 'Gastronómico',
    difficulty: 'Todos os níveis',
    description: 'Degustação de vinhos angolanos e portugueses com sommelier.',
    icon: 'wine',
    color: COLORS.gastro,
    bgColor: COLORS.gastroLight,
  },
  {
    id: 'a4',
    name: 'Passeio Cultural',
    duration: '3h',
    price: 8000,
    category: 'Cultural',
    difficulty: 'Moderado',
    description: 'Visita guiada às aldeias tradicionais e pontos históricos de Cabo Ledo.',
    icon: 'map',
    color: COLORS.cultural,
    bgColor: COLORS.culturalLight,
  },
  {
    id: 'a5',
    name: 'Kayak',
    duration: '2h',
    price: 4000,
    category: 'Aquáticos',
    difficulty: 'Intermédio',
    description: 'Passeio de kayak ao longo da costa com guia experiente.',
    icon: 'boat',
    color: COLORS.aquatic,
    bgColor: COLORS.aquaticLight,
  },
  {
    id: 'a6',
    name: 'Yoga na Praia',
    duration: '1h',
    price: null,
    category: 'Terrestres',
    difficulty: 'Todos os níveis',
    description: 'Sessão matinal de yoga com vista para o oceano. Tapetes fornecidos.',
    icon: 'body',
    color: COLORS.terrestrial,
    bgColor: COLORS.terrestrialLight,
  },
]

const MOCK_BOOKED: BookedActivity[] = [
  {
    id: 'b1',
    activityId: 'a6',
    activityName: 'Yoga na Praia',
    date: '2026-03-30T07:00:00',
    status: 'CONFIRMED',
  },
]

const CATEGORIES: ActivityCategory[] = [
  'Todos',
  'Aquáticos',
  'Terrestres',
  'Cultural',
  'Gastronómico',
]

// ---------------------------------------------------------------------------
// Utilitários
// ---------------------------------------------------------------------------
function formatPrice(price: number | null): string {
  if (price === null) return 'Incluído'
  const parts = price.toString().split('')
  const result: string[] = []
  parts.reverse().forEach((d, i) => {
    if (i > 0 && i % 3 === 0) result.push('.')
    result.push(d)
  })
  return result.reverse().join('') + ' AOA'
}

function formatBookingDate(isoDate: string): string {
  const d = new Date(isoDate)
  return d.toLocaleDateString('pt-AO', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function bookingStatusLabel(status: BookedActivity['status']): string {
  switch (status) {
    case 'CONFIRMED': return 'Confirmada'
    case 'PENDING': return 'Pendente'
    case 'CANCELLED': return 'Cancelada'
  }
}

function bookingStatusColors(status: BookedActivity['status']): { bg: string; text: string } {
  switch (status) {
    case 'CONFIRMED': return { bg: COLORS.accentLight, text: COLORS.accent }
    case 'PENDING': return { bg: '#FEF3C7', text: '#D97706' }
    case 'CANCELLED': return { bg: '#FEE2E2', text: '#EF4444' }
  }
}

// ---------------------------------------------------------------------------
// Sub-componentes
// ---------------------------------------------------------------------------
function ActivityCard({
  activity,
  onBook,
  isBooking,
}: {
  activity: Activity
  onBook: (a: Activity) => void
  isBooking: boolean
}) {
  const isFree = activity.price === null

  return (
    <View style={styles.activityCard}>
      {/* Ícone e cor de categoria */}
      <View style={[styles.activityIconWrap, { backgroundColor: activity.bgColor }]}>
        <Ionicons name={activity.icon} size={28} color={activity.color} />
      </View>

      {/* Conteúdo */}
      <View style={styles.activityContent}>
        <View style={styles.activityTopRow}>
          <Text style={styles.activityName}>{activity.name}</Text>
          <Text
            style={[
              styles.activityPrice,
              isFree ? styles.activityPriceFree : null,
            ]}
          >
            {formatPrice(activity.price)}
          </Text>
        </View>

        <View style={styles.activityMeta}>
          <View style={styles.metaChip}>
            <Ionicons name="time-outline" size={12} color={COLORS.textMuted} />
            <Text style={styles.metaChipText}>{activity.duration}</Text>
          </View>
          {activity.difficulty && (
            <View style={styles.metaChip}>
              <Ionicons name="trending-up-outline" size={12} color={COLORS.textMuted} />
              <Text style={styles.metaChipText}>{activity.difficulty}</Text>
            </View>
          )}
        </View>

        {activity.description && (
          <Text style={styles.activityDescription} numberOfLines={2}>
            {activity.description}
          </Text>
        )}

        <TouchableOpacity
          style={[styles.bookBtn, isFree ? styles.bookBtnFree : styles.bookBtnPaid]}
          onPress={() => onBook(activity)}
          activeOpacity={0.8}
          disabled={isBooking}
        >
          {isBooking ? (
            <ActivityIndicator size="small" color={isFree ? COLORS.accent : COLORS.white} />
          ) : (
            <Text style={[styles.bookBtnText, isFree ? styles.bookBtnTextFree : null]}>
              {isFree ? 'Aderir gratuitamente' : 'Reservar atividade'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  )
}

function BookedCard({ booking }: { booking: BookedActivity }) {
  const { bg, text } = bookingStatusColors(booking.status)
  return (
    <View style={styles.bookedCard}>
      <View style={styles.bookedIconWrap}>
        <Ionicons name="calendar-check" size={22} color={COLORS.primary} />
      </View>
      <View style={styles.bookedInfo}>
        <Text style={styles.bookedName}>{booking.activityName}</Text>
        <Text style={styles.bookedDate}>{formatBookingDate(booking.date)}</Text>
      </View>
      <View style={[styles.bookedBadge, { backgroundColor: bg }]}>
        <Text style={[styles.bookedBadgeText, { color: text }]}>
          {bookingStatusLabel(booking.status)}
        </Text>
      </View>
    </View>
  )
}

// ---------------------------------------------------------------------------
// Ecrã principal
// ---------------------------------------------------------------------------
export default function ActivitiesScreen() {
  const queryClient = useQueryClient()
  const [searchText, setSearchText] = useState('')
  const [activeCategory, setActiveCategory] = useState<ActivityCategory>('Todos')
  const [resortId, setResortId] = useState<string | null>(null)
  const [useMock, setUseMock] = useState(false)
  const [bookingActivityId, setBookingActivityId] = useState<string | null>(null)

  // Carrega resortId do utilizador
  React.useEffect(() => {
    getUserInfo().then((info) => {
      if (info?.resortId) setResortId(info.resortId)
    })
  }, [])

  // Busca atividades da API
  const { data: apiActivities, isLoading } = useQuery<Activity[]>({
    queryKey: ['activities', resortId],
    queryFn: async () => {
      const params = new URLSearchParams({ available: 'true' })
      if (resortId) params.append('resortId', resortId)
      const res = await api.get<{ data: Activity[] }>(`/activities?${params}`)
      return res.data.data
    },
    retry: 1,
    onError: () => {
      setUseMock(true)
    },
  } as Parameters<typeof useQuery>[0])

  // Busca reservas do hóspede
  const { data: apiBookings } = useQuery<BookedActivity[]>({
    queryKey: ['activity-bookings'],
    queryFn: async () => {
      const res = await api.get<{ data: BookedActivity[] }>('/activities/bookings/mine')
      return res.data.data
    },
    retry: 1,
    onError: () => {},
  } as Parameters<typeof useQuery>[0])

  const activities: Activity[] = useMock ? MOCK_ACTIVITIES : (apiActivities ?? MOCK_ACTIVITIES)
  const bookings: BookedActivity[] = apiBookings ?? MOCK_BOOKED

  // Mutação de reserva
  const bookMutation = useMutation({
    mutationFn: async (activityId: string) => {
      const res = await api.post(`/activities/${activityId}/bookings`, {})
      return res.data
    },
    onSuccess: (_data, activityId) => {
      setBookingActivityId(null)
      queryClient.invalidateQueries({ queryKey: ['activity-bookings'] })
      Alert.alert(
        'Reserva confirmada!',
        'A sua atividade foi reservada com sucesso. Pode consultar os detalhes na secção "As minhas reservas".',
      )
    },
    onError: (_err, activityId) => {
      setBookingActivityId(null)
      Alert.alert('Erro', 'Não foi possível concluir a reserva. Tente novamente.')
    },
  })

  const handleBook = useCallback(
    (activity: Activity) => {
      Alert.alert(
        'Confirmar reserva',
        `Pretende reservar "${activity.name}"?\n\nDuração: ${activity.duration}\nPreço: ${formatPrice(activity.price)}`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Confirmar',
            onPress: () => {
              setBookingActivityId(activity.id)
              if (!useMock) {
                bookMutation.mutate(activity.id)
              } else {
                // Modo mock: simula sucesso
                setTimeout(() => {
                  setBookingActivityId(null)
                  Alert.alert(
                    'Reserva enviada!',
                    'O seu pedido foi registado. Um membro da equipa irá confirmar em breve.',
                  )
                }, 800)
              }
            },
          },
        ],
      )
    },
    [useMock, bookMutation],
  )

  // Filtragem
  const filtered = useMemo(() => {
    return activities.filter((a) => {
      const matchesCategory = activeCategory === 'Todos' || a.category === activeCategory
      const matchesSearch =
        !searchText.trim() ||
        a.name.toLowerCase().includes(searchText.toLowerCase()) ||
        a.description?.toLowerCase().includes(searchText.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [activities, activeCategory, searchText])

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Atividades</Text>
        <Text style={styles.headerSub}>Sea and Soul — Cabo Ledo</Text>
      </View>

      {/* Barra de pesquisa */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={COLORS.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Pesquisar atividades..."
            placeholderTextColor={COLORS.textMuted}
            value={searchText}
            onChangeText={setSearchText}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filtros de categoria */}
      <View style={styles.filtersWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.filterTab, activeCategory === cat && styles.filterTabActive]}
              onPress={() => setActiveCategory(cat)}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.filterTabText,
                  activeCategory === cat && styles.filterTabTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Lista de atividades */}
        {isLoading && !useMock ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>A carregar atividades...</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>Sem resultados</Text>
            <Text style={styles.emptyBody}>Tente outra categoria ou pesquisa.</Text>
          </View>
        ) : (
          <View style={styles.activitiesList}>
            {filtered.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                onBook={handleBook}
                isBooking={bookingActivityId === activity.id}
              />
            ))}
          </View>
        )}

        {/* Secção: As minhas reservas */}
        <View style={styles.sectionHeader}>
          <Ionicons name="calendar-outline" size={18} color={COLORS.primary} style={{ marginRight: 6 }} />
          <Text style={styles.sectionTitle}>As minhas reservas</Text>
          <View style={styles.sectionBadge}>
            <Text style={styles.sectionBadgeText}>{bookings.length}</Text>
          </View>
        </View>

        {bookings.length === 0 ? (
          <View style={styles.noBookings}>
            <Text style={styles.noBookingsText}>
              Ainda não reservou nenhuma atividade.
            </Text>
          </View>
        ) : (
          <View style={styles.bookedList}>
            {bookings.map((b) => (
              <BookedCard key={b.id} booking={b} />
            ))}
          </View>
        )}

        {/* Nota de rodapé */}
        <View style={styles.footerNote}>
          <Ionicons
            name="information-circle-outline"
            size={16}
            color={COLORS.textMuted}
            style={{ marginRight: 6 }}
          />
          <Text style={styles.footerNoteText}>
            As reservas estão sujeitas a disponibilidade. Para mais informações, contacte a receção.
          </Text>
        </View>
      </ScrollView>
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
  // ---------- Header ----------
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '800',
  },
  headerSub: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    marginTop: 2,
  },
  // ---------- Search ----------
  searchWrapper: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    height: 42,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    paddingVertical: 0,
  },
  // ---------- Filters ----------
  filtersWrapper: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filtersRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  filterTabTextActive: {
    color: COLORS.white,
  },
  // ---------- Scroll ----------
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  // ---------- Loading ----------
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  // ---------- Empty ----------
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  emptyBody: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  // ---------- Activities List ----------
  activitiesList: {
    gap: 12,
    marginBottom: 24,
  },
  // ---------- Activity Card ----------
  activityCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  activityIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  activityContent: {
    flex: 1,
    gap: 6,
  },
  activityTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  activityName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  activityPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
    flexShrink: 0,
  },
  activityPriceFree: {
    color: COLORS.included,
  },
  activityMeta: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.background,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  metaChipText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  activityDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  // ---------- Book Button ----------
  bookBtn: {
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  bookBtnPaid: {
    backgroundColor: COLORS.primary,
  },
  bookBtnFree: {
    backgroundColor: COLORS.accentLight,
    borderWidth: 1,
    borderColor: COLORS.accent + '60',
  },
  bookBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.white,
  },
  bookBtnTextFree: {
    color: COLORS.accent,
  },
  // ---------- Section Header ----------
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
    flex: 1,
  },
  sectionBadge: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  sectionBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  // ---------- No Bookings ----------
  noBookings: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  noBookingsText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  // ---------- Booked List ----------
  bookedList: {
    gap: 10,
    marginBottom: 16,
  },
  // ---------- Booked Card ----------
  bookedCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  bookedIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  bookedInfo: {
    flex: 1,
  },
  bookedName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  bookedDate: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  bookedBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    flexShrink: 0,
  },
  bookedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  // ---------- Footer Note ----------
  footerNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  footerNoteText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
})
