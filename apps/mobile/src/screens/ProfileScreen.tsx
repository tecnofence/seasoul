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
import type { StackNavigationProp } from '@react-navigation/stack';
import { removeToken } from '../services/api';

type Language = 'PT' | 'EN';

interface Props {
  navigation: StackNavigationProp<any>;
}

export default function ProfileScreen({ navigation }: Props) {
  const [language, setLanguage] = useState<Language>('PT');
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);

  // Dados do utilizador (viriam do estado global / API)
  const user = {
    name: 'Carlos Mendes',
    email: 'carlos.mendes@engeris.co.ao',
    role: 'Gestor',
    tenant: 'ENGERIS Lda.',
    initials: 'CM',
  };

  const handleLogout = () => {
    Alert.alert('Terminar Sessão', 'Tem a certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await removeToken();
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        },
      },
    ]);
  };

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'PT' ? 'EN' : 'PT'));
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Avatar e informações */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user.initials}</Text>
          </View>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{user.role}</Text>
          </View>
        </View>

        {/* Informações da conta */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações da Conta</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={20} color={colors.textSecondary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Nome</Text>
                <Text style={styles.infoValue}>{user.name}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{user.email}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Ionicons name="shield-checkmark-outline" size={20} color={colors.textSecondary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Função</Text>
                <Text style={styles.infoValue}>{user.role}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Ionicons name="business-outline" size={20} color={colors.textSecondary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Organização</Text>
                <Text style={styles.infoValue}>{user.tenant}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Idioma */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Idioma</Text>
          <View style={styles.card}>
            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Ionicons name="language-outline" size={20} color={colors.textSecondary} />
                <Text style={styles.toggleLabel}>Idioma da aplicação</Text>
              </View>
              <TouchableOpacity onPress={toggleLanguage} style={styles.languageToggle}>
                <Text style={[styles.langOption, language === 'PT' && styles.langActive]}>PT</Text>
                <Text style={styles.langSeparator}>|</Text>
                <Text style={[styles.langOption, language === 'EN' && styles.langActive]}>EN</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Notificações */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notificações</Text>
          <View style={styles.card}>
            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Ionicons name="notifications-outline" size={20} color={colors.textSecondary} />
                <Text style={styles.toggleLabel}>Notificações push</Text>
              </View>
              <Switch
                value={pushNotifications}
                onValueChange={setPushNotifications}
                trackColor={{ false: '#D1D5DB', true: colors.primary + '60' }}
                thumbColor={pushNotifications ? colors.primary : '#F9FAFB'}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
                <Text style={styles.toggleLabel}>Notificações por email</Text>
              </View>
              <Switch
                value={emailNotifications}
                onValueChange={setEmailNotifications}
                trackColor={{ false: '#D1D5DB', true: colors.primary + '60' }}
                thumbColor={emailNotifications ? colors.primary : '#F9FAFB'}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Ionicons name="chatbubble-outline" size={20} color={colors.textSecondary} />
                <Text style={styles.toggleLabel}>Notificações por SMS</Text>
              </View>
              <Switch
                value={smsNotifications}
                onValueChange={setSmsNotifications}
                trackColor={{ false: '#D1D5DB', true: colors.primary + '60' }}
                thumbColor={smsNotifications ? colors.primary : '#F9FAFB'}
              />
            </View>
          </View>
        </View>

        {/* Terminar sessão */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={20} color="#DC2626" />
          <Text style={styles.logoutText}>Terminar Sessão</Text>
        </TouchableOpacity>

        {/* Versão */}
        <Text style={styles.versionText}>ENGERIS ONE v1.0.0</Text>

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
  // Header do perfil
  profileHeader: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  userEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  roleBadge: {
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: colors.primary + '15',
  },
  roleText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  // Secções
  section: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 10,
  },
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 48,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  toggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toggleLabel: {
    fontSize: 15,
    color: colors.text,
  },
  // Idioma
  languageToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  langOption: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    paddingHorizontal: 4,
  },
  langActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  langSeparator: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  // Logout
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 28,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 20,
  },
  bottomSpacer: {
    height: 40,
  },
});
