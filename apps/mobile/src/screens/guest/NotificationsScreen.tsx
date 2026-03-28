import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ---------------------------------------------------------------------------
// Cores (tema oceano — hóspede)
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
  border: '#BAE6FD',
  card: '#FFFFFF',
  reservation: '#0A7EA4',
  reservationLight: '#E0F4FB',
  promotion: '#7C3AED',
  promotionLight: '#EDE9FE',
  service: '#10B981',
  serviceLight: '#D1FAE5',
  reminder: '#F59E0B',
  reminderLight: '#FEF3C7',
};

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------
type GuestNotificationType = 'RESERVATION' | 'PROMOTION' | 'SERVICE' | 'REMINDER';

interface GuestNotification {
  id: string;
  type: GuestNotificationType;
  title: string;
  body: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Dados mock
// ---------------------------------------------------------------------------
const now = new Date();

const MOCK_GUEST_NOTIFICATIONS: GuestNotification[] = [
  {
    id: '1',
    type: 'RESERVATION',
    title: 'Confirmação de Reserva',
    body: 'A sua reserva #RES-2847 está confirmada para 15 Março 2026. Quarto 205, 2 noites.',
    createdAt: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    type: 'PROMOTION',
    title: 'Oferta Especial Spa',
    body: '20% de desconto em todos os tratamentos esta semana. Reserve já e aproveite!',
    createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    type: 'REMINDER',
    title: 'Lembrete de Check-out',
    body: 'O seu check-out é amanhã às 12h00. Precisa de prolongar a estadia?',
    createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    type: 'SERVICE',
    title: 'Happy Hour no Bar',
    body: 'Cocktails com desconto das 18h às 20h no Bar Vista Mar. Venha relaxar!',
    createdAt: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '5',
    type: 'SERVICE',
    title: 'Serviço de Quarto Disponível',
    body: 'O nosso serviço de quarto está disponível 24h. Consulte o menu no ecrã principal.',
    createdAt: new Date(now.getTime() - 22 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '6',
    type: 'PROMOTION',
    title: 'Experiência Mergulho Livre',
    body: 'Hóspedes desta semana têm acesso gratuito a 1 sessão de snorkeling guiado.',
    createdAt: new Date(now.getTime() - 30 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '7',
    type: 'RESERVATION',
    title: 'Pré-Check-in Disponível',
    body: 'Já pode fazer o seu pré-check-in online. Poupe tempo na chegada ao resort.',
    createdAt: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString(),
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
  if (diffMin < 60) return `${diffMin}m atrás`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h atrás`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay}d atrás`;
}

function typeColors(type: GuestNotificationType): { icon: string; bg: string } {
  switch (type) {
    case 'RESERVATION': return { icon: COLORS.reservation, bg: COLORS.reservationLight };
    case 'PROMOTION': return { icon: COLORS.promotion, bg: COLORS.promotionLight };
    case 'SERVICE': return { icon: COLORS.service, bg: COLORS.serviceLight };
    case 'REMINDER': return { icon: COLORS.reminder, bg: COLORS.reminderLight };
  }
}

function typeIcon(type: GuestNotificationType): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case 'RESERVATION': return 'bed-outline';
    case 'PROMOTION': return 'pricetag-outline';
    case 'SERVICE': return 'headset-outline';
    case 'REMINDER': return 'notifications-outline';
  }
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------
export default function GuestNotificationsScreen() {
  const [notifications, setNotifications] = useState<GuestNotification[]>(MOCK_GUEST_NOTIFICATIONS);

  const clearAll = () => {
    Alert.alert(
      'Limpar notificações',
      'Tem a certeza que pretende remover todas as notificações?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar tudo',
          style: 'destructive',
          onPress: () => setNotifications([]),
        },
      ]
    );
  };

  // ---------------------------------------------------------------------------
  // Render item
  // ---------------------------------------------------------------------------
  const renderItem = ({ item }: { item: GuestNotification }) => {
    const { icon: iconColor, bg: bgColor } = typeColors(item.type);
    return (
      <View style={styles.card}>
        <View style={[styles.iconCircle, { backgroundColor: bgColor }]}>
          <Ionicons name={typeIcon(item.type)} size={22} color={iconColor} />
        </View>
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.cardTime}>{timeAgo(item.createdAt)}</Text>
          </View>
          <Text style={styles.cardBody}>{item.body}</Text>
        </View>
      </View>
    );
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />

      {/* Cabeçalho */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Notificações</Text>
          <Text style={styles.headerSubtitle}>{notifications.length} mensagens do resort</Text>
        </View>
        {notifications.length > 0 && (
          <TouchableOpacity onPress={clearAll} style={styles.clearBtn}>
            <Ionicons name="trash-outline" size={15} color={COLORS.white} />
            <Text style={styles.clearBtnText}>Limpar tudo</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Decoração de ondas */}
      <View style={styles.waveDeco}>
        <View style={styles.waveBar} />
      </View>

      {/* Lista */}
      {notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconWrapper}>
            <Ionicons name="notifications-off-outline" size={52} color={COLORS.primary} />
          </View>
          <Text style={styles.emptyTitle}>Sem notificações</Text>
          <Text style={styles.emptyBody}>
            Quando o resort enviar comunicações, elas aparecerão aqui.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
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
    paddingBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    marginTop: 2,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  clearBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  waveDeco: {
    backgroundColor: COLORS.primary,
    height: 14,
    overflow: 'hidden',
  },
  waveBar: {
    height: 28,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  list: {
    padding: 16,
    paddingBottom: 36,
  },
  separator: {
    height: 10,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#0A7EA4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  cardContent: {
    flex: 1,
    gap: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 6,
  },
  cardTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    lineHeight: 20,
  },
  cardTime: {
    fontSize: 11,
    color: COLORS.textMuted,
    flexShrink: 0,
    marginTop: 2,
  },
  cardBody: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 10,
    marginTop: -40,
  },
  emptyIconWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  emptyBody: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
  },
});
