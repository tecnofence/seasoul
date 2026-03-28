import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

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
  unreadDot: '#2563EB',
  checkin: '#1A3E6E',
  maintenance: '#EF4444',
  payment: '#10B981',
  system: '#6B7280',
};

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------
type NotificationType = 'CHECKIN' | 'MAINTENANCE' | 'PAYMENT' | 'SYSTEM';
type FilterTab = 'Todos' | 'Não Lidos' | 'Sistema' | 'Hóspedes';

interface Notification {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Dados mock
// ---------------------------------------------------------------------------
const now = new Date();
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    title: 'Check-in: João Silva',
    body: 'Quarto 205 — Chegada prevista 14h',
    type: 'CHECKIN',
    read: false,
    createdAt: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    title: 'Manutenção Urgente',
    body: 'Quarto 301: Ar condicionado avariado. Técnico solicitado.',
    type: 'MAINTENANCE',
    read: false,
    createdAt: new Date(now.getTime() - 32 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    title: 'Pagamento Recebido',
    body: 'Venda POS #2847 — 45.000 Kz',
    type: 'PAYMENT',
    read: true,
    createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    title: 'Check-in: Maria Fernanda',
    body: 'Suíte 501 — Check-in realizado com sucesso',
    type: 'CHECKIN',
    read: false,
    createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '5',
    title: 'Atualização do Sistema',
    body: 'Versão 2.4.1 instalada com sucesso. Módulo PMS otimizado.',
    type: 'SYSTEM',
    read: true,
    createdAt: new Date(now.getTime() - 26 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '6',
    title: 'Pagamento Recebido',
    body: 'Reserva #RES-1204 — Pagamento parcial de 120.000 Kz recebido',
    type: 'PAYMENT',
    read: true,
    createdAt: new Date(now.getTime() - 50 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '7',
    title: 'Check-out: Pedro Almeida',
    body: 'Quarto 112 — Check-out realizado às 11h45',
    type: 'CHECKIN',
    read: true,
    createdAt: new Date(now.getTime() - 72 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '8',
    title: 'Alerta de Manutenção',
    body: 'Piscina principal: bomba de filtragem a necessitar revisão',
    type: 'MAINTENANCE',
    read: false,
    createdAt: new Date(now.getTime() - 90 * 60 * 60 * 1000).toISOString(),
  },
];

// ---------------------------------------------------------------------------
// Funções auxiliares
// ---------------------------------------------------------------------------
function timeAgo(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'agora';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay}d`;
}

function typeColor(type: NotificationType): string {
  switch (type) {
    case 'CHECKIN': return COLORS.checkin;
    case 'MAINTENANCE': return COLORS.maintenance;
    case 'PAYMENT': return COLORS.payment;
    case 'SYSTEM': return COLORS.system;
  }
}

function typeIcon(type: NotificationType): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case 'CHECKIN': return 'bed-outline';
    case 'MAINTENANCE': return 'construct-outline';
    case 'PAYMENT': return 'card-outline';
    case 'SYSTEM': return 'settings-outline';
  }
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------
export default function StaffNotificationsScreen() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<FilterTab>('Todos');
  const [localNotifications, setLocalNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);

  // Fetch notificações da API
  const { isLoading } = useQuery<Notification[]>({
    queryKey: ['staff-notifications'],
    queryFn: async () => {
      const res = await api.get<{ data: Notification[] }>('/notifications?limit=50');
      return res.data.data;
    },
    onSuccess: (data: Notification[]) => {
      setLocalNotifications(data);
    },
    onError: () => {
      // Usa dados mock em caso de erro
      setLocalNotifications(MOCK_NOTIFICATIONS);
    },
    retry: 1,
  } as Parameters<typeof useQuery>[0]);

  // Marcar como lida
  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onMutate: async (id: string) => {
      setLocalNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    },
    onError: (_err: unknown, id: string) => {
      // Reverter em caso de erro — mantém lida localmente para melhor UX
      queryClient.invalidateQueries({ queryKey: ['staff-notifications'] });
    },
  });

  // Marcar todas como lidas
  const markAllRead = () => {
    Alert.alert(
      'Marcar todas como lidas',
      'Confirma que pretende marcar todas as notificações como lidas?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            const unread = localNotifications.filter((n) => !n.read);
            for (const n of unread) {
              try {
                await api.patch(`/notifications/${n.id}/read`);
              } catch {
                // ignorar erros individuais
              }
            }
            setLocalNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
          },
        },
      ]
    );
  };

  // Filtrar notificações
  const filtered = useMemo(() => {
    switch (activeTab) {
      case 'Não Lidos':
        return localNotifications.filter((n) => !n.read);
      case 'Sistema':
        return localNotifications.filter((n) => n.type === 'SYSTEM');
      case 'Hóspedes':
        return localNotifications.filter((n) => n.type === 'CHECKIN');
      default:
        return localNotifications;
    }
  }, [activeTab, localNotifications]);

  const unreadCount = localNotifications.filter((n) => !n.read).length;

  const tabs: FilterTab[] = ['Todos', 'Não Lidos', 'Sistema', 'Hóspedes'];

  // ---------------------------------------------------------------------------
  // Render notificação
  // ---------------------------------------------------------------------------
  const renderItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.card, !item.read && styles.cardUnread]}
      onPress={() => {
        if (!item.read) markReadMutation.mutate(item.id);
      }}
      activeOpacity={0.75}
    >
      <View style={[styles.iconCircle, { backgroundColor: typeColor(item.type) + '1A' }]}>
        <Ionicons name={typeIcon(item.type)} size={20} color={typeColor(item.type)} />
      </View>
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.cardTime}>{timeAgo(item.createdAt)}</Text>
        </View>
        <Text style={styles.cardBody} numberOfLines={2}>{item.body}</Text>
      </View>
      {!item.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Cabeçalho */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Alertas</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead} style={styles.markAllBtn}>
            <Text style={styles.markAllText}>Marcar todos como lidos</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs de filtro */}
      <View style={styles.tabsRow}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Lista */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="notifications-off-outline" size={56} color={COLORS.textSecondary} />
          <Text style={styles.emptyTitle}>Sem notificações</Text>
          <Text style={styles.emptyBody}>Não existem alertas nesta categoria.</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
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
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '700',
  },
  badge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
  },
  markAllBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8,
  },
  markAllText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: 12,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginRight: 2,
  },
  tabActive: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  list: {
    padding: 16,
    paddingBottom: 32,
  },
  separator: {
    height: 10,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  cardUnread: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.unreadDot,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  cardContent: {
    flex: 1,
    gap: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  cardTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
    flexShrink: 0,
  },
  cardBody: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: COLORS.unreadDot,
    position: 'absolute',
    top: 12,
    right: 12,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 8,
  },
  emptyBody: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  white: {
    color: COLORS.white,
  },
  textSecondary: {
    color: COLORS.textSecondary,
  },
});
