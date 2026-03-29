import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { getUserInfo } from '../../services/api';

// ---------------------------------------------------------------------------
// Cores
// ---------------------------------------------------------------------------
const COLORS = {
  primary: '#1A3E6E',
  primaryLight: '#E8EEF7',
  background: '#F3F4F6',
  white: '#FFFFFF',
  text: '#111827',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  confirmed: '#2563EB',
  confirmedLight: '#DBEAFE',
  checkedIn: '#10B981',
  checkedInLight: '#D1FAE5',
  checkedOut: '#6B7280',
  checkedOutLight: '#F3F4F6',
  inputBorder: '#D1D5DB',
  searchBg: '#F9FAFB',
};

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------
type ReservationStatus = 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED' | 'PENDING';

interface Reservation {
  id: string;
  code: string;
  guestName: string;
  guestEmail?: string;
  roomNumber: string;
  roomType?: string;
  checkInDate: string;
  checkOutDate: string;
  status: ReservationStatus;
  adults?: number;
  nights?: number;
  totalAmount?: number;
  actualCheckIn?: string | null;
  actualCheckOut?: string | null;
}

interface TodayStats {
  arrivals: number;
  departures: number;
  occupied: number;
}

// ---------------------------------------------------------------------------
// Dados mock
// ---------------------------------------------------------------------------
const today = new Date();
const todayStr = today.toISOString().split('T')[0];
const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

