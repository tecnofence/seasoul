import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

// ---------------------------------------------------------------------------
// Cores
// ---------------------------------------------------------------------------
const colors = {
  primary: '#1A3E6E',
  background: '#F9FAFB',
  success: '#059669',
  warning: '#D97706',
  danger: '#DC2626',
  text: '#111827',
  textSecondary: '#6B7280',
  cardBg: '#FFFFFF',
  border: '#E5E7EB',
};

// ---------------------------------------------------------------------------
// Constantes do resort
// ---------------------------------------------------------------------------
const RESORT_COORDS = { latitude: -9.0333, longitude: 13.3000 };
const GEOFENCE_RADIUS_M = 300;
const RESORT_NAME = 'Sea and Soul — Cabo Ledo';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------
type LocationStatus = 'idle' | 'checking' | 'inside' | 'outside' | 'denied';

interface WeekHistoryRow {
  id: string;
  date: string;
  weekday: string;
  entrada: string;
  saida: string;
  horas: string;
}

// ---------------------------------------------------------------------------
// Utilitários
// ---------------------------------------------------------------------------
function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

function formatTime(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

/** Calcula distância em metros entre dois pontos (Haversine) */
function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const R = 6371000; // raio da Terra em metros
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ---------------------------------------------------------------------------
// Dados de demonstração
// ---------------------------------------------------------------------------
const weekHistory: WeekHistoryRow[] = [
  { id: '1', date: '28/03', weekday: 'Sáb', entrada: '08:32', saida: '--:--', horas: '4h 23m'  },
  { id: '2', date: '27/03', weekday: 'Sex', entrada: '08:29', saida: '17:04', horas: '8h 35m'  },
  { id: '3', date: '26/03', weekday: 'Qui', entrada: '08:45', saida: '17:10', horas: '8h 25m'  },
  { id: '4', date: '25/03', weekday: 'Qua', entrada: '08:31', saida: '17:00', horas: '8h 29m'  },
  { id: '5', date: '24/03', weekday: 'Ter', entrada: '08:27', saida: '17:05', horas: '8h 38m'  },
];

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------
export default function AttendanceScreen() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle');
  const [isCheckedIn, setIsCheckedIn] = useState(true); // já está registado (demonstração)
  const [checking, setChecking] = useState(false);

  // Relógio — actualiza a cada segundo
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Verificar localização ao montar o ecrã
  useEffect(() => {
    checkLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkLocation = useCallback(async () => {
    setLocationStatus('checking');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationStatus('denied');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const dist = haversineDistance(
        pos.coords.latitude,
        pos.coords.longitude,
        RESORT_COORDS.latitude,
        RESORT_COORDS.longitude,
      );
      setLocationStatus(dist <= GEOFENCE_RADIUS_M ? 'inside' : 'outside');
    } catch {
      setLocationStatus('outside');
    }
  }, []);

  const handleAttendancePress = useCallback(async () => {
    setChecking(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permissão negada',
          'É necessário acesso à localização para registar a presença. Active a permissão nas definições.',
        );
        setChecking(false);
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const dist = haversineDistance(
        pos.coords.latitude,
        pos.coords.longitude,
        RESORT_COORDS.latitude,
        RESORT_COORDS.longitude,
      );

      if (dist > GEOFENCE_RADIUS_M) {
        Alert.alert(
          'Fora do Resort',
          `Encontra-se a ${Math.round(dist)} m do resort. Tem de estar dentro do perímetro de ${GEOFENCE_RADIUS_M} m para registar presença.`,
          [{ text: 'OK' }],
        );
        setLocationStatus('outside');
        setChecking(false);
        return;
      }

      setLocationStatus('inside');
      const action = isCheckedIn ? 'Saída' : 'Entrada';
      const now = formatTime(new Date()).slice(0, 5); // HH:MM
      Alert.alert(
        `${action} registada`,
        `${action} registada com sucesso às ${now}.\n\nLocalização: ${RESORT_NAME}`,
        [{ text: 'OK', onPress: () => setIsCheckedIn(!isCheckedIn) }],
      );
    } catch {
      Alert.alert('Erro', 'Não foi possível obter a localização. Tente novamente.');
    } finally {
      setChecking(false);
    }
  }, [isCheckedIn]);

  // -------------------------------------------------------------------
  // Sub-componentes de renderização
  // -------------------------------------------------------------------
  const renderLocationCard = () => {
    const configs: Record<LocationStatus, { icon: keyof typeof Ionicons.glyphMap; color: string; label: string }> = {
      idle:     { icon: 'location-outline',  color: colors.textSecondary, label: 'A verificar localização...'       },
      checking: { icon: 'location-outline',  color: colors.warning,       label: 'A verificar localização...'       },
      inside:   { icon: 'location',          color: colors.success,        label: `${RESORT_NAME} ✓`                 },
      outside:  { icon: 'location-outline',  color: colors.danger,         label: 'Fora do Resort'                   },
      denied:   { icon: 'close-circle',      color: colors.danger,         label: 'Permissão de localização negada'  },
    };
    const cfg = configs[locationStatus];

    return (
      <View style={[styles.locationCard, { borderLeftColor: cfg.color }]}>
        <View style={[styles.locationIconWrap, { backgroundColor: cfg.color + '18' }]}>
          {locationStatus === 'checking' ? (
            <ActivityIndicator size="small" color={cfg.color} />
          ) : (
            <Ionicons name={cfg.icon} size={20} color={cfg.color} />
          )}
        </View>
        <View style={styles.locationContent}>
          <Text style={styles.locationLabel}>Localização actual</Text>
          <Text style={[styles.locationValue, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
        <TouchableOpacity onPress={checkLocation} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="refresh" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Cabeçalho azul com relógio */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Registo de Presença</Text>
        <Text style={styles.clockDisplay}>{formatTime(currentTime)}</Text>
        <Text style={styles.clockDate}>
          {currentTime.toLocaleDateString('pt-AO', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          })}
        </Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

        {/* Localização */}
        <View style={styles.section}>
          {renderLocationCard()}
        </View>

        {/* Estado de hoje */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hoje</Text>
          <View style={styles.todayCard}>
            <View style={styles.todayRow}>
              <View style={styles.todayCell}>
                <Ionicons name="log-in-outline" size={20} color={colors.success} />
                <Text style={styles.todayCellLabel}>Entrada</Text>
                <Text style={styles.todayCellValue}>08:32</Text>
              </View>
              <View style={styles.todayDivider} />
              <View style={styles.todayCell}>
                <Ionicons name="log-out-outline" size={20} color={isCheckedIn ? colors.textSecondary : colors.orange} />
                <Text style={styles.todayCellLabel}>Saída</Text>
                <Text style={[styles.todayCellValue, isCheckedIn && styles.todayValueEmpty]}>
                  {isCheckedIn ? '--:--' : formatTime(new Date()).slice(0, 5)}
                </Text>
              </View>
              <View style={styles.todayDivider} />
              <View style={styles.todayCell}>
                <Ionicons name="time-outline" size={20} color={colors.primary} />
                <Text style={styles.todayCellLabel}>Horas</Text>
                <Text style={styles.todayCellValue}>4h 23m</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Botão principal */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[
              styles.attendanceButton,
              { backgroundColor: isCheckedIn ? colors.danger : colors.success },
              checking && styles.attendanceButtonDisabled,
            ]}
            onPress={handleAttendancePress}
            activeOpacity={0.8}
            disabled={checking}
          >
            {checking ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons
                name={isCheckedIn ? 'checkmark-circle-outline' : 'location-outline'}
                size={26}
                color="#FFFFFF"
              />
            )}
            <Text style={styles.attendanceButtonText}>
              {checking
                ? 'A processar...'
                : isCheckedIn
                ? 'Registar Saída'
                : 'Registar Entrada'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Histórico desta semana */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Histórico desta semana</Text>
          <View style={styles.historyCard}>
            {/* Cabeçalho da tabela */}
            <View style={[styles.historyRow, styles.historyHeader]}>
              <Text style={[styles.historyCell, styles.historyCellDate, styles.historyHeaderText]}>Data</Text>
              <Text style={[styles.historyCell, styles.historyCellTime, styles.historyHeaderText]}>Entrada</Text>
              <Text style={[styles.historyCell, styles.historyCellTime, styles.historyHeaderText]}>Saída</Text>
              <Text style={[styles.historyCell, styles.historyCellHours, styles.historyHeaderText]}>Horas</Text>
            </View>
            {weekHistory.map((row, index) => (
              <View
                key={row.id}
                style={[
                  styles.historyRow,
                  index < weekHistory.length - 1 && styles.historyRowBorder,
                  index === 0 && styles.historyRowToday,
                ]}
              >
                <View style={[styles.historyCell, styles.historyCellDate]}>
                  <Text style={styles.historyDateMain}>{row.date}</Text>
                  <Text style={styles.historyDateSub}>{row.weekday}</Text>
                </View>
                <Text style={[styles.historyCell, styles.historyCellTime, styles.historyValueText]}>
                  {row.entrada}
                </Text>
                <Text
                  style={[
                    styles.historyCell,
                    styles.historyCellTime,
                    styles.historyValueText,
                    row.saida === '--:--' && styles.historyValueEmpty,
                  ]}
                >
                  {row.saida}
                </Text>
                <Text style={[styles.historyCell, styles.historyCellHours, styles.historyHoursText]}>
                  {row.horas}
                </Text>
              </View>
            ))}
          </View>
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
    paddingBottom: 28,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  clockDisplay: {
    fontSize: 56,
    fontWeight: '200',
    color: '#FFFFFF',
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
  },
  clockDate: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 6,
    textTransform: 'capitalize',
  },

  // Secções
  section: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },

  // Localização
  locationCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  locationIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationContent: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  locationValue: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Card de hoje
  todayCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  todayRow: {
    flexDirection: 'row',
  },
  todayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 18,
    gap: 6,
  },
  todayDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  todayCellLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  todayCellValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  todayValueEmpty: {
    color: colors.textSecondary,
    fontWeight: '400',
  },

  // Botão de presença
  attendanceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 5,
  },
  attendanceButtonDisabled: {
    opacity: 0.65,
  },
  attendanceButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  // Histórico
  historyCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  historyHeader: {
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  historyHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  historyRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  historyRowToday: {
    backgroundColor: colors.primary + '08',
  },
  historyCell: {
    textAlign: 'center',
  },
  historyCellDate: {
    flex: 1.4,
    alignItems: 'flex-start',
    textAlign: 'left',
  },
  historyCellTime: {
    flex: 1,
  },
  historyCellHours: {
    flex: 1.2,
    textAlign: 'right',
  },
  historyDateMain: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  historyDateSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  historyValueText: {
    fontSize: 13,
    color: colors.text,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  historyValueEmpty: {
    color: colors.textSecondary,
  },
  historyHoursText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },

  bottomSpacer: {
    height: 32,
  },
});
