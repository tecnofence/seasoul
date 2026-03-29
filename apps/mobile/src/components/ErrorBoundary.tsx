import React, { Component, type ReactNode, type ErrorInfo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary global — evita crashes silenciosos na app
 * Mostra ecrã de erro amigável com opção de reiniciar
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    // Em produção: enviar para serviço de logging (Sentry, etc.)
    console.error('[ErrorBoundary] Erro capturado:', error.message);
    console.error('[ErrorBoundary] Stack:', errorInfo.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <View style={styles.container}>
          <Ionicons name="warning-outline" size={64} color="#EF4444" />
          <Text style={styles.title}>Algo correu mal</Text>
          <Text style={styles.subtitle}>
            Ocorreu um erro inesperado na aplicação.{'\n'}Por favor, tente novamente.
          </Text>

          {__DEV__ && this.state.error && (
            <ScrollView style={styles.debugBox}>
              <Text style={styles.debugTitle}>Detalhes (dev only):</Text>
              <Text style={styles.debugText}>{this.state.error.message}</Text>
              {this.state.errorInfo && (
                <Text style={styles.debugStack}>
                  {this.state.errorInfo.componentStack}
                </Text>
              )}
            </ScrollView>
          )}

          <TouchableOpacity style={styles.button} onPress={this.handleReset}>
            <Ionicons name="refresh" size={18} color="#FFFFFF" />
            <Text style={styles.buttonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    padding: 32,
    paddingTop: Platform.OS === 'ios' ? 60 : 32,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A3E6E',
    marginTop: 20,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  debugBox: {
    backgroundColor: '#1E293B',
    borderRadius: 8,
    padding: 12,
    maxHeight: 200,
    width: '100%',
    marginBottom: 24,
  },
  debugTitle: {
    color: '#F59E0B',
    fontWeight: '700',
    fontSize: 12,
    marginBottom: 6,
  },
  debugText: {
    color: '#EF4444',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 8,
  },
  debugStack: {
    color: '#94A3B8',
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A3E6E',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
});
