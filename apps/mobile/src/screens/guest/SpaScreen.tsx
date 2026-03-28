import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Alert,
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
  spa: '#8B5CF6',
  spaLight: '#EDE9FE',
  activities: '#0369A1',
  activitiesLight: '#DBEAFE',
  free: '#10B981',
  freeLight: '#D1FAE5',
};

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------
interface Treatment {
  id: string;
  name: string;
  duration: string;
  price: number;
  icon: keyof typeof Ionicons.glyphMap;
}

interface Activity {
  id: string;
  name: string;
  duration: string;
  price: number | null; // null = Incluído
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bgColor: string;
}

// ---------------------------------------------------------------------------
// Utilitários
// ---------------------------------------------------------------------------
function formatPrice(price: number | null, freeLabel = 'Incluído'): string {
  if (price === null) return freeLabel;
  const parts = price.toString().split('');
  const result: string[] = [];
  parts.reverse().forEach((d, i) => {
    if (i > 0 && i % 3 === 0) result.push('.');
    result.push(d);
  });
  return result.reverse().join('') + ' KZ';
}

// ---------------------------------------------------------------------------
// Dados mock
// ---------------------------------------------------------------------------
const SPA_TREATMENTS: Treatment[] = [
  { id: 't1', name: 'Massagem Relaxante', duration: '60 min', price: 15000, icon: 'sparkles' },
  { id: 't2', name: 'Massagem Desportiva', duration: '45 min', price: 12000, icon: 'fitness' },
  { id: 't3', name: 'Tratamento Facial', duration: '45 min', price: 10000, icon: 'happy' },
];

const ACTIVITIES: Activity[] = [
  {
    id: 'a1',
    name: 'Aula de Surf',
    duration: '1 hora',
    price: 8000,
    icon: 'water',
    color: COLORS.primary,
    bgColor: COLORS.primaryLight,
  },
  {
    id: 'a2',
    name: 'Aluguer Kayak',
    duration: '1 hora',
    price: 5000,
    icon: 'boat',
    color: '#0369A1',
    bgColor: '#DBEAFE',
  },
  {
    id: 'a3',
    name: 'Passeio de Barco',
    duration: '2 horas',
    price: 20000,
    icon: 'compass',
    color: '#7C3AED',
    bgColor: '#EDE9FE',
  },
  {
    id: 'a4',
    name: 'Visita à Praia de Cabo Ledo',
    duration: 'Dia inteiro',
    price: null,
    icon: 'map',
    color: COLORS.accent,
    bgColor: COLORS.accentLight,
  },
];

// ---------------------------------------------------------------------------
// Diálogo de reserva simplificado
// ---------------------------------------------------------------------------
function confirmBooking(name: string) {
  Alert.alert(
    'Confirmar Reserva',
    `Deseja reservar "${name}"?\n\nUm membro da equipa irá confirmar a disponibilidade e entrar em contacto para agendar a data e hora.`,
    [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Reservar',
        onPress: () =>
          Alert.alert(
            'Pedido enviado!',
            'A sua reserva foi registada. Entraremos em contacto em breve para confirmar.',
          ),
      },
    ],
  );
}

// ---------------------------------------------------------------------------
// Sub-componentes
// ---------------------------------------------------------------------------
function TreatmentCard({ treatment }: { treatment: Treatment }) {
  return (
    <View style={styles.treatmentCard}>
      <View style={styles.treatmentIconWrap}>
        <Ionicons name={treatment.icon} size={28} color={COLORS.spa} />
      </View>
      <View style={styles.treatmentInfo}>
        <Text style={styles.treatmentName}>{treatment.name}</Text>
        <View style={styles.treatmentMeta}>
          <Ionicons name="time-outline" size={13} color={COLORS.textMuted} style={{ marginRight: 3 }} />
          <Text style={styles.treatmentDuration}>{treatment.duration}</Text>
        </View>
        <Text style={styles.treatmentPrice}>{formatPrice(treatment.price)}</Text>
      </View>
      <TouchableOpacity
        style={styles.bookBtn}
        onPress={() => confirmBooking(treatment.name)}
        activeOpacity={0.8}
      >
        <Text style={styles.bookBtnText}>Reservar</Text>
      </TouchableOpacity>
    </View>
  );
}

