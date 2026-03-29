import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { getUserInfo } from '../../services/api';

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
  purple: '#7C3AED',
  gray: '#6B7280',
  text: '#111827',
  textSecondary: '#6B7280',
  cardBg: '#FFFFFF',
  border: '#E5E7EB',
};

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------
type TicketStatus = 'ABERTO' | 'EM_CURSO' | 'RESOLVIDO';
type TicketPriority = 'URGENTE' | 'NORMAL';
type TicketType = 'Manutenção' | 'Elétrico' | 'Canalização' | 'Ar Condicionado' | 'Outro';
type FilterTab = 'Todos' | 'Abertos' | 'Em Curso' | 'Resolvidos';
type ViewMode = 'list' | 'create';

interface Ticket {
  id: string;
  number: string;
  priority: TicketPriority;
  location: string;
  type: TicketType;
  description: string;
  reportedBy: string;
  status: TicketStatus;
  createdAgo: string;
  resolutionNote: string;
}

// ---------------------------------------------------------------------------
// Dados mock
// ---------------------------------------------------------------------------
const INITIAL_TICKETS: Ticket[] = [
  {
    id: '1',
    number: '#2026/038',
    priority: 'URGENTE',
    location: 'Quarto 304',
    type: 'Canalização',
    description: 'Torneira da casa de banho com fuga constante — água a acumular no chão.',
    reportedBy: 'Receção',
    status: 'ABERTO',
    createdAgo: 'há 3h',
    resolutionNote: '',
  },
  {
    id: '2',
    number: '#2026/039',
    priority: 'NORMAL',
    location: 'Corredor 2.º Piso',
    type: 'Elétrico',
    description: 'Duas lâmpadas fundidas junto ao elevador.',
    reportedBy: 'Housekeeping',
    status: 'EM_CURSO',
    createdAgo: 'há 5h',
    resolutionNote: '',
  },
  {
    id: '3',
    number: '#2026/040',
    priority: 'NORMAL',
    location: 'Quarto 201',
    type: 'Ar Condicionado',
    description: 'AC não arrefece — temperatura mantém-se a 28°C mesmo no mínimo.',
    reportedBy: 'Hóspede',
    status: 'ABERTO',
    createdAgo: 'há 1h',
    resolutionNote: '',
  },
  {
    id: '4',
    number: '#2026/035',
    priority: 'NORMAL',
    location: 'Cozinha',
    type: 'Manutenção',
    description: 'Porta do frigorífico industrial não fecha corretamente.',
    reportedBy: 'F&B',
    status: 'RESOLVIDO',
    createdAgo: 'ontem',
    resolutionNote: 'Ajustada a dobradiça e substituída a borracha de vedação.',
  },
  {
    id: '5',
    number: '#2026/036',
    priority: 'URGENTE',
    location: 'Piscina',
    type: 'Manutenção',
    description: 'Sistema de filtragem com ruído anormal — possível falha na bomba.',
    reportedBy: 'Segurança',
    status: 'EM_CURSO',
    createdAgo: 'há 4h',
    resolutionNote: '',
  },
  {
    id: '6',
    number: '#2026/037',
    priority: 'NORMAL',
    location: 'Quarto 105',
    type: 'Elétrico',
    description: 'Tomada junto à cama não funciona — hóspede sem carregamento.',
    reportedBy: 'Receção',
    status: 'RESOLVIDO',
    createdAgo: 'ontem',
    resolutionNote: 'Substituída a tomada — estava com circuito interno partido.',
  },
  {
    id: '7',
    number: '#2026/041',
    priority: 'NORMAL',
    location: 'Bar Exterior',
    type: 'Outro',
    description: 'Cadeira de bar partida — risco de acidente.',
    reportedBy: 'F&B',
    status: 'ABERTO',
    createdAgo: 'há 30min',
    resolutionNote: '',
  },
  {
    id: '8',
    number: '#2026/042',
    priority: 'URGENTE',
    location: 'Quarto 412',
    type: 'Canalização',
    description: 'Sanita entupida — hóspede impossibilitado de utilizar.',
    reportedBy: 'Receção',
    status: 'ABERTO',
    createdAgo: 'há 10min',
    resolutionNote: '',
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const TYPE_META: Record<TicketType, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  Manutenção: { icon: 'construct-outline', color: '#1A3E6E' },
  Elétrico: { icon: 'flash-outline', color: '#D97706' },
  Canalização: { icon: 'water-outline', color: '#0D9488' },
  'Ar Condicionado': { icon: 'thermometer-outline', color: '#7C3AED' },
  Outro: { icon: 'ellipsis-horizontal-circle-outline', color: '#6B7280' },
};

const LOCATION_ICON: keyof typeof Ionicons.glyphMap = 'location-outline';

const TICKET_TYPES: TicketType[] = [
  'Manutenção',
  'Elétrico',
  'Canalização',
  'Ar Condicionado',
  'Outro',
];

function getFilteredTickets(tickets: Ticket[], tab: FilterTab): Ticket[] {
  switch (tab) {
    case 'Abertos':
      return tickets.filter((t) => t.status === 'ABERTO');
    case 'Em Curso':
      return tickets.filter((t) => t.status === 'EM_CURSO');
    case 'Resolvidos':
      return tickets.filter((t) => t.status === 'RESOLVIDO');
    default:
      return tickets;
  }
}

function generateTicketNumber(total: number): string {
  const seq = total + 38;
  return `#2026/0${String(seq).padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// Helpers de mapeamento API → Ticket local
// ---------------------------------------------------------------------------
function mapApiTicket(raw: Record<string, unknown>): Ticket {
  const statusMap: Record<string, TicketStatus> = {
    OPEN: 'ABERTO',
    IN_PROGRESS: 'EM_CURSO',
    RESOLVED: 'RESOLVIDO',
    ABERTO: 'ABERTO',
    EM_CURSO: 'EM_CURSO',
    RESOLVIDO: 'RESOLVIDO',
  };
  const priorityMap: Record<string, TicketPriority> = {
    HIGH: 'URGENTE',
    URGENT: 'URGENTE',
    NORMAL: 'NORMAL',
    LOW: 'NORMAL',
    URGENTE: 'URGENTE',
  };
  const typeMap: Record<string, TicketType> = {
    MAINTENANCE: 'Manutenção',
    ELECTRICAL: 'Elétrico',
    PLUMBING: 'Canalização',
    AIR_CONDITIONING: 'Ar Condicionado',
    OTHER: 'Outro',
  };
  return {
    id: String(raw.id ?? raw._id ?? Date.now()),
    number: String(raw.number ?? raw.ticketNumber ?? `#${raw.id}`),
    priority: priorityMap[String(raw.priority)] ?? 'NORMAL',
    location: String(raw.location ?? raw.room ?? ''),
    type: typeMap[String(raw.category ?? raw.type)] ?? 'Outro',
    description: String(raw.description ?? ''),
    reportedBy: String(raw.reportedBy ?? raw.createdBy ?? ''),
    status: statusMap[String(raw.status)] ?? 'ABERTO',
    createdAgo: String(raw.createdAgo ?? ''),
    resolutionNote: String(raw.resolutionNote ?? raw.resolution ?? ''),
  };
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------
export default function TicketsScreen() {
  const queryClient = useQueryClient();

  // Estado principal — fallback mock enquanto API não responde
  const [filterTab, setFilterTab] = useState<FilterTab>('Todos');
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionText, setResolutionText] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // Estado do formulário de criação
  const [formLocation, setFormLocation] = useState('');
  const [formType, setFormType] = useState<TicketType | null>(null);
  const [formPriority, setFormPriority] = useState<TicketPriority>('NORMAL');
  const [formDescription, setFormDescription] = useState('');
  const [formReportedBy, setFormReportedBy] = useState('Equipa Técnica');

  // ---------------------------------------------------------------------------
  // Query — buscar tickets da API (fallback para mock se falhar)
  // ---------------------------------------------------------------------------
  const { data: tickets = INITIAL_TICKETS, isLoading: loadingTickets } = useQuery<Ticket[]>({
    queryKey: ['tickets'],
    queryFn: async () => {
      const userInfo = await getUserInfo();
      const params: Record<string, string> = { assignedTo: 'me' };
      if (userInfo?.resortId) params.resortId = userInfo.resortId;
      const res = await api.get('/maintenance', { params });
      const raw = (res.data?.data ?? res.data ?? []) as Record<string, unknown>[];
      return Array.isArray(raw) ? raw.map(mapApiTicket) : INITIAL_TICKETS;
    },
    // Se a API falhar, manter os dados mock
    placeholderData: INITIAL_TICKETS,
  });

  // ---------------------------------------------------------------------------
  // Mutation — aceitar ticket (ABERTO → EM_CURSO)
  // ---------------------------------------------------------------------------
  const acceptMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/maintenance/${id}`, { status: 'IN_PROGRESS' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
    onError: () => {
      // Actualização optimista local em caso de erro
      queryClient.setQueryData<Ticket[]>(['tickets'], (prev) =>
        (prev ?? []).map((t) => (t.id === resolvingId ? { ...t, status: 'EM_CURSO' } : t)),
      );
    },
  });

  // ---------------------------------------------------------------------------
  // Mutation — resolver ticket (EM_CURSO → RESOLVIDO)
  // ---------------------------------------------------------------------------
  const resolveMutation = useMutation({
    mutationFn: async ({ id, note }: { id: string; note: string }) => {
      await api.patch(`/maintenance/${id}`, { status: 'RESOLVED', resolutionNote: note });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
    onError: (_, variables) => {
      // Actualização optimista local em caso de erro
      queryClient.setQueryData<Ticket[]>(['tickets'], (prev) =>
        (prev ?? []).map((t) =>
          t.id === variables.id
            ? { ...t, status: 'RESOLVIDO', resolutionNote: variables.note }
            : t,
        ),
      );
    },
  });

  // ---------------------------------------------------------------------------
  // Mutation — criar novo ticket
  // ---------------------------------------------------------------------------
  const createMutation = useMutation({
    mutationFn: async (payload: {
      location: string;
      category: string;
      priority: string;
      description: string;
      reportedBy: string;
    }) => {
      const res = await api.post('/maintenance', payload);
      return res.data?.data ?? res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
    onError: (_, variables) => {
      // Fallback local se API falhar
      const newTicket: Ticket = {
        id: String(Date.now()),
        number: generateTicketNumber(tickets.length),
        priority: variables.priority === 'HIGH' ? 'URGENTE' : 'NORMAL',
        location: variables.location,
        type: (variables.category as TicketType) ?? 'Outro',
        description: variables.description,
        reportedBy: variables.reportedBy,
        status: 'ABERTO',
        createdAgo: 'agora mesmo',
        resolutionNote: '',
      };
      queryClient.setQueryData<Ticket[]>(['tickets'], (prev) => [newTicket, ...(prev ?? [])]);
    },
  });

  // Contagens por aba
  const counts = useMemo(() => ({
    Todos: tickets.length,
    Abertos: tickets.filter((t) => t.status === 'ABERTO').length,
    'Em Curso': tickets.filter((t) => t.status === 'EM_CURSO').length,
    Resolvidos: tickets.filter((t) => t.status === 'RESOLVIDO').length,
  }), [tickets]);

  const filteredTickets = useMemo(
    () => getFilteredTickets(tickets, filterTab),
    [tickets, filterTab],
  );

  const submitting = createMutation.isPending;

  // ---------------------------------------------------------------------------
  // Acções de tickets
  // ---------------------------------------------------------------------------
  function acceptTicket(id: string) {
    // Optimistic update
    queryClient.setQueryData<Ticket[]>(['tickets'], (prev) =>
      (prev ?? []).map((t) => (t.id === id ? { ...t, status: 'EM_CURSO' } : t)),
    );
    acceptMutation.mutate(id);
  }

  function startResolving(id: string) {
    setResolvingId(id);
    setResolutionText('');
  }

  function cancelResolving() {
    setResolvingId(null);
    setResolutionText('');
  }

  function confirmResolving(id: string) {
    if (!resolutionText.trim()) {
      Alert.alert('Campo obrigatório', 'Por favor descreva a solução aplicada.');
      return;
    }
    const note = resolutionText.trim();
    // Optimistic update
    queryClient.setQueryData<Ticket[]>(['tickets'], (prev) =>
      (prev ?? []).map((t) =>
        t.id === id ? { ...t, status: 'RESOLVIDO', resolutionNote: note } : t,
      ),
    );
    resolveMutation.mutate({ id, note });
    setResolvingId(null);
    setResolutionText('');
  }

  // ---------------------------------------------------------------------------
  // Acções do formulário
  // ---------------------------------------------------------------------------
  const TYPE_TO_API: Record<TicketType, string> = {
    'Manutenção': 'MAINTENANCE',
    'Elétrico': 'ELECTRICAL',
    'Canalização': 'PLUMBING',
    'Ar Condicionado': 'AIR_CONDITIONING',
    'Outro': 'OTHER',
  };

  function resetForm() {
    setFormLocation('');
    setFormType(null);
    setFormPriority('NORMAL');
    setFormDescription('');
    setFormReportedBy('Equipa Técnica');
  }

  function handleCancelCreate() {
    resetForm();
    setViewMode('list');
  }

  function handleSubmitTicket() {
    if (!formLocation.trim()) {
      Alert.alert('Campo obrigatório', 'A localização é obrigatória.');
      return;
    }
    if (!formType) {
      Alert.alert('Campo obrigatório', 'Selecione o tipo de chamado.');
      return;
    }
    if (!formDescription.trim()) {
      Alert.alert('Campo obrigatório', 'A descrição do problema é obrigatória.');
      return;
    }

    createMutation.mutate({
      location: formLocation.trim(),
      category: TYPE_TO_API[formType],
      priority: formPriority === 'URGENTE' ? 'HIGH' : 'NORMAL',
      description: formDescription.trim(),
      reportedBy: formReportedBy.trim() || 'Equipa Técnica',
    });

    resetForm();
    setViewMode('list');
    setFilterTab('Abertos');
  }

  // ---------------------------------------------------------------------------
  // Render: vista de criação
  // ---------------------------------------------------------------------------
  if (viewMode === 'create') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <KeyboardAvoidingView
          style={styles.flex1}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Cabeçalho */}
          <View style={styles.createHeader}>
            <TouchableOpacity onPress={handleCancelCreate} style={styles.cancelBtn}>
              <Ionicons name="arrow-back-outline" size={20} color={colors.primary} />
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
            <Text style={styles.createTitle}>Novo Chamado</Text>
            <View style={styles.cancelBtnPlaceholder} />
          </View>

          <ScrollView
            style={styles.createScroll}
            contentContainerStyle={styles.createScrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Localização */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Localização</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Ex: Quarto 304, Piscina, Lobby..."
                placeholderTextColor={colors.textSecondary}
                value={formLocation}
                onChangeText={setFormLocation}
              />
            </View>

            {/* Tipo */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Tipo</Text>
              <View style={styles.typeRow}>
                {TICKET_TYPES.map((t) => {
                  const meta = TYPE_META[t];
                  const selected = formType === t;
                  return (
                    <TouchableOpacity
                      key={t}
                      onPress={() => setFormType(t)}
                      style={[
                        styles.typeBtn,
                        selected && { borderColor: meta.color, backgroundColor: `${meta.color}18` },
                      ]}
                    >
                      <Ionicons
                        name={meta.icon}
                        size={18}
                        color={selected ? meta.color : colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.typeBtnText,
                          selected && { color: meta.color, fontWeight: '700' },
                        ]}
                        numberOfLines={1}
                      >
                        {t}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Prioridade */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Prioridade</Text>
              <View style={styles.priorityRow}>
                {(['NORMAL', 'URGENTE'] as TicketPriority[]).map((p) => {
                  const selected = formPriority === p;
                  const isUrgente = p === 'URGENTE';
                  const activeColor = isUrgente ? colors.danger : colors.gray;
                  return (
                    <TouchableOpacity
                      key={p}
                      onPress={() => setFormPriority(p)}
                      style={[
                        styles.priorityBtn,
                        selected && {
                          borderColor: activeColor,
                          backgroundColor: `${activeColor}15`,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.priorityBtnText,
                          selected && { color: activeColor, fontWeight: '700' },
                        ]}
                      >
                        {p}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Descrição */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Descrição</Text>
              <TextInput
                style={[styles.formInput, styles.formInputMultiline]}
                placeholder="Descreva o problema em detalhe..."
                placeholderTextColor={colors.textSecondary}
                value={formDescription}
                onChangeText={setFormDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Reportado por */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Reportado por</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Equipa Técnica"
                placeholderTextColor={colors.textSecondary}
                value={formReportedBy}
                onChangeText={setFormReportedBy}
              />
            </View>

            {/* Botão submit */}
            <TouchableOpacity
              style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
              onPress={handleSubmitTicket}
              disabled={submitting}
            >
              <Ionicons name="add-circle-outline" size={20} color="#fff" />
              <Text style={styles.submitBtnText}>Abrir Chamado</Text>
            </TouchableOpacity>

            <View style={styles.formBottomSpacer} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ---------------------------------------------------------------------------
  // Render: vista de lista
  // ---------------------------------------------------------------------------
  const filterTabs: FilterTab[] = ['Todos', 'Abertos', 'Em Curso', 'Resolvidos'];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Cabeçalho */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Chamados</Text>
          <Text style={styles.listSubtitle}>{counts.Todos} chamados registados</Text>
        </View>

        {/* Abas de filtro */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabScroll}
          contentContainerStyle={styles.tabScrollContent}
        >
          {filterTabs.map((tab) => {
            const active = filterTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setFilterTab(tab)}
                style={[styles.tabBtn, active && styles.tabBtnActive]}
              >
                <Text style={[styles.tabBtnText, active && styles.tabBtnTextActive]}>
                  {tab}
                </Text>
                <View style={[styles.tabBadge, active && styles.tabBadgeActive]}>
                  <Text style={[styles.tabBadgeText, active && styles.tabBadgeTextActive]}>
                    {counts[tab]}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Lista de tickets */}
        <ScrollView
          style={styles.listScroll}
          contentContainerStyle={styles.listScrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {filteredTickets.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-done-circle-outline" size={48} color={colors.border} />
              <Text style={styles.emptyStateText}>Nenhum chamado nesta categoria</Text>
            </View>
          )}

          {filteredTickets.map((ticket) => {
            const typeMeta = TYPE_META[ticket.type];
            const isResolving = resolvingId === ticket.id;

            return (
              <View key={ticket.id} style={styles.card}>
                {/* Topo: número, prioridade, tempo */}
                <View style={styles.cardTopRow}>
                  <Text style={styles.cardNumber}>{ticket.number}</Text>
                  <View style={styles.cardTopRight}>
                    <View
                      style={[
                        styles.priorityBadge,
                        ticket.priority === 'URGENTE'
                          ? styles.priorityBadgeUrgente
                          : styles.priorityBadgeNormal,
                      ]}
                    >
                      <Text
                        style={[
                          styles.priorityBadgeText,
                          ticket.priority === 'URGENTE'
                            ? styles.priorityBadgeTextUrgente
                            : styles.priorityBadgeTextNormal,
                        ]}
                      >
                        {ticket.priority}
                      </Text>
                    </View>
                    <Text style={styles.cardTimeAgo}>{ticket.createdAgo}</Text>
                  </View>
                </View>

                {/* Localização */}
                <View style={styles.cardLocationRow}>
                  <Ionicons name={LOCATION_ICON} size={14} color={colors.textSecondary} />
                  <Text style={styles.cardLocationText}>{ticket.location}</Text>
                </View>

                {/* Tipo */}
                <View style={styles.cardTypeRow}>
                  <View
                    style={[
                      styles.typeBadge,
                      { backgroundColor: `${typeMeta.color}18`, borderColor: `${typeMeta.color}40` },
                    ]}
                  >
                    <Ionicons name={typeMeta.icon} size={13} color={typeMeta.color} />
                    <Text style={[styles.typeBadgeText, { color: typeMeta.color }]}>
                      {ticket.type}
                    </Text>
                  </View>
                </View>

                {/* Descrição */}
                <Text style={styles.cardDescription} numberOfLines={2}>
                  {ticket.description}
                </Text>

                {/* Reportado por */}
                <Text style={styles.cardReportedBy}>
                  Reportado por: {ticket.reportedBy}
                </Text>

                {/* Acções de estado */}
                <View style={styles.cardActions}>
                  {ticket.status === 'ABERTO' && (
                    <TouchableOpacity
                      style={styles.acceptBtn}
                      onPress={() => acceptTicket(ticket.id)}
                    >
                      <Ionicons name="play-circle-outline" size={16} color="#fff" />
                      <Text style={styles.acceptBtnText}>Aceitar</Text>
                    </TouchableOpacity>
                  )}

                  {ticket.status === 'EM_CURSO' && (
                    <View style={styles.inCourseRow}>
                      <View style={styles.inProgressBadge}>
                        <Ionicons name="time-outline" size={14} color={colors.success} />
                        <Text style={styles.inProgressText}>Em Progresso...</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.resolveBtn}
                        onPress={() =>
                          isResolving ? cancelResolving() : startResolving(ticket.id)
                        }
                      >
                        <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
                        <Text style={styles.resolveBtnText}>Resolver</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {ticket.status === 'RESOLVIDO' && (
                    <View style={styles.resolvedRow}>
                      <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color={colors.success}
                      />
                      <Text style={styles.resolvedText}>Resolvido</Text>
                    </View>
                  )}
                </View>

                {/* Nota de resolução (RESOLVIDO) */}
                {ticket.status === 'RESOLVIDO' && ticket.resolutionNote ? (
                  <View style={styles.resolutionNoteBox}>
                    <Text style={styles.resolutionNoteText} numberOfLines={2}>
                      {ticket.resolutionNote}
                    </Text>
                  </View>
                ) : null}

                {/* Painel inline de resolução */}
                {isResolving && (
                  <View style={styles.resolutionPanel}>
                    <TextInput
                      style={styles.resolutionInput}
                      placeholder="Descreva a solução aplicada..."
                      placeholderTextColor={colors.textSecondary}
                      value={resolutionText}
                      onChangeText={setResolutionText}
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                      autoFocus
                    />
                    <View style={styles.resolutionBtnRow}>
                      <TouchableOpacity
                        style={styles.resolutionCancelBtn}
                        onPress={cancelResolving}
                      >
                        <Text style={styles.resolutionCancelBtnText}>Cancelar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.resolutionConfirmBtn}
                        onPress={() => confirmResolving(ticket.id)}
                      >
                        <Ionicons name="checkmark-outline" size={15} color="#fff" />
                        <Text style={styles.resolutionConfirmBtnText}>
                          Confirmar Resolução
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            );
          })}

          {/* Espaço no fundo para o FAB */}
          <View style={styles.listBottomSpacer} />
        </ScrollView>

        {/* FAB */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => {
            resetForm();
            setViewMode('create');
          }}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Estilos
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex1: {
    flex: 1,
  },

  // ---- Cabeçalho lista ----
  listHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  listTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  listSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // ---- Abas ----
  tabScroll: {
    flexGrow: 0,
  },
  tabScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
    marginRight: 8,
  },
  tabBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  tabBtnTextActive: {
    color: '#fff',
  },
  tabBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  tabBadgeTextActive: {
    color: '#fff',
  },

  // ---- Lista / scroll ----
  listScroll: {
    flex: 1,
  },
  listScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  listBottomSpacer: {
    height: 88,
  },

  // ---- Estado vazio ----
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.textSecondary,
  },

  // ---- Card de ticket ----
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  cardTopRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  priorityBadgeUrgente: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  priorityBadgeNormal: {
    backgroundColor: '#F9FAFB',
    borderColor: colors.border,
  },
  priorityBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  priorityBadgeTextUrgente: {
    color: colors.danger,
  },
  priorityBadgeTextNormal: {
    color: colors.textSecondary,
  },
  cardTimeAgo: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  cardLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  cardLocationText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  cardTypeRow: {
    marginBottom: 8,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    gap: 4,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardDescription: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 19,
    marginBottom: 6,
  },
  cardReportedBy: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 10,
  },

  // ---- Acções de estado ----
  cardActions: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  acceptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 9,
    borderRadius: 8,
    gap: 6,
  },
  acceptBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  inCourseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  inProgressBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  inProgressText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.success,
  },
  resolveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 5,
    flex: 1,
    justifyContent: 'center',
  },
  resolveBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  resolvedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resolvedText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.success,
  },

  // ---- Nota de resolução (preview) ----
  resolutionNoteBox: {
    marginTop: 8,
    backgroundColor: '#ECFDF5',
    borderRadius: 6,
    padding: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.success,
  },
  resolutionNoteText: {
    fontSize: 12,
    color: '#065F46',
    lineHeight: 17,
  },

  // ---- Painel inline de resolução ----
  resolutionPanel: {
    marginTop: 12,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  resolutionInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.text,
    minHeight: 80,
    marginBottom: 10,
  },
  resolutionBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  resolutionCancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#fff',
  },
  resolutionCancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  resolutionConfirmBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: colors.success,
    gap: 5,
  },
  resolutionConfirmBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },

  // ---- FAB ----
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },

  // ---- Cabeçalho de criação ----
  createHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.cardBg,
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  cancelBtnPlaceholder: {
    width: 70,
  },
  createTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },

  // ---- Formulário de criação ----
  createScroll: {
    flex: 1,
  },
  createScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  formGroup: {
    marginBottom: 18,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.text,
  },
  formInputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },

  // ---- Selecção de tipo ----
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.cardBg,
  },
  typeBtnText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },

  // ---- Selecção de prioridade ----
  priorityRow: {
    flexDirection: 'row',
    gap: 10,
  },
  priorityBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.cardBg,
  },
  priorityBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },

  // ---- Botão submit ----
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 4,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  formBottomSpacer: {
    height: 40,
  },
});