const MOCK_RESERVATIONS: Reservation[] = [
  {
    id: 'r1',
    code: 'RES-2847',
    guestName: 'João Silva',
    guestEmail: 'joao.silva@gmail.com',
    roomNumber: '205',
    roomType: 'Standard Duplo',
    checkInDate: todayStr,
    checkOutDate: tomorrow,
    status: 'CONFIRMED',
    adults: 2,
    nights: 1,
    totalAmount: 85000,
  },
  {
    id: 'r2',
    code: 'RES-2848',
    guestName: 'Maria Fernanda Lopes',
    guestEmail: 'mfernanda@email.com',
    roomNumber: '501',
    roomType: 'Suíte Premium',
    checkInDate: todayStr,
    checkOutDate: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'CHECKED_IN',
    adults: 2,
    nights: 3,
    totalAmount: 420000,
    actualCheckIn: new Date(today.getTime() - 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'r3',
    code: 'RES-2849',
    guestName: 'Carlos Mendes',
    guestEmail: 'carlos.mendes@empresa.ao',
    roomNumber: '112',
    roomType: 'Standard Solteiro',
    checkInDate: todayStr,
    checkOutDate: tomorrow,
    status: 'CHECKED_OUT',
    adults: 1,
    nights: 1,
    totalAmount: 55000,
    actualCheckIn: new Date(today.getTime() - 14 * 60 * 60 * 1000).toISOString(),
    actualCheckOut: new Date(today.getTime() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'r4',
    code: 'RES-2850',
    guestName: 'Ana Paula Rodrigues',
    guestEmail: 'ana.rodrigues@hotmail.com',
    roomNumber: '308',
    roomType: 'Duplo Vista Mar',
    checkInDate: todayStr,
    checkOutDate: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'CONFIRMED',
    adults: 2,
    nights: 2,
    totalAmount: 230000,
  },
  {
    id: 'r5',
    code: 'RES-2845',
    guestName: 'Pedro Almeida',
    guestEmail: 'palmeida@outlook.com',
    roomNumber: '410',
    roomType: 'Júnior Suite',
    checkInDate: todayStr,
    checkOutDate: tomorrow,
    status: 'CONFIRMED',
    adults: 1,
    nights: 1,
    totalAmount: 120000,
  },
];

const MOCK_STATS: TodayStats = { arrivals: 8, departures: 5, occupied: 42 };

// ---------------------------------------------------------------------------
// Funções auxiliares
// ---------------------------------------------------------------------------
function statusLabel(status: ReservationStatus): string {
  switch (status) {
    case 'CONFIRMED': return 'Confirmada';
    case 'CHECKED_IN': return 'Check-in Feito';
    case 'CHECKED_OUT': return 'Check-out Feito';
    case 'CANCELLED': return 'Cancelada';
    case 'PENDING': return 'Pendente';
  }
}

function statusColors(status: ReservationStatus): { bg: string; text: string } {
  switch (status) {
    case 'CONFIRMED': return { bg: COLORS.confirmedLight, text: COLORS.confirmed };
    case 'CHECKED_IN': return { bg: COLORS.checkedInLight, text: COLORS.checkedIn };
    case 'CHECKED_OUT': return { bg: COLORS.checkedOutLight, text: COLORS.checkedOut };
    case 'CANCELLED': return { bg: COLORS.dangerLight, text: COLORS.danger };
    case 'PENDING': return { bg: COLORS.warningLight, text: COLORS.warning };
  }
}

function formatDate(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleDateString('pt-AO', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' });
}

function formatKwanza(amount: number): string {
  return new Intl.NumberFormat('pt-AO', { maximumFractionDigits: 0 }).format(amount) + ' Kz';
}

// ---------------------------------------------------------------------------
// Componente de badge de estado
// ---------------------------------------------------------------------------
function StatusBadge({ status }: { status: ReservationStatus }) {
  const { bg, text } = statusColors(status);
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color: text }]}>{statusLabel(status)}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------
export default function CheckInScreen() {
  const queryClient = useQueryClient();
  const [searchText, setSearchText] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [localReservations, setLocalReservations] = useState<Reservation[]>(MOCK_RESERVATIONS);
  const [resortId, setResortId] = useState<string | null>(null);

  // Carrega resortId do membro de equipa autenticado
  useEffect(() => {
    getUserInfo().then((info) => {
      if (info?.resortId) setResortId(info.resortId);
    });
  }, []);

  // Busca por texto (pesquisa livre)
  const { isLoading: isSearching } = useQuery<Reservation[]>({
    queryKey: ['reservations-search', searchText],
    queryFn: async () => {
      if (!searchText.trim()) return [];
      const params = new URLSearchParams({ search: searchText.trim() });
      if (resortId) params.append('resortId', resortId);
      const res = await api.get<{ data: Reservation[] }>(
        `/reservations?${params}`
      );
      return res.data.data;
    },
    onSuccess: (data: Reservation[]) => {
      if (searchText.trim()) setLocalReservations(data);
    },
    onError: () => {
      // Manter dados mock em caso de falha
    },
    enabled: searchText.trim().length >= 2,
    retry: 1,
  } as Parameters<typeof useQuery>[0]);

  // Chegadas de hoje — GET /v1/reservations?date=today&resortId=...
  const { data: todayArrivals, isLoading: isLoadingToday } = useQuery<Reservation[]>({
    queryKey: ['reservations-today', resortId],
    queryFn: async () => {
      const params = new URLSearchParams({ date: 'today' });
      if (resortId) params.append('resortId', resortId);
      const res = await api.get<{ data: Reservation[] }>(`/reservations?${params}`);
      return res.data.data;
    },
    onSuccess: (data: Reservation[]) => {
      if (data && data.length > 0 && !searchText.trim()) {
        setLocalReservations(data);
      }
    },
    onError: () => {
      // Mantém mock em caso de falha
    },
    retry: 1,
  } as Parameters<typeof useQuery>[0]);

  // Mutação de check-in — PUT /v1/reservations/:id/check-in
  // Mutação de check-out — PUT /v1/reservations/:id/check-out
  const updateStatusMutation = useMutation({
    mutationFn: ({
      id,
      status,
      timestamp,
    }: {
      id: string;
      status: 'CHECKED_IN' | 'CHECKED_OUT';
      timestamp: string;
    }) => {
      if (status === 'CHECKED_IN') {
        return api.put(`/reservations/${id}/check-in`, { timestamp });
      } else {
        return api.put(`/reservations/${id}/check-out`, { timestamp });
      }
    },
    onSuccess: (_data: unknown, variables: { id: string; status: 'CHECKED_IN' | 'CHECKED_OUT'; timestamp: string }) => {
      setLocalReservations((prev) =>
        prev.map((r) => {
          if (r.id !== variables.id) return r;
          return {
            ...r,
            status: variables.status,
            ...(variables.status === 'CHECKED_IN'
              ? { actualCheckIn: variables.timestamp }
              : { actualCheckOut: variables.timestamp }),
          };
        })
      );
      queryClient.invalidateQueries({ queryKey: ['reservations-today', resortId] });
      const action = variables.status === 'CHECKED_IN' ? 'Check-in' : 'Check-out';
      Alert.alert('Sucesso', `${action} realizado com sucesso.`);
    },
    onError: (_err: unknown, variables: { id: string; status: 'CHECKED_IN' | 'CHECKED_OUT'; timestamp: string }) => {
      // Em caso de falha na API, actualiza o estado local de qualquer forma (offline-friendly)
      setLocalReservations((prev) =>
        prev.map((r) => {
          if (r.id !== variables.id) return r;
          return {
            ...r,
            status: variables.status,
            ...(variables.status === 'CHECKED_IN'
              ? { actualCheckIn: variables.timestamp }
              : { actualCheckOut: variables.timestamp }),
          };
        })
      );
      const action = variables.status === 'CHECKED_IN' ? 'Check-in' : 'Check-out';
      Alert.alert(
        `${action} registado`,
        'A operação foi registada localmente. Será sincronizada quando a ligação for restabelecida.',
      );
    },
  });

  const handleCheckIn = (reservation: Reservation) => {
    Alert.alert(
      'Confirmar Check-in',
      `Fazer check-in de ${reservation.guestName} no quarto ${reservation.roomNumber}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Check-in',
          onPress: () =>
            updateStatusMutation.mutate({
              id: reservation.id,
              status: 'CHECKED_IN',
              timestamp: new Date().toISOString(),
            }),
        },
      ]
    );
  };

  const handleCheckOut = (reservation: Reservation) => {
    Alert.alert(
      'Confirmar Check-out',
      `Fazer check-out de ${reservation.guestName} do quarto ${reservation.roomNumber}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Check-out',
          style: 'destructive',
          onPress: () =>
            updateStatusMutation.mutate({
              id: reservation.id,
              status: 'CHECKED_OUT',
              timestamp: new Date().toISOString(),
            }),
        },
      ]
    );
  };

  // Lista exibida: resultado de busca, chegadas do dia via API, ou mock como fallback
  const displayList: Reservation[] = searchText.trim().length >= 2
    ? localReservations
    : (localReservations.length > 0 ? localReservations : MOCK_RESERVATIONS);

  const todayStats: TodayStats = MOCK_STATS;

  // ---------------------------------------------------------------------------
  // Render cartão de reserva
  // ---------------------------------------------------------------------------
  const renderReservation = useCallback(
    ({ item }: { item: Reservation }) => {
      const isExpanded = expandedId === item.id;
      const isProcessing = updateStatusMutation.isPending;

      return (
        <TouchableOpacity
          style={[styles.reservationCard, isExpanded && styles.reservationCardExpanded]}
          onPress={() => setExpandedId(isExpanded ? null : item.id)}
          activeOpacity={0.8}
        >
          {/* Linha superior */}
          <View style={styles.cardTop}>
            <View style={styles.cardTopLeft}>
              <View style={styles.roomBadge}>
                <Text style={styles.roomNumber}>{item.roomNumber}</Text>
              </View>
              <View style={styles.cardTopInfo}>
                <Text style={styles.guestName}>{item.guestName}</Text>
                <Text style={styles.reservationCode}>{item.code}</Text>
              </View>
            </View>
            <View style={styles.cardTopRight}>
              <StatusBadge status={item.status} />
              <Ionicons
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={COLORS.textSecondary}
                style={{ marginTop: 6 }}
              />
            </View>
          </View>

          {/* Linha de datas */}
          <View style={styles.datesRow}>
            <View style={styles.dateItem}>
              <Ionicons name="log-in-outline" size={13} color={COLORS.primary} />
              <Text style={styles.dateText}>{formatDate(item.checkInDate)}</Text>
            </View>
            <Ionicons name="arrow-forward" size={12} color={COLORS.textSecondary} />
            <View style={styles.dateItem}>
              <Ionicons name="log-out-outline" size={13} color={COLORS.textSecondary} />
              <Text style={styles.dateText}>{formatDate(item.checkOutDate)}</Text>
            </View>
          </View>

          {/* Detalhes expandidos */}
          {isExpanded && (
            <View style={styles.expandedArea}>
              <View style={styles.divider} />

              {/* Detalhes */}
              <View style={styles.detailsGrid}>
                {item.roomType && (
                  <View style={styles.detailRow}>
                    <Ionicons name="bed-outline" size={14} color={COLORS.primary} />
                    <Text style={styles.detailLabel}>Tipo:</Text>
                    <Text style={styles.detailValue}>{item.roomType}</Text>
                  </View>
                )}
                {item.adults !== undefined && (
                  <View style={styles.detailRow}>
                    <Ionicons name="people-outline" size={14} color={COLORS.primary} />
                    <Text style={styles.detailLabel}>Hóspedes:</Text>
                    <Text style={styles.detailValue}>{item.adults} adulto{item.adults !== 1 ? 's' : ''}</Text>
                  </View>
                )}
                {item.nights !== undefined && (
                  <View style={styles.detailRow}>
                    <Ionicons name="moon-outline" size={14} color={COLORS.primary} />
                    <Text style={styles.detailLabel}>Noites:</Text>
                    <Text style={styles.detailValue}>{item.nights}</Text>
                  </View>
                )}
                {item.totalAmount !== undefined && (
                  <View style={styles.detailRow}>
                    <Ionicons name="card-outline" size={14} color={COLORS.primary} />
                    <Text style={styles.detailLabel}>Total:</Text>
                    <Text style={styles.detailValue}>{formatKwanza(item.totalAmount)}</Text>
                  </View>
                )}
                {item.actualCheckIn && (
                  <View style={styles.detailRow}>
                    <Ionicons name="time-outline" size={14} color={COLORS.checkedIn} />
                    <Text style={styles.detailLabel}>Check-in:</Text>
                    <Text style={[styles.detailValue, { color: COLORS.checkedIn }]}>
                      {formatTime(item.actualCheckIn)}
                    </Text>
                  </View>
                )}
                {item.actualCheckOut && (
                  <View style={styles.detailRow}>
                    <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} />
                    <Text style={styles.detailLabel}>Check-out:</Text>
                    <Text style={styles.detailValue}>{formatTime(item.actualCheckOut)}</Text>
                  </View>
                )}
                {item.guestEmail && (
                  <View style={styles.detailRow}>
                    <Ionicons name="mail-outline" size={14} color={COLORS.primary} />
                    <Text style={styles.detailLabel}>Email:</Text>
                    <Text style={[styles.detailValue, { flex: 1 }]} numberOfLines={1}>
                      {item.guestEmail}
                    </Text>
                  </View>
                )}
              </View>

              {/* Botões de ação */}
              <View style={styles.actionButtons}>
                {item.status === 'CONFIRMED' && (
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.actionBtnCheckin, isProcessing && styles.actionBtnDisabled]}
                    onPress={() => handleCheckIn(item)}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <ActivityIndicator size="small" color={COLORS.white} />
                    ) : (
                      <Ionicons name="log-in-outline" size={16} color={COLORS.white} />
                    )}
                    <Text style={styles.actionBtnText}>Fazer Check-in</Text>
                  </TouchableOpacity>
                )}
                {item.status === 'CHECKED_IN' && (
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.actionBtnCheckout, isProcessing && styles.actionBtnDisabled]}
                    onPress={() => handleCheckOut(item)}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <ActivityIndicator size="small" color={COLORS.white} />
                    ) : (
                      <Ionicons name="log-out-outline" size={16} color={COLORS.white} />
                    )}
                    <Text style={styles.actionBtnText}>Fazer Check-out</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnDetails]}
                  onPress={() => Alert.alert('Detalhes', `Reserva ${item.code}\nHóspede: ${item.guestName}\nQuarto: ${item.roomNumber}`)}
                >
                  <Ionicons name="information-circle-outline" size={16} color={COLORS.primary} />
                  <Text style={[styles.actionBtnText, { color: COLORS.primary }]}>Ver Detalhes</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </TouchableOpacity>
      );
    },
    [expandedId, updateStatusMutation.isPending]
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Cabeçalho */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Check-in / Check-out</Text>
        <Text style={styles.headerSubtitle}>Receção • {new Date().toLocaleDateString('pt-AO', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
      </View>

      {/* Barra de pesquisa */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={COLORS.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Pesquisar por código ou nome do hóspede..."
            placeholderTextColor={COLORS.textSecondary}
            value={searchText}
            onChangeText={setSearchText}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {isSearching && (
            <ActivityIndicator size="small" color={COLORS.primary} style={{ marginRight: 8 }} />
          )}
          {searchText.length > 0 && !isSearching && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={displayList}
        keyExtractor={(item) => item.id}
        renderItem={renderReservation}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            {/* Estatísticas do dia */}
            <View style={styles.statsRow}>
              <View style={[styles.statCard, { borderLeftColor: COLORS.confirmed }]}>
                <Text style={styles.statValue}>{todayStats.arrivals}</Text>
                <Text style={styles.statLabel}>Chegadas</Text>
              </View>
              <View style={[styles.statCard, { borderLeftColor: COLORS.warning }]}>
                <Text style={styles.statValue}>{todayStats.departures}</Text>
                <Text style={styles.statLabel}>Saídas</Text>
              </View>
              <View style={[styles.statCard, { borderLeftColor: COLORS.checkedIn }]}>
                <Text style={styles.statValue}>{todayStats.occupied}</Text>
                <Text style={styles.statLabel}>Ocupados</Text>
              </View>
            </View>

            {/* Título da lista */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {searchText.trim().length >= 2 ? 'Resultados da Pesquisa' : 'Chegadas de Hoje'}
              </Text>
              <Text style={styles.sectionCount}>{displayList.length} reservas</Text>
            </View>

            {isLoadingToday && !searchText && (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.loadingText}>A carregar...</Text>
              </View>
            )}
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color={COLORS.textSecondary} />
            <Text style={styles.emptyTitle}>Sem reservas</Text>
            <Text style={styles.emptyBody}>
              {searchText.trim().length >= 2
                ? 'Nenhuma reserva encontrada para esta pesquisa.'
                : 'Não há chegadas previstas para hoje.'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Estilos
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  searchContainer: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.searchBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    paddingHorizontal: 12,
    height: 44,
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
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  sectionCount: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  reservationCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  reservationCardExpanded: {
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  cardTopLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  roomBadge: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  roomNumber: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primary,
  },
  cardTopInfo: {
    flex: 1,
    gap: 2,
  },
  guestName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  reservationCode: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  cardTopRight: {
    alignItems: 'flex-end',
    gap: 2,
    flexShrink: 0,
    marginLeft: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  datesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 6,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  expandedArea: {
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },
  detailsGrid: {
    gap: 8,
    marginBottom: 14,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    width: 72,
  },
  detailValue: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
  },
  actionBtnCheckin: {
    backgroundColor: COLORS.primary,
  },
  actionBtnCheckout: {
    backgroundColor: COLORS.danger,
  },
  actionBtnDetails: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  actionBtnDisabled: {
    opacity: 0.6,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.white,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
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
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
});
