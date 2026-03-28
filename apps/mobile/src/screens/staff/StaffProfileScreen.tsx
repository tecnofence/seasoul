import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { removeToken, removeUserInfo } from '../../services/api';

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
// Utilitários
// ---------------------------------------------------------------------------
const roleLabels: Record<string, string> = {
  SUPER_ADMIN:     'Super Admin',
  RESORT_MANAGER:  'Director do Resort',
  RECEPTIONIST:    'Rececionista',
  HOUSEKEEPER:     'Camareira/Camareiro',
  MAINTENANCE:     'Manutenção',
  SECURITY:        'Segurança',
};

function getRoleLabel(role: string): string {
  return roleLabels[role] ?? role;
}

function getInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase();
}

// ---------------------------------------------------------------------------
// Dados de demonstração — estatísticas da semana
// ---------------------------------------------------------------------------
interface WeekStat {
  id: string;
  weekday: string;
  date: string;
  horas: string;
  presente: boolean;
}

const weekStats: WeekStat[] = [
  { id: '1', weekday: 'Segunda', date: '24/03', horas: '8h 38m', presente: true  },
  { id: '2', weekday: 'Terça',   date: '25/03', horas: '8h 29m', presente: true  },
  { id: '3', weekday: 'Quarta',  date: '26/03', horas: '8h 25m', presente: true  },
  { id: '4', weekday: 'Quinta',  date: '27/03', horas: '8h 35m', presente: true  },
  { id: '5', weekday: 'Sábado',  date: '28/03', horas: '4h 23m', presente: true  },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface UserInfo {
  name: string;
  role: string;
  resortId?: string | null;
}

interface Props {
  userInfo: UserInfo;
  onLogout: () => void;
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------
export default function StaffProfileScreen({ userInfo, onLogout }: Props) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const totalHoras = weekStats.reduce((acc, stat) => {
    const match = stat.horas.match(/(\d+)h\s*(\d+)m/);
    if (match) {
      return acc + parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
    }
    return acc;
  }, 0);

  const totalHorasLabel = `${Math.floor(totalHoras / 60)}h ${totalHoras % 60}m`;
  const faltas = weekStats.filter((s) => !s.presente).length;

  const handleChangePassword = () => {
    Alert.alert('Palavra-passe', 'Funcionalidade disponível em breve.');
  };

  const handleSupport = () => {
    Alert.alert(
      'Suporte Técnico',
      'Para assistência técnica, contacte:\n\nsuporte@engeris.ao\n\nHorário: Segunda a Sexta, 08:00–18:00',
      [{ text: 'OK' }],
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Terminar Sessão',
      'Tem a certeza que pretende terminar a sessão?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Terminar Sessão',
          style: 'destructive',
          onPress: async () => {
            await removeToken();
            await removeUserInfo();
            onLogout();
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Cabeçalho azul */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>O Meu Perfil</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

        {/* ---------------------------------------------------------------- */}
        {/* Cartão de perfil                                                  */}
        {/* ---------------------------------------------------------------- */}
        <View style={styles.profileCard}>
          {/* Avatar */}
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>{getInitial(userInfo.name)}</Text>
          </View>

          {/* Nome e função */}
          <Text style={styles.profileName}>{userInfo.name}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>{getRoleLabel(userInfo.role)}</Text>
          </View>

          {/* Resort */}
          <View style={styles.resortRow}>
            <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.resortText}>Sea and Soul Resorts — Cabo Ledo, Angola</Text>
          </View>

          {/* Separador */}
          <View style={styles.profileDivider} />

          {/* Mini estatísticas da semana */}
          <View style={styles.weekStatsHeader}>
            <Ionicons name="calendar-outline" size={15} color={colors.primary} />
            <Text style={styles.weekStatsTitle}>Esta semana</Text>
          </View>

          <View style={styles.weekSummaryRow}>
            <View style={styles.weekSummaryCell}>
              <Text style={styles.weekSummaryValue}>{totalHorasLabel}</Text>
              <Text style={styles.weekSummaryLabel}>Trabalhadas</Text>
            </View>
            <View style={styles.weekSummarySep} />
            <View style={styles.weekSummaryCell}>
              <Text style={[styles.weekSummaryValue, faltas > 0 && styles.weekSummaryValueDanger]}>
                {faltas}
              </Text>
              <Text style={styles.weekSummaryLabel}>Faltas</Text>
            </View>
            <View style={styles.weekSummarySep} />
            <View style={styles.weekSummaryCell}>
              <Text style={styles.weekSummaryValue}>{weekStats.filter((s) => s.presente).length}</Text>
              <Text style={styles.weekSummaryLabel}>Dias pres.</Text>
            </View>
          </View>

          {/* Tabela de dias */}
          {weekStats.map((stat, index) => (
            <View
              key={stat.id}
              style={[
                styles.weekStatRow,
                index < weekStats.length - 1 && styles.weekStatRowBorder,
              ]}
            >
              <View style={[
                styles.presenceDot,
                { backgroundColor: stat.presente ? colors.success : colors.danger },
              ]} />
              <Text style={styles.weekStatDay}>{stat.weekday}</Text>
              <Text style={styles.weekStatDate}>{stat.date}</Text>
              <View style={styles.weekStatSpacer} />
              <Text style={[
                styles.weekStatHours,
                !stat.presente && styles.weekStatHoursAbsent,
              ]}>
                {stat.presente ? stat.horas : 'Falta'}
              </Text>
            </View>
          ))}
        </View>

        {/* ---------------------------------------------------------------- */}
        {/* Definições                                                        */}
        {/* ---------------------------------------------------------------- */}
        <Text style={styles.sectionTitle}>Definições</Text>
        <View style={styles.settingsCard}>
          {/* Alterar palavra-passe */}
          <TouchableOpacity style={[styles.settingsRow, styles.settingsRowBorder]} onPress={handleChangePassword} activeOpacity={0.7}>
            <View style={[styles.settingsIconWrap, { backgroundColor: colors.primary + '18' }]}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.primary} />
            </View>
            <Text style={styles.settingsLabel}>Alterar Palavra-passe</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* Notificações */}
          <View style={[styles.settingsRow, styles.settingsRowBorder]}>
            <View style={[styles.settingsIconWrap, { backgroundColor: colors.warning + '18' }]}>
              <Ionicons name="notifications-outline" size={18} color={colors.warning} />
            </View>
            <Text style={styles.settingsLabel}>Notificações</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: colors.border, true: colors.primary + '80' }}
              thumbColor={notificationsEnabled ? colors.primary : '#D1D5DB'}
            />
          </View>

          {/* Idioma */}
          <View style={[styles.settingsRow, styles.settingsRowBorder]}>
            <View style={[styles.settingsIconWrap, { backgroundColor: colors.success + '18' }]}>
              <Ionicons name="language-outline" size={18} color={colors.success} />
            </View>
            <Text style={styles.settingsLabel}>Idioma</Text>
            <Text style={styles.settingsValue}>Português (Angola)</Text>
          </View>

          {/* Suporte técnico */}
          <TouchableOpacity style={styles.settingsRow} onPress={handleSupport} activeOpacity={0.7}>
            <View style={[styles.settingsIconWrap, { backgroundColor: colors.teal + '18' }]}>
              <Ionicons name="help-circle-outline" size={18} color={colors.teal} />
            </View>
            <Text style={styles.settingsLabel}>Suporte Técnico</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* ---------------------------------------------------------------- */}
        {/* Informação da aplicação                                           */}
        {/* ---------------------------------------------------------------- */}
        <View style={styles.appInfoCard}>
          <Text style={styles.appInfoName}>Sea and Soul Resorts — Equipa</Text>
          <Text style={styles.appInfoVersion}>Versão 1.0.0 · Desenvolvido por ENGERIS</Text>
        </View>

        {/* ---------------------------------------------------------------- */}
        {/* Botão de logout                                                   */}
        {/* ---------------------------------------------------------------- */}
        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
            <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
            <Text style={styles.logoutButtonText}>Terminar Sessão</Text>
          </TouchableOpacity>
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
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Cartão de perfil
  profileCard: {
    backgroundColor: colors.cardBg,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    alignItems: 'center',
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarInitial: {
    fontSize: 30,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  roleBadge: {
    backgroundColor: colors.primary + '18',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginBottom: 10,
  },
  roleBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  resortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  resortText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  profileDivider: {
    width: '100%',
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 18,
  },

  // Estatísticas da semana
  weekStatsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
    alignSelf: 'flex-start',
  },
  weekStatsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  weekSummaryRow: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 16,
  },
  weekSummaryCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekSummarySep: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  weekSummaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  weekSummaryValueDanger: {
    color: colors.danger,
  },
  weekSummaryLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  weekStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    width: '100%',
    gap: 8,
  },
  weekStatRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  presenceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  weekStatDay: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    width: 80,
  },
  weekStatDate: {
    fontSize: 12,
    color: colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  weekStatSpacer: {
    flex: 1,
  },
  weekStatHours: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    fontVariant: ['tabular-nums'],
  },
  weekStatHoursAbsent: {
    color: colors.danger,
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

  // Definições
  settingsCard: {
    backgroundColor: colors.cardBg,
    marginHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  settingsRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingsIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsLabel: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
  },
  settingsValue: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  // Info da app
  appInfoCard: {
    marginHorizontal: 20,
    marginTop: 20,
    alignItems: 'center',
    paddingVertical: 14,
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  appInfoName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  appInfoVersion: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  // Logout
  logoutSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  logoutButton: {
    backgroundColor: colors.danger,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: colors.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  bottomSpacer: {
    height: 40,
  },
});

