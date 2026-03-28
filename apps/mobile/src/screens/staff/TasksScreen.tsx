import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
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
  text: '#111827',
  textSecondary: '#6B7280',
  cardBg: '#FFFFFF',
  border: '#E5E7EB',
};

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------
type TaskStatus = 'PENDENTE' | 'EM_CURSO' | 'CONCLUIDO';
type TaskPriority = 'URGENTE' | 'NORMAL';
type TaskType = 'MAINTENANCE' | 'HOUSEKEEPING' | 'SECURITY' | 'GENERAL';
type FilterTab = 'TODAS' | TaskStatus;

interface Task {
  id: string;
  title: string;
  location: string;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  submittedAgo: string;
}

// ---------------------------------------------------------------------------
// Dados de demonstração
// ---------------------------------------------------------------------------
const initialTasks: Task[] = [
  {
    id: '1',
    title: 'Torneira com fuga — casa de banho',
    location: 'Quarto 304',
    type: 'MAINTENANCE',
    status: 'PENDENTE',
    priority: 'URGENTE',
    submittedAgo: 'há 2h',
  },
  {
    id: '2',
    title: 'Ar-condicionado não arrefece',
    location: 'Quarto 201',
    type: 'MAINTENANCE',
    status: 'EM_CURSO',
    priority: 'URGENTE',
    submittedAgo: 'há 4h',
  },
  {
    id: '3',
    title: 'Lâmpada queimada no corredor',
    location: 'Corredor 2.º Piso',
    type: 'MAINTENANCE',
    status: 'PENDENTE',
    priority: 'NORMAL',
    submittedAgo: 'há 1h',
  },
  {
    id: '4',
    title: 'Limpeza de saída',
    location: 'Quarto 101',
    type: 'HOUSEKEEPING',
    status: 'EM_CURSO',
    priority: 'URGENTE',
    submittedAgo: 'há 30m',
  },
  {
    id: '5',
    title: 'Preparar quarto para chegada VIP',
    location: 'Quarto 205',
    type: 'HOUSEKEEPING',
    status: 'PENDENTE',
    priority: 'URGENTE',
    submittedAgo: 'há 1h',
  },
  {
    id: '6',
    title: 'Reposição de minibar',
    location: 'Quarto 310',
    type: 'HOUSEKEEPING',
    status: 'CONCLUIDO',
    priority: 'NORMAL',
    submittedAgo: 'há 3h',
  },
  {
    id: '7',
    title: 'Ronda nocturna — bloco B',
    location: 'Bloco B',
    type: 'SECURITY',
    status: 'CONCLUIDO',
    priority: 'NORMAL',
    submittedAgo: 'há 6h',
  },
  {
    id: '8',
    title: 'Reabastecimento de material de limpeza',
    location: 'Armazém',
    type: 'GENERAL',
    status: 'PENDENTE',
    priority: 'NORMAL',
    submittedAgo: 'há 5h',
  },
];

const filterTabs: { key: FilterTab; label: string }[] = [
  { key: 'TODAS',    label: 'Todas'    },
  { key: 'PENDENTE', label: 'Pendentes' },
  { key: 'EM_CURSO', label: 'Em Curso'  },
  { key: 'CONCLUIDO', label: 'Concluídas' },
];

// ---------------------------------------------------------------------------
// Configurações de estilo por valor de enum
// ---------------------------------------------------------------------------
const statusConfig: Record<TaskStatus, { label: string; color: string; bg: string }> = {
  PENDENTE:  { label: 'Pendente',  color: colors.warning, bg: colors.warning  + '18' },
  EM_CURSO:  { label: 'Em Curso',  color: colors.primary, bg: colors.primary  + '18' },
  CONCLUIDO: { label: 'Concluído', color: colors.success, bg: colors.success  + '18' },
};

const priorityConfig: Record<TaskPriority, { label: string; color: string; bg: string }> = {
  URGENTE: { label: 'Urgente', color: colors.danger, bg: colors.danger + '18' },
  NORMAL:  { label: 'Normal',  color: colors.textSecondary, bg: colors.border  },
};

