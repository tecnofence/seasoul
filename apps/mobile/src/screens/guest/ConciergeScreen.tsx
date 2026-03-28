import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
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
  emergency: '#DC2626',
  emergencyLight: '#FEE2E2',
};

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------
interface QuickAction {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bgColor: string;
}

interface ActiveRequest {
  id: string;
  label: string;
  time: string;
  status: 'Em progresso' | 'Aguarda confirmação';
}

// ---------------------------------------------------------------------------
// Dados mock
// ---------------------------------------------------------------------------
const QUICK_ACTIONS: QuickAction[] = [
  { id: 'taxi', label: 'Táxi / Transfer', icon: 'car', color: '#F59E0B', bgColor: '#FEF3C7' },
  { id: 'wakeup', label: 'Despertar', icon: 'alarm', color: '#8B5CF6', bgColor: '#EDE9FE' },
  { id: 'towels', label: 'Toalhas Extra', icon: 'layers', color: COLORS.primary, bgColor: COLORS.primaryLight },
  { id: 'minibar', label: 'Minibar', icon: 'wine', color: COLORS.accent, bgColor: COLORS.accentLight },
  { id: 'cleaning', label: 'Limpeza do Quarto', icon: 'brush', color: '#EF4444', bgColor: '#FEE2E2' },
  { id: 'local', label: 'Informações Locais', icon: 'map', color: '#6366F1', bgColor: '#EEF2FF' },
  { id: 'restaurant', label: 'Reserva Restaurante', icon: 'restaurant', color: '#F97316', bgColor: '#FFF7ED' },
  { id: 'emergency', label: 'Emergência', icon: 'call', color: COLORS.emergency, bgColor: COLORS.emergencyLight },
];

const ACTIVE_REQUESTS: ActiveRequest[] = [
  { id: 'req1', label: 'Toalhas Extra', time: 'Há 5 min', status: 'Em progresso' },
  { id: 'req2', label: 'Despertar 07:00', time: 'Há 10 min', status: 'Aguarda confirmação' },
];

// ---------------------------------------------------------------------------
// Mensagem de confirmação padrão
// ---------------------------------------------------------------------------
function sendRequest(label: string) {
  if (label === 'Emergência') {
    Alert.alert(
      'Emergência',
      'Tem a certeza que pretende acionar o serviço de emergência?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          style: 'destructive',
          onPress: () =>
            Alert.alert('Emergência ativada', 'A equipa de segurança foi alertada. Mantenha a calma.'),
        },
      ],
    );
    return;
  }
  Alert.alert(
    'Pedido enviado',
    'O seu pedido foi registado. Um membro da equipa irá contactá-lo em breve.',
    [{ text: 'OK' }],
  );
}

