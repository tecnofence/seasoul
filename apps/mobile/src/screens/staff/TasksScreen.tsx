import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ---------------------------------------------------------------------------
// Cores
// ---------------------------------------------------------------------------
const colors = {
  primary: '#1A3E6E',
  primaryLight: '#EFF6FF',
  background: '#F9FAFB',
  success: '#059669',
  successLight: '#D1FAE5',
  warning: '#D97706',
  warningLight: '#FEF3C7',
  danger: '#DC2626',
  dangerLight: '#FEE2E2',
  text: '#111827',
  textSecondary: '#6B7280',
  cardBg: '#FFFFFF',
  border: '#E5E7EB',
  progressBg: '#E5E7EB',
};

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------
type Section = 'MANHA' | 'TARDE' | 'GERAL';

interface DailyTask {
  id: string;
  section: Section;
  title: string;
  description: string;
  done: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
}

interface Props {
  role: string;
}

// ---------------------------------------------------------------------------
// Dados mock — tarefas diárias do hotel
// ---------------------------------------------------------------------------
const buildInitialTasks = (): DailyTask[] => [
  // Manhã
  { id: 'm1', section: 'MANHA', title: 'Inspecionar quartos de saída', description: 'Verificar estado dos quartos com check-out esta manhã (101, 205, 310)', done: false, icon: 'bed-outline', iconColor: colors.primary },
  { id: 'm2', section: 'MANHA', title: 'Verificar painel elétrico', description: 'Inspeção diária do quadro elétrico — anotar leituras no livro de manutenção', done: false, icon: 'flash-outline', iconColor: '#D97706' },
  { id: 'm3', section: 'MANHA', title: 'Controlo piscina — cloro e pH', description: 'Medir e registar níveis de cloro (1.0–3.0 mg/L) e pH (7.2–7.6)', done: true, icon: 'water-outline', iconColor: '#0D9488' },
  { id: 'm4', section: 'MANHA', title: 'Teste geradores de emergência', description: 'Arranque de teste dos geradores (2 min) e registo de pressão óleo', done: true, icon: 'battery-charging-outline', iconColor: '#7C3AED' },
  { id: 'm5', section: 'MANHA', title: 'Ronda exterior — jardins e caminhos', description: 'Verificar iluminação exterior, sinalética e estado dos caminhos pedonais', done: false, icon: 'walk-outline', iconColor: colors.success },

  // Tarde
  { id: 't1', section: 'TARDE', title: 'Filtros de ar condicionado — Bloco B', description: 'Limpeza e inspecção mensal dos filtros — quartos 201 a 220', done: false, icon: 'thermometer-outline', iconColor: '#7C3AED' },
  { id: 't2', section: 'TARDE', title: 'Reposição de consumíveis', description: 'Verificar e repor lâmpadas, pilhas e materiais de manutenção no armazém', done: false, icon: 'cube-outline', iconColor: '#6B7280' },
  { id: 't3', section: 'TARDE', title: 'Revisão sistema incêndio', description: 'Testar extintores e sprinklers — piso 2. Registar no caderno de segurança', done: false, icon: 'flame-outline', iconColor: colors.danger },
  { id: 't4', section: 'TARDE', title: 'Lubrificação fechaduras TTLock', description: 'Aplicar lubrificante e testar abertura — quartos 301 a 315', done: false, icon: 'lock-closed-outline', iconColor: colors.primary },

  // Geral
  { id: 'g1', section: 'GERAL', title: 'Atualizar livro de ocorrências', description: 'Registar todas as intervenções do dia no sistema de manutenção', done: false, icon: 'document-text-outline', iconColor: colors.primary },
  { id: 'g2', section: 'GERAL', title: 'Coordenar com Receção', description: 'Verificar chamados novos e prioridades do turno', done: true, icon: 'call-outline', iconColor: colors.success },
  { id: 'g3', section: 'GERAL', title: 'Relatório fim de turno', description: 'Preencher relatório de manutenção e enviar ao responsável', done: false, icon: 'clipboard-outline', iconColor: '#D97706' },
]