const typeConfig: Record<TaskType, { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  MAINTENANCE:  { label: 'Manutenção',    icon: 'construct-outline',  color: colors.warning  },
  HOUSEKEEPING: { label: 'Limpeza',       icon: 'sparkles-outline',   color: colors.teal     },
  SECURITY:     { label: 'Segurança',     icon: 'shield-outline',     color: colors.primary  },
  GENERAL:      { label: 'Geral',         icon: 'clipboard-outline',  color: colors.textSecondary },
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface Props {
  role: string;
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------
export default function TasksScreen({ role: _role }: Props) {
  const [activeTab, setActiveTab] = useState<FilterTab>('TODAS');
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  const filteredTasks = useMemo(() => {
    if (activeTab === 'TODAS') return tasks;
    return tasks.filter((t) => t.status === activeTab);
  }, [tasks, activeTab]);

  // Contagem por separador
  const countByStatus = useMemo(() => {
    const counts: Record<FilterTab, number> = {
      TODAS: tasks.length,
      PENDENTE: 0,
      EM_CURSO: 0,
      CONCLUIDO: 0,
    };
    tasks.forEach((t) => { counts[t.status] += 1; });
    return counts;
  }, [tasks]);

  const handleAdvanceStatus = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const next: TaskStatus = t.status === 'PENDENTE' ? 'EM_CURSO' : 'CONCLUIDO';
        return { ...t, status: next };
      }),
    );
  };

  const renderTaskCard = (task: Task) => {
    const statusCfg = statusConfig[task.status];
    const priorityCfg = priorityConfig[task.priority];
    const typeCfg = typeConfig[task.type];
    const canAdvance = task.status !== 'CONCLUIDO';
    const actionLabel = task.status === 'PENDENTE' ? 'Iniciar' : 'Concluir';
    const actionColor = task.status === 'PENDENTE' ? colors.primary : colors.success;

    return (
      <View key={task.id} style={styles.taskCard}>
        {/* Linha superior: ícone de tipo + localização + tempo */}
        <View style={styles.taskCardHeader}>
          <View style={[styles.taskTypeIconWrap, { backgroundColor: typeCfg.color + '18' }]}>
            <Ionicons name={typeCfg.icon} size={16} color={typeCfg.color} />
          </View>
          <Text style={styles.taskTypeLabel}>{typeCfg.label}</Text>
          <View style={styles.taskHeaderSpacer} />
          <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
          <Text style={styles.taskTimeAgo}>{task.submittedAgo}</Text>
        </View>

        {/* Título e localização */}
        <Text style={styles.taskTitle}>{task.title}</Text>
        <View style={styles.taskLocationRow}>
          <Ionicons name="location-outline" size={13} color={colors.textSecondary} />
          <Text style={styles.taskLocation}>{task.location}</Text>
        </View>

        {/* Badges + botão de acção */}
        <View style={styles.taskCardFooter}>
          <View style={styles.taskBadges}>
            <View style={[styles.badge, { backgroundColor: statusCfg.bg }]}>
              <Text style={[styles.badgeText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: priorityCfg.bg }]}>
              <Text style={[styles.badgeText, { color: priorityCfg.color }]}>{priorityCfg.label}</Text>
            </View>
          </View>

          {canAdvance && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: actionColor }]}
              onPress={() => handleAdvanceStatus(task.id)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={task.status === 'PENDENTE' ? 'play' : 'checkmark'}
                size={13}
                color="#FFFFFF"
              />
              <Text style={styles.actionButtonText}>{actionLabel}</Text>
            </TouchableOpacity>
          )}
          {!canAdvance && (
            <View style={styles.completedBadge}>
              <Ionicons name="checkmark-circle" size={15} color={colors.success} />
              <Text style={styles.completedText}>Concluído</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Cabeçalho */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>As Minhas Tarefas</Text>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>{countByStatus.PENDENTE + countByStatus.EM_CURSO} activas</Text>
        </View>
      </View>

      {/* Separadores de filtro */}
      <View style={styles.tabsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContainer}>
          {filterTabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, isActive && styles.tabActive]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.75}
              >
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
                <View style={[styles.tabCount, isActive && styles.tabCountActive]}>
                  <Text style={[styles.tabCountText, isActive && styles.tabCountTextActive]}>
                    {countByStatus[tab.key]}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Lista de tarefas */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.taskList}>
          {filteredTasks.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="clipboard-outline" size={48} color={colors.border} />
              <Text style={styles.emptyStateTitle}>Sem tarefas</Text>
              <Text style={styles.emptyStateSubtitle}>
                Não existem tarefas{' '}
                {activeTab === 'PENDENTE'
                  ? 'pendentes'
                  : activeTab === 'EM_CURSO'
                  ? 'em curso'
                  : activeTab === 'CONCLUIDO'
                  ? 'concluídas'
                  : ''}{' '}
                neste momento.
              </Text>
            </View>
          ) : (
            filteredTasks.map(renderTaskCard)
          )}
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
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  headerBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Separadores
  tabsWrapper: {
    backgroundColor: colors.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  tabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabLabelActive: {
    color: '#FFFFFF',
  },
  tabCount: {
    backgroundColor: colors.border,
    borderRadius: 10,
    minWidth: 20,
    paddingHorizontal: 5,
    paddingVertical: 1,
    alignItems: 'center',
  },
  tabCountActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  tabCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  tabCountTextActive: {
    color: '#FFFFFF',
  },

  // Lista
  taskList: {
    padding: 16,
    gap: 12,
  },

  // Cartão de tarefa
  taskCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  taskCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 6,
  },
  taskTypeIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskTypeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  taskHeaderSpacer: {
    flex: 1,
  },
  taskTimeAgo: {
    fontSize: 11,
    color: colors.textSecondary,
    marginLeft: 2,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 21,
    marginBottom: 5,
  },
  taskLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 14,
  },
  taskLocation: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  taskCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  taskBadges: {
    flexDirection: 'row',
    gap: 6,
    flex: 1,
    flexWrap: 'wrap',
  },
  badge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 5,
    marginLeft: 8,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 8,
  },
  completedText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.success,
  },

  // Estado vazio
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 10,
  },
  emptyStateTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginTop: 4,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 32,
  },

  bottomSpacer: {
    height: 32,
  },
});
