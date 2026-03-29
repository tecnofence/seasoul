import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ---------------------------------------------------------------------------
// Cores
// ---------------------------------------------------------------------------
const colors = {
  primary: '#1A3E6E',
  background: '#F9FAFB',
  success: '#059669',
  warning: '#D97706',
  danger: '#DC2626',
  teal: '#0D9488',
  orange: '#EA580C',
  text: '#111827',
  textSecondary: '#6B7280',
  cardBg: '#FFFFFF',
  border: '#E5E7EB',
};

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------
interface KpiCard {
  id: string;
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

interface Alert {
  id: string;
  message: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

interface ActivityItem {
  id: string;
  time: string;
  type: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}

// ---------------------------------------------------------------------------
// Dados de demonstração
// ---------------------------------------------------------------------------
const kpiCards: KpiCard[] = [
  { id: '1', label: 'Ocupação',        value: '78%',   icon: 'bed-outline',           color: colors.success  },
  { id: '2', label: 'Check-ins Hoje',  value: '12',    icon: 'arrow-down-circle',     color: colors.primary  },
  { id: '3', label: 'Check-outs Hoje', value: '8',     icon: 'arrow-up-circle',       color: colors.orange   },
  { id: '4', label: 'Quartos Limpos',  value: '24/31', icon: 'checkmark-circle',      color: colors.teal     },
];

const operationalAlerts: Alert[] = [
  { id: '1', message: 'Quarto 304 — Manutenção solicitada',          icon: 'warning',       color: colors.danger  },
  { id: '2', message: 'Check-in grupo às 15:00 — 12 hóspedes',      icon: 'people',        color: colors.primary },
  { id: '3', message: 'Lavandaria — stock baixo de toalhas',         icon: 'alert-circle',  color: colors.warning },
  { id: '4', message: 'Buffet do pequeno-almoço termina às 10:30',   icon: 'time-outline',  color: colors.teal    },
];

const todayActivity: ActivityItem[] = [
  { id: '1', time: '08:15', type: 'Check-in',   description: 'Família Silva — Quarto 201 (Deluxe Mar)',     icon: 'log-in-outline'          },
  { id: '2', time: '09:40', type: 'Manutenção', description: 'Torneira reparada — Quarto 115',             icon: 'construct-outline'       },
  { id: '3', time: '11:00', type: 'Check-out',  description: 'Sr. Baptista — Quarto 308 — factura emitida', icon: 'log-out-outline'         },
  { id: '4', time: '12:30', type: 'Reserva',    description: 'Nova reserva confirmada — 2 adultos, 1 criança', icon: 'calendar-outline'    },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface Props {
  userName: string;
  role: string;
  navigation?: any;
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------
export default function HotelDashboardScreen({ userName, role, navigation }: Props) {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ---------------------------------------------------------------- */}
        {/* Cabeçalho                                                         */}
        {/* ---------------------------------------------------------------- */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerGreeting}>Bom dia, {userName}!</Text>
            <Text style={styles.headerDate}>Sábado, 28 de Março de 2026</Text>
          </View>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>{role}</Text>
          </View>
        </View>

        {/* ---------------------------------------------------------------- */}
        {/* KPI Cards — grelha 2×2                                            */}
        {/* ---------------------------------------------------------------- */}
        <Text style={styles.sectionTitle}>Resumo Operacional</Text>
        <View style={styles.kpiGrid}>
          {kpiCards.map((card) => (
            <View key={card.id} style={styles.kpiCard}>
              <View style={[styles.kpiIconWrap, { backgroundColor: card.color + '18' }]}>
                <Ionicons name={card.icon} size={24} color={card.color} />
              </View>
              <Text style={styles.kpiValue}>{card.value}</Text>
              <Text style={styles.kpiLabel}>{card.label}</Text>
            </View>
          ))}
        </View>

        {/* ---------------------------------------------------------------- */}
        {/* Alertas Operacionais                                               */}
        {/* ---------------------------------------------------------------- */}
        <Text style={styles.sectionTitle}>Alertas Operacionais</Text>
        <View style={styles.alertsContainer}>
          {operationalAlerts.map((alert, index) => (
            <View
              key={alert.id}
              style={[
                styles.alertRow,
                index < operationalAlerts.length - 1 && styles.alertRowBorder,
              ]}
            >
              <View style={[styles.alertIconWrap, { backgroundColor: alert.color + '18' }]}>
                <Ionicons name={alert.icon} size={18} color={alert.color} />
              </View>
              <Text style={styles.alertText} numberOfLines={2}>
                {alert.message}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </View>
          ))}
        </View>

        {/* ---------------------------------------------------------------- */}
        {/* Actividade de Hoje                                                 */}
        {/* ---------------------------------------------------------------- */}
        <Text style={styles.sectionTitle}>Actividade de Hoje</Text>
        <View style={styles.activityContainer}>
          {todayActivity.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.activityRow,
                index < todayActivity.length - 1 && styles.activityRowBorder,
              ]}
            >
              {/* Linha de tempo */}
              <View style={styles.timelineColumn}>
                <Text style={styles.activityTime}>{item.time}</Text>
                {index < todayActivity.length - 1 && (
                  <View style={styles.timelineLine} />
                )}
              </View>
              {/* Ícone */}
              <View style={[styles.activityIconWrap, { backgroundColor: colors.primary + '12' }]}>
                <Ionicons name={item.icon} size={16} color={colors.primary} />
              </View>
              {/* Conteúdo */}
              <View style={styles.activityContent}>
                <Text style={styles.activityType}>{item.type}</Text>
                <Text style={styles.activityDesc} numberOfLines={2}>
                  {item.description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Atalhos rápidos */}
        <Text style={styles.sectionTitle}>Acções Rápidas</Text>
        <View style={styles.quickActionsRow}>
          {[
            { label: 'Novo Check-in',  icon: 'log-in-outline'    as keyof typeof Ionicons.glyphMap, color: colors.primary,   onPress: undefined                                         },
            { label: 'Check-out',      icon: 'log-out-outline'   as keyof typeof Ionicons.glyphMap, color: colors.orange,    onPress: undefined                                         },
            { label: 'Reportar',       icon: 'construct-outline' as keyof typeof Ionicons.glyphMap, color: colors.danger,    onPress: undefined                                         },
            { label: 'Limpeza',        icon: 'sparkles-outline'  as keyof typeof Ionicons.glyphMap, color: colors.teal,      onPress: undefined                                         },
            { label: 'Tarefas',        icon: 'checkbox-outline'  as keyof typeof Ionicons.glyphMap, color: '#7C3AED',        onPress: () => navigation?.navigate('Tarefas')             },
          ].map((action) => (
            <TouchableOpacity key={action.label} style={styles.quickAction} activeOpacity={0.75} onPress={action.onPress}>
              <View style={[styles.quickActionIcon, { backgroundColor: action.color + '18' }]}>
                <Ionicons name={action.icon} size={22} color={action.color} />
              </View>
              <Text style={styles.quickActionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Estilos
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },

  // Cabeçalho
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerContent: {
    flex: 1,
  },
  headerGreeting: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  headerDate: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
  },
  roleBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Título de secção
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },

  // KPI Grid
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  kpiCard: {
    width: '47%',
    backgroundColor: colors.cardBg,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'flex-start',
  },
  kpiIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  kpiLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  // Alertas
  alertsContainer: {
    marginHorizontal: 20,
    backgroundColor: colors.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 12,
  },
  alertRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  alertIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertText: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },

  // Actividade — linha do tempo
  activityContainer: {
    marginHorizontal: 20,
    backgroundColor: colors.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    gap: 10,
  },
  activityRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  timelineColumn: {
    alignItems: 'center',
    width: 42,
  },
  activityTime: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  timelineLine: {
    width: 1,
    flex: 1,
    backgroundColor: colors.border,
    marginTop: 4,
    minHeight: 20,
  },
  activityIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  activityContent: {
    flex: 1,
    paddingTop: 1,
  },
  activityType: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  activityDesc: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },

  // Acções rápidas
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    gap: 8,
  },
  quickAction: {
    flex: 1,
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  quickActionIcon: {
    width: 42,
    height: 42,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },

  bottomSpacer: {
    height: 32,
  },
});
