import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  RefreshControl,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatKwanza, formatDateTime } from '../utils/format';

// Tipos
interface KpiCard {
  id: string;
  title: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

interface QuickAction {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  route: string;
}

interface ActivityItem {
  id: string;
  description: string;
  timestamp: string;
  type: 'invoice' | 'client' | 'incident' | 'contract';
}

// Dados de demonstração
const kpiData: KpiCard[] = [
  { id: '1', title: 'Receita Mensal', value: formatKwanza(12500000), icon: 'trending-up', color: '#059669' },
  { id: '2', title: 'Faturas', value: '142', icon: 'document-text', color: '#0A5C8A' },
  { id: '3', title: 'Clientes', value: '89', icon: 'people', color: '#7C3AED' },
  { id: '4', title: 'Contratos', value: '23', icon: 'briefcase', color: '#D97706' },
];

const quickActions: QuickAction[] = [
  { id: '1', title: 'Nova Fatura', icon: 'add-circle', color: '#0A5C8A', route: 'Faturas' },
  { id: '2', title: 'Novo Cliente', icon: 'person-add', color: '#059669', route: 'Clientes' },
  { id: '3', title: 'Registar\nIncidente', icon: 'warning', color: '#DC2626', route: 'Incidentes' },
  { id: '4', title: 'Ver\nRelatórios', icon: 'bar-chart', color: '#7C3AED', route: 'Dashboard' },
];

const recentActivity: ActivityItem[] = [
  { id: '1', description: 'Fatura FT 2026/0142 emitida para Sonangol EP', timestamp: '2026-03-27T14:30:00', type: 'invoice' },
  { id: '2', description: 'Novo cliente registado: Banco BAI', timestamp: '2026-03-27T11:15:00', type: 'client' },
  { id: '3', description: 'Incidente #034 resolvido — Fuga de água Bloco B', timestamp: '2026-03-27T09:45:00', type: 'incident' },
  { id: '4', description: 'Contrato #CT-2026/012 assinado com TAAG', timestamp: '2026-03-26T16:20:00', type: 'contract' },
  { id: '5', description: 'Fatura FT 2026/0141 paga — 2.500.000,00 AOA', timestamp: '2026-03-26T14:00:00', type: 'invoice' },
  { id: '6', description: 'Novo cliente registado: Unitel S.A.', timestamp: '2026-03-26T10:30:00', type: 'client' },
];

const typeIcons: Record<ActivityItem['type'], keyof typeof Ionicons.glyphMap> = {
  invoice: 'document-text-outline',
  client: 'person-outline',
  incident: 'warning-outline',
  contract: 'briefcase-outline',
};

const typeColors: Record<ActivityItem['type'], string> = {
  invoice: '#0A5C8A',
  client: '#059669',
  incident: '#DC2626',
  contract: '#D97706',
};

interface Props {
  navigation: any;
}

export default function DashboardScreen({ navigation }: Props) {
  const [refreshing, setRefreshing] = useState(false);
  const userName = 'Carlos';

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Simular carregamento de dados
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  const renderKpiCard = ({ item }: { item: KpiCard }) => (
    <View style={styles.kpiCard}>
      <View style={[styles.kpiIconContainer, { backgroundColor: item.color + '15' }]}>
        <Ionicons name={item.icon} size={22} color={item.color} />
      </View>
      <Text style={styles.kpiValue}>{item.value}</Text>
      <Text style={styles.kpiTitle}>{item.title}</Text>
    </View>
  );

  const renderQuickAction = (action: QuickAction) => (
    <TouchableOpacity
      key={action.id}
      style={styles.actionCard}
      activeOpacity={0.7}
      onPress={() => navigation.navigate(action.route)}
    >
      <View style={[styles.actionIconContainer, { backgroundColor: action.color + '15' }]}>
        <Ionicons name={action.icon} size={28} color={action.color} />
      </View>
      <Text style={styles.actionTitle}>{action.title}</Text>
    </TouchableOpacity>
  );

  const renderActivityItem = ({ item }: { item: ActivityItem }) => (
    <View style={styles.activityItem}>
      <View style={[styles.activityIcon, { backgroundColor: typeColors[item.type] + '15' }]}>
        <Ionicons name={typeIcons[item.type]} size={18} color={typeColors[item.type]} />
      </View>
      <View style={styles.activityContent}>
        <Text style={styles.activityText} numberOfLines={2}>
          {item.description}
        </Text>
        <Text style={styles.activityTime}>{formatDateTime(item.timestamp)}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Saudação */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Olá, {userName}!</Text>
            <Text style={styles.greetingSub}>Bem-vindo ao ENGERIS ONE</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color={colors.text} />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </View>

        {/* KPI Cards — scroll horizontal */}
        <Text style={styles.sectionTitle}>Resumo</Text>
        <FlatList
          data={kpiData}
          renderItem={renderKpiCard}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.kpiList}
        />

        {/* Acções rápidas — grid 2x2 */}
        <Text style={styles.sectionTitle}>Acções Rápidas</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map(renderQuickAction)}
        </View>

        {/* Actividade recente */}
        <Text style={styles.sectionTitle}>Actividade Recente</Text>
        <View style={styles.activityContainer}>
          {recentActivity.map((item) => (
            <React.Fragment key={item.id}>{renderActivityItem({ item })}</React.Fragment>
          ))}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const colors = {
  primary: '#0A5C8A',
  background: '#F9FAFB',
  text: '#111827',
  textSecondary: '#6B7280',
  cardBg: '#FFFFFF',
  border: '#E5E7EB',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  greetingSub: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  notificationBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DC2626',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },
  // KPI Cards
  kpiList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  kpiCard: {
    width: 150,
    backgroundColor: colors.cardBg,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  kpiIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  kpiTitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  // Acções rápidas
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  actionCard: {
    width: '47%',
    backgroundColor: colors.cardBg,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  // Actividade recente
  activityContainer: {
    marginHorizontal: 20,
    backgroundColor: colors.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
  activityTime: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 3,
  },
  bottomSpacer: {
    height: 24,
  },
});
