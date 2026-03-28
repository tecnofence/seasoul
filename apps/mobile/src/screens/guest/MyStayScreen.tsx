import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  success: '#10B981',
  successLight: '#D1FAE5',
  pending: '#F59E0B',
  pendingLight: '#FEF3C7',
  active: '#0A7EA4',
  activeLight: '#E0F4FB',
};

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------
interface StatusCardProps {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bgColor: string;
}

interface QuickActionProps {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

interface RecentRequestProps {
  item: string;
  status: 'Entregue' | 'Pendente' | 'Ativo';
}

// ---------------------------------------------------------------------------
// Dados mock
// ---------------------------------------------------------------------------
const STAY_INFO = {
  room: 'Quarto 201',
  checkIn: '28 Mar',
  checkOut: '02 Abr 2026',
  guestName: 'João Silva',
};

const STATUS_CARDS: StatusCardProps[] = [
  { label: 'Noites', value: '5', icon: 'moon', color: COLORS.primary, bgColor: COLORS.primaryLight },
  { label: 'Hóspedes', value: '2', icon: 'people', color: COLORS.accent, bgColor: COLORS.accentLight },
  { label: 'Saldo', value: '125.000 KZ', icon: 'wallet', color: '#7C3AED', bgColor: '#EDE9FE' },
];

const QUICK_ACTIONS: QuickActionProps[] = [
  { label: 'Pequeno-almoço', icon: 'cafe', color: '#D97706' },
  { label: 'Wi-Fi', icon: 'wifi', color: COLORS.primary },
  { label: 'Piscina', icon: 'water', color: '#0369A1' },
  { label: 'Spa', icon: 'heart', color: '#DB2777' },
];

const SCHEDULES = [
  { label: 'Check-out', time: '12:00', icon: 'exit' as keyof typeof Ionicons.glyphMap },
  { label: 'Almoço', time: '12:00 – 15:00', icon: 'restaurant' as keyof typeof Ionicons.glyphMap },
  { label: 'Jantar', time: '19:00 – 22:00', icon: 'moon' as keyof typeof Ionicons.glyphMap },
];

const RECENT_REQUESTS: RecentRequestProps[] = [
  { item: 'Toalhas extra', status: 'Entregue' },
  { item: 'Minibar reabastecido', status: 'Pendente' },
  { item: 'Despertar 07:00', status: 'Ativo' },
];

// ---------------------------------------------------------------------------
// Sub-componentes
// ---------------------------------------------------------------------------
function StatusCard({ label, value, icon, color, bgColor }: StatusCardProps) {
  return (
    <View style={[styles.statusCard, { backgroundColor: bgColor }]}>
      <View style={[styles.statusIconCircle, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.statusValue, { color }]}>{value}</Text>
      <Text style={styles.statusLabel}>{label}</Text>
    </View>
  );
}

function QuickActionCard({ label, icon, color }: QuickActionProps) {
  return (
    <TouchableOpacity style={styles.quickActionCard} activeOpacity={0.75}>
      <View style={[styles.quickActionIcon, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={28} color={color} />
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function statusBadge(status: RecentRequestProps['status']) {
  const map: Record<RecentRequestProps['status'], { bg: string; text: string; dot: string }> = {
    Entregue: { bg: COLORS.successLight, text: COLORS.success, dot: COLORS.success },
    Pendente: { bg: COLORS.pendingLight, text: COLORS.pending, dot: COLORS.pending },
    Ativo: { bg: COLORS.activeLight, text: COLORS.active, dot: COLORS.active },
  };
  return map[status];
}

// ---------------------------------------------------------------------------
// Ecrã principal
// ---------------------------------------------------------------------------
export default function MyStayScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerWaveAccent} />
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerWelcome}>Bem-vindo(a),</Text>
            <Text style={styles.headerGuest}>{STAY_INFO.guestName}</Text>
          </View>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>
              {STAY_INFO.guestName.charAt(0)}
            </Text>
          </View>
        </View>

        <View style={styles.roomBadge}>
          <Ionicons name="bed" size={18} color={COLORS.white} style={{ marginRight: 6 }} />
          <Text style={styles.roomNumber}>{STAY_INFO.room}</Text>
        </View>

        <Text style={styles.headerDates}>
          {STAY_INFO.checkIn} — {STAY_INFO.checkOut}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Cards — scroll horizontal */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statusRow}
        >
          {STATUS_CARDS.map((card) => (
            <StatusCard key={card.label} {...card} />
          ))}
        </ScrollView>

        {/* Serviços do Quarto */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="grid" size={18} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.sectionTitle}>Serviços do Quarto</Text>
          </View>
          <View style={styles.quickActionsGrid}>
            {QUICK_ACTIONS.map((action) => (
              <QuickActionCard key={action.label} {...action} />
            ))}
          </View>
        </View>

        {/* Horários */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time" size={18} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.sectionTitle}>Horários</Text>
          </View>
          {SCHEDULES.map((s, i) => (
            <View key={s.label} style={[styles.scheduleRow, i < SCHEDULES.length - 1 && styles.scheduleDivider]}>
              <View style={styles.scheduleLeft}>
                <Ionicons name={s.icon} size={16} color={COLORS.primary} style={{ marginRight: 8 }} />
                <Text style={styles.scheduleLabel}>{s.label}</Text>
              </View>
              <Text style={styles.scheduleTime}>{s.time}</Text>
            </View>
          ))}
        </View>

        {/* Pedidos Recentes */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="list" size={18} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.sectionTitle}>Pedidos Recentes</Text>
          </View>
          {RECENT_REQUESTS.map((req, i) => {
            const badge = statusBadge(req.status);
            return (
              <View
                key={req.item}
                style={[styles.requestRow, i < RECENT_REQUESTS.length - 1 && styles.scheduleDivider]}
              >
                <View style={styles.requestDotWrap}>
                  <View style={[styles.requestDot, { backgroundColor: badge.dot }]} />
                </View>
                <Text style={styles.requestItem}>{req.item}</Text>
                <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                  <Text style={[styles.statusBadgeText, { color: badge.text }]}>{req.status}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Estilos
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primaryDark,
  },
  // ---------- Header ----------
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
    overflow: 'hidden',
  },
  headerWaveAccent: {
    position: 'absolute',
    bottom: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: COLORS.primaryDark,
    opacity: 0.3,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerWelcome: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '400',
  },
  headerGuest: {
    fontSize: 20,
    color: COLORS.white,
    fontWeight: '700',
    marginTop: 2,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarInitial: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
  },
  roomBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  roomNumber: {
    color: COLORS.white,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerDates: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '500',
  },
  // ---------- Scroll ----------
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  // ---------- Status Cards ----------
  statusRow: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 4,
    gap: 12,
  },
  statusCard: {
    width: 120,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  statusIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  statusLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  // ---------- Section Card ----------
  sectionCard: {
    backgroundColor: COLORS.card,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  // ---------- Quick Actions ----------
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    width: '46%',
    backgroundColor: COLORS.background,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  // ---------- Schedules ----------
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  scheduleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scheduleLabel: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  scheduleTime: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '700',
  },
  scheduleDivider: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  // ---------- Recent Requests ----------
  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  requestDotWrap: {
    width: 20,
    alignItems: 'center',
    marginRight: 8,
  },
  requestDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  requestItem: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