const SECTION_LABELS: Record<Section, string> = {
  MANHA: 'Manhã',
  TARDE: 'Tarde',
  GERAL: 'Geral',
}

const SECTION_ICONS: Record<Section, keyof typeof Ionicons.glyphMap> = {
  MANHA: 'sunny-outline',
  TARDE: 'partly-sunny-outline',
  GERAL: 'list-outline',
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------
export default function TasksScreen({ role }: Props) {
  const [tasks, setTasks] = useState<DailyTask[]>(buildInitialTasks)
  const [activeSection, setActiveSection] = useState<Section | 'TODAS'>('TODAS')

  const sections: Array<Section | 'TODAS'> = ['TODAS', 'MANHA', 'TARDE', 'GERAL']

  const stats = useMemo(() => {
    const done = tasks.filter((t) => t.done).length
    return { done, total: tasks.length, pct: tasks.length ? Math.round((done / tasks.length) * 100) : 0 }
  }, [tasks])

  const visibleTasks = useMemo(() => {
    if (activeSection === 'TODAS') return tasks
    return tasks.filter((t) => t.section === activeSection)
  }, [tasks, activeSection])

  const groupedBySection = useMemo(() => {
    const sectionOrder: Section[] = ['MANHA', 'TARDE', 'GERAL']
    return sectionOrder
      .map((s) => ({ section: s, items: visibleTasks.filter((t) => t.section === s) }))
      .filter((g) => g.items.length > 0)
  }, [visibleTasks])

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    )
  }

  const resetAll = () => {
    Alert.alert(
      'Reiniciar tarefas',
      'Tem a certeza que quer marcar todas as tarefas como pendentes?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Reiniciar', style: 'destructive', onPress: () => setTasks(buildInitialTasks()) },
      ]
    )
  }

  const today = new Date().toLocaleDateString('pt-AO', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Cabeçalho com data e progresso */}
        <View style={styles.headerCard}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerDate}>{today.charAt(0).toUpperCase() + today.slice(1)}</Text>
              <Text style={styles.headerSub}>Tarefas de hoje</Text>
            </View>
            <TouchableOpacity onPress={resetAll} style={styles.resetBtn}>
              <Ionicons name="refresh-outline" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Barra de progresso */}
          <View style={styles.progressRow}>
            <Text style={styles.progressText}>{stats.done}/{stats.total} concluídas</Text>
            <Text style={[styles.progressPct, stats.pct === 100 && { color: colors.success }]}>
              {stats.pct}%
            </Text>
          </View>
          <View style={styles.progressBg}>
            <View
              style={[
                styles.progressFill,
                { width: `${stats.pct}%` as any },
                stats.pct === 100 && { backgroundColor: colors.success },
              ]}
            />
          </View>
          {stats.pct === 100 && (
            <View style={styles.completedBanner}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={styles.completedText}>Todas as tarefas concluídas! Excelente trabalho.</Text>
            </View>
          )}
        </View>

        {/* Filtro por secção */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {sections.map((s) => {
            const count = s === 'TODAS' ? tasks.length : tasks.filter((t) => t.section === s).length
            const doneCount = s === 'TODAS' ? stats.done : tasks.filter((t) => t.section === s && t.done).length
            const active = s === activeSection
            return (
              <TouchableOpacity
                key={s}
                style={[styles.filterTab, active && styles.filterTabActive]}
                onPress={() => setActiveSection(s)}
                activeOpacity={0.7}
              >
                {s !== 'TODAS' && (
                  <Ionicons
                    name={SECTION_ICONS[s as Section]}
                    size={14}
                    color={active ? '#fff' : colors.textSecondary}
                    style={{ marginRight: 4 }}
                  />
                )}
                <Text style={[styles.filterTabText, active && styles.filterTabTextActive]}>
                  {s === 'TODAS' ? 'Todas' : SECTION_LABELS[s as Section]}
                </Text>
                <View style={[styles.filterBadge, active && styles.filterBadgeActive]}>
                  <Text style={[styles.filterBadgeText, active && styles.filterBadgeTextActive]}>
                    {doneCount}/{count}
                  </Text>
                </View>
              </TouchableOpacity>
            )
          })}
        </ScrollView>

        {/* Lista de tarefas por secção */}
        {groupedBySection.map(({ section, items }) => (
          <View key={section} style={styles.sectionGroup}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name={SECTION_ICONS[section]} size={15} color={colors.primary} style={{ marginRight: 6 }} />
              <Text style={styles.sectionLabel}>{SECTION_LABELS[section]}</Text>
              <Text style={styles.sectionCount}>
                {items.filter((i) => i.done).length}/{items.length}
              </Text>
            </View>

            <View style={styles.taskList}>
              {items.map((task, idx) => (
                <TouchableOpacity
                  key={task.id}
                  style={[
                    styles.taskCard,
                    idx < items.length - 1 && styles.taskCardBorder,
                    task.done && styles.taskCardDone,
                  ]}
                  onPress={() => toggleTask(task.id)}
                  activeOpacity={0.7}
                >
                  {/* Checkbox */}
                  <View style={[styles.checkbox, task.done && styles.checkboxDone]}>
                    {task.done && <Ionicons name="checkmark" size={14} color="#fff" />}
                  </View>

                  {/* Ícone do tipo */}
                  <View style={[styles.taskIcon, { backgroundColor: task.iconColor + '15' }]}>
                    <Ionicons name={task.icon} size={18} color={task.done ? colors.textSecondary : task.iconColor} />
                  </View>

                  {/* Texto */}
                  <View style={styles.taskContent}>
                    <Text style={[styles.taskTitle, task.done && styles.taskTitleDone]}>{task.title}</Text>
                    <Text style={styles.taskDescription} numberOfLines={2}>{task.description}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  )
}

// ---------------------------------------------------------------------------
// Estilos
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  // Header
  headerCard: {
    backgroundColor: colors.cardBg,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  headerDate: { fontSize: 15, fontWeight: '700', color: colors.text },
  headerSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  resetBtn: { padding: 6, backgroundColor: colors.primaryLight, borderRadius: 8 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressText: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  progressPct: { fontSize: 13, fontWeight: '700', color: colors.primary },
  progressBg: { height: 8, backgroundColor: colors.progressBg, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: 8, backgroundColor: colors.primary, borderRadius: 4 },
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successLight,
    borderRadius: 8,
    padding: 8,
    marginTop: 10,
    gap: 6,
  },
  completedText: { fontSize: 12, color: colors.success, fontWeight: '600', flex: 1 },

  // Filtros
  filterRow: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterTabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterTabText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  filterTabTextActive: { color: '#fff' },
  filterBadge: {
    marginLeft: 6,
    backgroundColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  filterBadgeActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  filterBadgeText: { fontSize: 10, fontWeight: '700', color: colors.textSecondary },
  filterBadgeTextActive: { color: '#fff' },

  // Secção
  sectionGroup: { marginHorizontal: 16, marginTop: 8 },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingLeft: 4,
  },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: colors.primary, flex: 1 },
  sectionCount: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  taskList: {
    backgroundColor: colors.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },

  // Tarefa
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  taskCardBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  taskCardDone: { opacity: 0.6 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkboxDone: { backgroundColor: colors.success, borderColor: colors.success },
  taskIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  taskContent: { flex: 1 },
  taskTitle: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 2 },
  taskTitleDone: { textDecorationLine: 'line-through', color: colors.textSecondary },
  taskDescription: { fontSize: 12, color: colors.textSecondary, lineHeight: 16 },

  bottomSpacer: { height: 32 },
})
