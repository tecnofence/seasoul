import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import type { StackNavigationProp } from '@react-navigation/stack';
import api, { saveToken, saveUserInfo } from '../services/api';

type Language = 'PT' | 'EN';

const labels: Record<Language, Record<string, string>> = {
  PT: {
    welcome: 'Bem-vindo ao',
    subtitle: 'Sistema de Gestão Empresarial',
    email: 'Email',
    password: 'Palavra-passe',
    login: 'Entrar',
    forgotPassword: 'Esqueceu a palavra-passe?',
    language: 'Idioma',
    emailPlaceholder: 'email@empresa.co.ao',
    passwordPlaceholder: 'Introduza a sua palavra-passe',
    errorTitle: 'Erro',
    errorMessage: 'Email ou palavra-passe incorretos.',
  },
  EN: {
    welcome: 'Welcome to',
    subtitle: 'Enterprise Resource Planning',
    email: 'Email',
    password: 'Password',
    login: 'Sign In',
    forgotPassword: 'Forgot password?',
    language: 'Language',
    emailPlaceholder: 'email@company.co.ao',
    passwordPlaceholder: 'Enter your password',
    errorTitle: 'Error',
    errorMessage: 'Invalid email or password.',
  },
};

interface Props {
  navigation: StackNavigationProp<any>;
}

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState<Language>('PT');

  const t = labels[language];

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) return;

    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data.data;
      await saveToken(token);
      await saveUserInfo({ id: user.id, name: user.name, role: user.role, resortId: user.resortId });
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch {
      Alert.alert(t.errorTitle, t.errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'PT' ? 'EN' : 'PT'));
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Logo / Marca */}
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <Text style={styles.logoLetter}>E</Text>
            </View>
            <Text style={styles.logoText}>ENGERIS ONE</Text>
            <Text style={styles.subtitle}>{t.subtitle}</Text>
          </View>

          {/* Formulário */}
          <View style={styles.form}>
            <Text style={styles.label}>{t.email}</Text>
            <TextInput
              style={styles.input}
              placeholder={t.emailPlaceholder}
              placeholderTextColor={colors.placeholder}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.label}>{t.password}</Text>
            <TextInput
              style={styles.input}
              placeholder={t.passwordPlaceholder}
              placeholderTextColor={colors.placeholder}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>{t.login}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.forgotLink}>
              <Text style={styles.forgotText}>{t.forgotPassword}</Text>
            </TouchableOpacity>
          </View>

          {/* Selector de idioma */}
          <View style={styles.languageContainer}>
            <Text style={styles.languageLabel}>{t.language}:</Text>
            <TouchableOpacity onPress={toggleLanguage} style={styles.languageToggle}>
              <Text
                style={[
                  styles.languageOption,
                  language === 'PT' && styles.languageActive,
                ]}
              >
                PT
              </Text>
              <Text style={styles.languageSeparator}>|</Text>
              <Text
                style={[
                  styles.languageOption,
                  language === 'EN' && styles.languageActive,
                ]}
              >
                EN
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const colors = {
  primary: '#0A5C8A',
  background: '#F9FAFB',
  text: '#111827',
  textSecondary: '#6B7280',
  placeholder: '#9CA3AF',
  inputBorder: '#D1D5DB',
  inputBg: '#FFFFFF',
  white: '#FFFFFF',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoIcon: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoLetter: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.white,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  form: {
    marginBottom: 32,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.inputBg,
    marginBottom: 16,
  },
  button: {
    height: 50,
    backgroundColor: colors.primary,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  forgotLink: {
    alignItems: 'center',
    marginTop: 16,
  },
  forgotText: {
    color: colors.primary,
    fontSize: 14,
  },
  languageContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  languageLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginRight: 8,
  },
  languageToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageOption: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    paddingHorizontal: 4,
  },
  languageActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  languageSeparator: {
    color: colors.textSecondary,
    fontSize: 14,
  },
});