// ---------------------------------------------------------------------------
// Ecrã principal
// ---------------------------------------------------------------------------
export default function ConciergeScreen() {
  const [message, setMessage] = useState('');

  function handleSendMessage() {
    if (!message.trim()) {
      Alert.alert('Mensagem vazia', 'Por favor escreva uma mensagem antes de enviar.');
      return;
    }
    Alert.alert(
      'Pedido enviado',
      'O seu pedido foi registado. Um membro da equipa irá contactá-lo em breve.',
      [{ text: 'OK', onPress: () => setMessage('') }],
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Concierge</Text>
          <Text style={styles.headerSub}>Como podemos ajudar?</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Quick Actions Grid */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="flash" size={17} color={COLORS.primary} style={{ marginRight: 6 }} />
              <Text style={styles.sectionTitle}>Pedidos Rápidos</Text>
            </View>
            <View style={styles.actionsGrid}>
              {QUICK_ACTIONS.map((action) => (
                <TouchableOpacity
                  key={action.id}
                  style={[
                    styles.actionBtn,
                    action.id === 'emergency' && styles.actionBtnEmergency,
                  ]}
                  onPress={() => sendRequest(action.label)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.actionIconWrap, { backgroundColor: action.bgColor }]}>
                    <Ionicons name={action.icon} size={24} color={action.color} />
                  </View>
                  <Text
                    style={[
                      styles.actionLabel,
                      action.id === 'emergency' && styles.actionLabelEmergency,
                    ]}
                    numberOfLines={2}
                  >
                    {action.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Pedidos Ativos */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="time" size={17} color={COLORS.primary} style={{ marginRight: 6 }} />
              <Text style={styles.sectionTitle}>Pedidos Ativos</Text>
              <View style={styles.badgeCount}>
                <Text style={styles.badgeCountText}>{ACTIVE_REQUESTS.length}</Text>
              </View>
            </View>
            {ACTIVE_REQUESTS.map((req, i) => (
              <View
                key={req.id}
                style={[
                  styles.activeRequestRow,
                  i < ACTIVE_REQUESTS.length - 1 && styles.rowDivider,
                ]}
              >
                <View style={styles.activeRequestDot} />
                <View style={styles.activeRequestInfo}>
                  <Text style={styles.activeRequestLabel}>{req.label}</Text>
                  <Text style={styles.activeRequestTime}>{req.time}</Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    req.status === 'Em progresso'
                      ? styles.statusBadgeProgress
                      : styles.statusBadgePending,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      req.status === 'Em progresso'
                        ? styles.statusBadgeTextProgress
                        : styles.statusBadgeTextPending,
                    ]}
                  >
                    {req.status}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Mensagem Personalizada */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="chatbubble-ellipses" size={17} color={COLORS.primary} style={{ marginRight: 6 }} />
              <Text style={styles.sectionTitle}>Mensagem Personalizada</Text>
            </View>
            <TextInput
              style={styles.textInput}
              placeholder="Descreva o seu pedido ou questão..."
              placeholderTextColor={COLORS.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={message}
              onChangeText={setMessage}
            />
            <TouchableOpacity
              style={[styles.sendBtn, !message.trim() && styles.sendBtnDisabled]}
              onPress={handleSendMessage}
              activeOpacity={0.8}
            >
              <Ionicons name="send" size={16} color={COLORS.white} style={{ marginRight: 6 }} />
              <Text style={styles.sendBtnText}>Enviar Mensagem</Text>
            </TouchableOpacity>
          </View>

          {/* Rodapé */}
          <View style={styles.footer}>
            <Ionicons name="headset-outline" size={16} color={COLORS.textMuted} style={{ marginRight: 6 }} />
            <Text style={styles.footerText}>
              A equipa de concierge está disponível 24h por dia.
            </Text>
          </View>
        </ScrollView>
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
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 3,
    fontWeight: '500',
  },
  // ---------- Scroll ----------
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  // ---------- Section Card ----------
  sectionCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
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
    flex: 1,
  },
  badgeCount: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  // ---------- Actions Grid ----------
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionBtn: {
    width: '47%',
    backgroundColor: COLORS.background,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionBtnEmergency: {
    borderColor: COLORS.emergency,
    backgroundColor: COLORS.emergencyLight,
  },
  actionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 16,
  },
  actionLabelEmergency: {
    color: COLORS.emergency,
    fontWeight: '700',
  },
  // ---------- Active Requests ----------
  activeRequestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  activeRequestDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
    marginRight: 10,
  },
  activeRequestInfo: {
    flex: 1,
  },
  activeRequestLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  activeRequestTime: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusBadgeProgress: {
    backgroundColor: COLORS.accentLight,
  },
  statusBadgePending: {
    backgroundColor: '#FEF3C7',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusBadgeTextProgress: {
    color: COLORS.accent,
  },
  statusBadgeTextPending: {
    color: '#D97706',
  },
  // ---------- Text Input ----------
  textInput: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    fontSize: 14,
    color: COLORS.text,
    minHeight: 100,
    marginBottom: 12,
  },
  sendBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: COLORS.textMuted,
  },
  sendBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
  // ---------- Footer ----------
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
});