function ActivityCard({ activity }: { activity: Activity }) {
  const isFree = activity.price === null;
  return (
    <View style={styles.activityCard}>
      <View style={[styles.activityIconWrap, { backgroundColor: activity.bgColor }]}>
        <Ionicons name={activity.icon} size={26} color={activity.color} />
      </View>
      <View style={styles.activityInfo}>
        <Text style={styles.activityName}>{activity.name}</Text>
        <View style={styles.activityMeta}>
          <Ionicons name="time-outline" size={13} color={COLORS.textMuted} style={{ marginRight: 3 }} />
          <Text style={styles.activityDuration}>{activity.duration}</Text>
        </View>
        <Text style={[styles.activityPrice, isFree && styles.activityPriceFree]}>
          {formatPrice(activity.price)}
        </Text>
      </View>
      <TouchableOpacity
        style={[styles.bookBtn, isFree && styles.bookBtnFree]}
        onPress={() => confirmBooking(activity.name)}
        activeOpacity={0.8}
      >
        <Text style={[styles.bookBtnText, isFree && styles.bookBtnTextFree]}>
          {isFree ? 'Aderir' : 'Reservar'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Ecrã principal
// ---------------------------------------------------------------------------
export default function SpaScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Spa & Atividades</Text>
        <Text style={styles.headerSub}>Sea and Soul — Cabo Ledo</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Secção Spa */}
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIconWrap, { backgroundColor: COLORS.spaLight }]}>
            <Ionicons name="sparkles" size={18} color={COLORS.spa} />
          </View>
          <View>
            <Text style={styles.sectionTitle}>Spa</Text>
            <Text style={styles.sectionSub}>Tratamentos exclusivos</Text>
          </View>
        </View>

        <View style={styles.cardList}>
          {SPA_TREATMENTS.map((t) => (
            <TreatmentCard key={t.id} treatment={t} />
          ))}
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Secção Atividades */}
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIconWrap, { backgroundColor: COLORS.activitiesLight }]}>
            <Ionicons name="bicycle" size={18} color={COLORS.activities} />
          </View>
          <View>
            <Text style={styles.sectionTitle}>Atividades</Text>
            <Text style={styles.sectionSub}>Aventura e desporto aquático</Text>
          </View>
        </View>

        <View style={styles.cardList}>
          {ACTIVITIES.map((a) => (
            <ActivityCard key={a.id} activity={a} />
          ))}
        </View>

        {/* Nota de rodapé */}
        <View style={styles.footerNote}>
          <Ionicons name="information-circle-outline" size={16} color={COLORS.textMuted} style={{ marginRight: 6 }} />
          <Text style={styles.footerNoteText}>
            As reservas estão sujeitas a disponibilidade. Para informações, contacte a recepção.
          </Text>
        </View>
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
  headerSub: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    marginTop: 2,
  },
  // ---------- Scroll ----------
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  // ---------- Section Header ----------
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    marginTop: 4,
    gap: 12,
  },
  sectionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
  },
  sectionSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  // ---------- Card List ----------
  cardList: {
    gap: 10,
  },
  // ---------- Treatment Card ----------
  treatmentCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 2,
  },
  treatmentIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: COLORS.spaLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  treatmentInfo: {
    flex: 1,
  },
  treatmentName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 3,
  },
  treatmentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  treatmentDuration: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  treatmentPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.spa,
  },
  // ---------- Activity Card ----------
  activityCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 2,
  },
  activityIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 3,
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  activityDuration: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  activityPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
  },
  activityPriceFree: {
    color: COLORS.accent,
  },
  // ---------- Book Button ----------
  bookBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  bookBtnFree: {
    backgroundColor: COLORS.accentLight,
  },
  bookBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },
  bookBtnTextFree: {
    color: COLORS.accent,
  },
  // ---------- Divider ----------
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 20,
  },
  // ---------- Footer Note ----------
  footerNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    marginTop: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  footerNoteText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
});
