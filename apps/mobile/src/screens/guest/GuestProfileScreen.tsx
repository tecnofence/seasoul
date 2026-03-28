import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { removeToken, removeUserInfo } from '../../services/api';

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
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
};

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------
type Language = 'PT' | 'EN';

interface Props {
  onLogout: () => void;
}

// ---------------------------------------------------------------------------
// Dados mock do hóspede
// ---------------------------------------------------------------------------
const GUEST = {
  name: 'João Silva',
  email: 'joao.silva@email.com',
  room: 'Quarto 201',
  initial: 'J',
};

const STAY = {
  checkIn: '28 Mar 2026',
  checkOut: '02 Abr 2026',
  resort: 'Sea and Soul — Cabo Ledo',
  nights: 5,
};

// ---------------------------------------------------------------------------
// Sub-componentes
// ---------------------------------------------------------------------------
interface InfoRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}

function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={16} color={COLORS.primary} style={{ marginRight: 10 }} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

interface ActionRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  iconColor?: string;
  onPress: () => void;
  danger?: boolean;
}

function ActionRow({ icon, label, iconColor, onPress, danger }: ActionRowProps) {
  return (
    <TouchableOpacity
      style={[styles.actionRow, danger && styles.actionRowDanger]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[styles.actionIconWrap, { backgroundColor: (iconColor ?? COLORS.primary) + '18' }]}>
        <Ionicons name={icon} size={18} color={iconColor ?? COLORS.primary} />
      </View>
      <Text style={[styles.actionLabel, danger && styles.actionLabelDanger]}>{label}</Text>
      {!danger && (
        <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
      )}
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Ecrã principal
// ---------------------------------------------------------------------------
export default function GuestProfileScreen({ onLogout }: Props) {
  const [language, setLanguage] = useState<Language>('PT');
  const [notifications, setNotifications] = useState(true);

  function handleLanguageToggle() {
    setLanguage((prev) => (prev === 'PT' ? 'EN' : 'PT'));
  }

  function handleEvaluate() {
    Alert.alert(
      'Avaliar Estadia',
      'Obrigado por querer partilhar a sua experiência connosco! O formulário de avaliação será enviado por e-mail no dia do check-out.',
      [{ text: 'OK' }],
    );
  }

  function handleCallReception() {
    Alert.alert(
      'Falar com a Receção',
      'Pretende ligar para a receção agora?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Ligar', onPress: () => Alert.alert('A ligar...', 'A conectar à receção do hotel.') },
      ],
    );
  }

  function handleFAQ() {
    Alert.alert(
      'FAQ — Perguntas Frequentes',
      'Para consultar as perguntas frequentes, aceda ao nosso site ou peça ajuda à receção.\n\nHorário de Recepção: 24h\nTel: +244 923 000 000',
      [{ text: 'OK' }],
    );
  }

  async function handleLogout() {
    Alert.alert(
      'Terminar Sessão',
      'Tem a certeza que deseja terminar a sessão?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Terminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeToken();
              await removeUserInfo();
              onLogout();
            } catch {
              // Mesmo que falhe o SecureStore, fazemos logout
              onLogout();
            }
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>O Meu Perfil</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>{GUEST.initial}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{GUEST.name}</Text>
            <Text style={styles.profileEmail}>{GUEST.email}</Text>
            <View style={styles.roomPill}>
              <Ionicons name="bed-outline" size={12} color={COLORS.primary} style={{ marginRight: 4 }} />
              <Text style={styles.roomPillText}>{GUEST.room}</Text>
            </View>
          </View>
        </View>

        {/* Estadia */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar" size={17} color={COLORS.primary} style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>A Minha Estadia</Text>
          </View>
          <InfoRow icon="log-in-outline" label="Check-in" value={STAY.checkIn} />
          <View style={styles.rowDivider} />
          <InfoRow icon="log-out-outline" label="Check-out" value={STAY.checkOut} />
          <View style={styles.rowDivider} />
          <InfoRow icon="location-outline" label="Resort" value={STAY.resort} />
          <View style={styles.rowDivider} />
          <InfoRow icon="moon-outline" label="Noites" value={String(STAY.nights)} />
        </View>

        {/* Preferências */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="settings-outline" size={17} color={COLORS.primary} style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>Preferências</Text>
          </View>

          {/* Language Toggle */}
          <View style={styles.preferenceRow}>
            <View style={styles.preferenceLeft}>
              <View style={[styles.prefIconWrap, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="language" size={16} color="#2563EB" />
              </View>
              <Text style={styles.preferenceLabel}>Idioma</Text>
            </View>
            <TouchableOpacity style={styles.langToggle} onPress={handleLanguageToggle} activeOpacity={0.8}>
              <View style={[styles.langOption, language === 'PT' && styles.langOptionActive]}>
                <Text style={[styles.langText, language === 'PT' && styles.langTextActive]}>PT</Text>
              </View>
              <View style={[styles.langOption, language === 'EN' && styles.langOptionActive]}>
                <Text style={[styles.langText, language === 'EN' && styles.langTextActive]}>EN</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.rowDivider} />

          {/* Notifications Toggle */}
          <View style={styles.preferenceRow}>
            <View style={styles.preferenceLeft}>
              <View style={[styles.prefIconWrap, { backgroundColor: COLORS.accentLight }]}>
                <Ionicons name="notifications-outline" size={16} color={COLORS.accent} />
              </View>
              <Text style={styles.preferenceLabel}>Notificações</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
              thumbColor={notifications ? COLORS.primary : COLORS.textMuted}
            />
          </View>
        </View>

        {/* Apoio ao Hóspede */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="headset-outline" size={17} color={COLORS.primary} style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>Apoio ao Hóspede</Text>
          </View>
          <ActionRow
            icon="star-outline"
            label="Avaliar Estadia"
            iconColor="#F59E0B"
            onPress={handleEvaluate}
          />
          <View style={styles.rowDivider} />
          <ActionRow
            icon="call-outline"
            label="Falar com a Receção"
            iconColor={COLORS.accent}
            onPress={handleCallReception}
          />
          <View style={styles.rowDivider} />
          <ActionRow
            icon="help-circle-outline"
            label="FAQ"
            iconColor="#6366F1"
            onPress={handleFAQ}
          />
        </View>

        {/* Terminar Sessão */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={18} color={COLORS.white} style={{ marginRight: 8 }} />
          <Text style={styles.logoutBtnText}>Terminar Sessão</Text>
        </TouchableOpacity>

        {/* Versão */}
        <Text style={styles.versionText}>Sea and Soul Resorts • v1.0.0</Text>
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
  // ---------- Scroll ----------
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  // ---------- Profile Card ----------
  profileCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarInitial: {
    color: COLORS.white,
    fontSize: 26,
    fontWeight: '800',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 3,
  },
  profileEmail: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    marginBottom: 8,
  },
  roomPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  roomPillText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
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
  },
  // ---------- Info Row ----------
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
  },
  infoLabel: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  rowDivider: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  // ---------- Preferences ----------
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  preferenceLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  prefIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  preferenceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  langToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  langOption: {
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  langOptionActive: {
    backgroundColor: COLORS.primary,
  },
  langText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  langTextActive: {
    color: COLORS.white,
  },
  // ---------- Action Row ----------
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  actionRowDanger: {
    paddingVertical: 12,
  },
  actionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  actionLabelDanger: {
    color: COLORS.danger,
  },
  // ---------- Logout ----------
  logoutBtn: {
    backgroundColor: COLORS.danger,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: COLORS.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
  },
  // ---------- Version ----------
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.textMuted,
  },
});
