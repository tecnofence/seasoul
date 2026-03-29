import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  SafeAreaView,
  Switch,
  ActivityIndicator,
  StatusBar,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import api from '../../services/api'

// ---------------------------------------------------------------------------
// Cores
// ---------------------------------------------------------------------------
const TRAINING_COLOR = '#F59E0B'
const TRAINING_BG = '#FFFBEB'

const colors = {
  primary: '#1A3E6E',
  background: '#F9FAFB',
  success: '#059669',
  danger: '#DC2626',
  text: '#111827',
  textSecondary: '#6B7280',
  cardBg: '#FFFFFF',
  border: '#E5E7EB',
  training: TRAINING_COLOR,
  trainingBg: TRAINING_BG,
  trainingBorder: '#FDE68A',
  trainingDark: '#B45309',
}

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------
interface Exercise {
  id: string
  title: string
  description: string
  icon: keyof typeof Ionicons.glyphMap
  completed: boolean
}

const INITIAL_EXERCISES: Exercise[] = [
  {
    id: '1',
    title: 'Simular Venda POS',
    description: 'Percorra o fluxo completo de uma venda no ponto de venda, desde a seleção de artigos até ao pagamento.',
    icon: 'cart-outline',
    completed: false,
  },
  {
    id: '2',
    title: 'Emitir Fatura de Treino',
    description: 'Emita uma fatura com a série TREINO. A fatura não é enviada à AGT e não tem validade fiscal.',
    icon: 'document-text-outline',
    completed: false,
  },
  {
    id: '3',
    title: 'Registar Check-in',
    description: 'Pratique o processo completo de check-in de um hóspede, incluindo verificação de documentos e atribuição de quarto.',
    icon: 'log-in-outline',
    completed: false,
  },
  {
    id: '4',
    title: 'Registo de Ponto',
    description: 'Pratique o registo de entrada e saída com verificação de geolocalização no perímetro do resort.',
    icon: 'location-outline',
    completed: false,
  },
]

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------
export default function TrainingModeScreen() {
  const [isTrainingActive, setIsTrainingActive] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [exercises, setExercises] = useState<Exercise[]>(INITIAL_EXERCISES)

  const completedCount = exercises.filter((e) => e.completed).length
  const totalCount = exercises.length

  // -------------------------------------------------------------------------
  // Activar / desactivar modo formação
  // -------------------------------------------------------------------------
  const handleToggleTraining = async (value: boolean) => {
    setToggling(true)
    try {
      if (value) {
        await api.post('/training-mode/activate')
        setIsTrainingActive(true)
        Alert.alert(
          'Modo Formação Ativado',
          'Pode agora praticar as operações sem afetar dados reais. Todas as faturas usarão a série TREINO.',
          [{ text: 'Compreendido' }],
        )
      } else {
        await api.post('/training-mode/deactivate')
        setIsTrainingActive(false)
        Alert.alert(
          'Modo Formação Desativado',
          'Regressou ao modo de operação normal.',
          [{ text: 'OK' }],
        )
      }
    } catch {
      // Fallback local se API não responder
      setIsTrainingActive(value)
    } finally {
      setToggling(false)
    }
  }

  // -------------------------------------------------------------------------
  // Marcar exercício como completo
  // -------------------------------------------------------------------------
  const handleExercisePress = (exercise: Exercise) => {
    if (!isTrainingActive) {
      Alert.alert(
        'Modo Formação Inativo',
        'Ative o Modo Formação antes de iniciar os exercícios.',
        [{ text: 'OK' }],
      )
      return
    }

    Alert.alert(
      exercise.title,
      exercise.description + '\n\nMarcar este exercício como concluído?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Marcar como Concluído',
          onPress: () => {
            setExercises((prev) =>
              prev.map((e) =>
                e.id === exercise.id ? { ...e, completed: true } : e,
              ),
            )
          },
        },
      ],
    )
  }

  // -------------------------------------------------------------------------
  // Sair do modo formação
  // -------------------------------------------------------------------------
  const handleExit = () => {
    if (!isTrainingActive) return

    Alert.alert(
      'Sair do Modo Formação',
      'Tem a certeza que pretende sair do Modo Formação? O progresso dos exercícios será reiniciado.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            setToggling(true)
            try {
              await api.post('/training-mode/deactivate')
            } catch {
              // Continuar mesmo se API falhar
            } finally {
              setToggling(false)
            }
            setIsTrainingActive(false)
            setExercises(INITIAL_EXERCISES)
          },
        },
      ],
    )
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Cabeçalho azul */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Modo Formação</Text>
        <Text style={styles.headerSubtitle}>Pratique sem afetar dados reais</Text>
      </View>

      {/* Banner de aviso — só visível quando ativo */}
      {isTrainingActive && (
        <View style={styles.warningBanner}>
          <Ionicons name="warning-outline" size={20} color={colors.trainingDark} />
          <View style={styles.warningTextBlock}>
            <Text style={styles.warningTitle}>MODO FORMAÇÃO ATIVO</Text>
            <Text style={styles.warningSubtitle}>
              Todas as faturas geradas neste modo usam a série TREINO e não são enviadas à AGT.
            </Text>
          </View>
        </View>
      )}

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

        {/* ---------------------------------------------------------------- */}
        {/* Toggle de ativação                                                */}
        {/* ---------------------------------------------------------------- */}
        <View style={styles.section}>
          <View style={[
            styles.toggleCard,
            isTrainingActive && styles.toggleCardActive,
          ]}>
            <View style={styles.toggleLeft}>
              <View style={[
                styles.toggleIconWrap,
                { backgroundColor: isTrainingActive ? TRAINING_COLOR + '22' : colors.border },
              ]}>
                <Ionicons
                  name="school-outline"
                  size={22}
                  color={isTrainingActive ? TRAINING_COLOR : colors.textSecondary}
                />
              </View>
              <View style={styles.toggleTextBlock}>
                <Text style={styles.toggleLabel}>Modo Formação</Text>
                <Text style={styles.toggleStatus}>
                  {isTrainingActive ? 'Ativo — dados de treino' : 'Inativo — modo normal'}
                </Text>
              </View>
            </View>
            {toggling ? (
              <ActivityIndicator size="small" color={TRAINING_COLOR} />
            ) : (
              <Switch
                value={isTrainingActive}
                onValueChange={handleToggleTraining}
                trackColor={{ false: colors.border, true: TRAINING_COLOR + '80' }}
                thumbColor={isTrainingActive ? TRAINING_COLOR : '#D1D5DB'}
              />
            )}
          </View>
        </View>

        {/* ---------------------------------------------------------------- */}
        {/* Progresso                                                         */}
        {/* ---------------------------------------------------------------- */}
        <View style={styles.section}>
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Ionicons name="trophy-outline" size={18} color={TRAINING_COLOR} />
              <Text style={styles.progressTitle}>Exercícios Completos</Text>
              <Text style={styles.progressCount}>
                {completedCount}/{totalCount}
              </Text>
            </View>
            {/* Barra de progresso */}
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${(completedCount / totalCount) * 100}%` },
                ]}
              />
            </View>
            {completedCount === totalCount && (
              <View style={styles.allDoneRow}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text style={styles.allDoneText}>Todos os exercícios concluídos!</Text>
              </View>
            )}
          </View>
        </View>

        {/* ---------------------------------------------------------------- */}
        {/* Exercícios de formação                                            */}
        {/* ---------------------------------------------------------------- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Exercícios de Formação</Text>

          {exercises.map((exercise, index) => {
            const isLast = index === exercises.length - 1
            return (
              <TouchableOpacity
                key={exercise.id}
                style={[
                  styles.exerciseCard,
                  !isLast && styles.exerciseCardBorder,
                  exercise.completed && styles.exerciseCardCompleted,
                ]}
                onPress={() => handleExercisePress(exercise)}
                activeOpacity={0.75}
              >
                <View style={[
                  styles.exerciseIconWrap,
                  {
                    backgroundColor: exercise.completed
                      ? colors.success + '18'
                      : isTrainingActive
                      ? TRAINING_COLOR + '18'
                      : colors.border,
                  },
                ]}>
                  <Ionicons
                    name={exercise.completed ? 'checkmark-circle' : exercise.icon}
                    size={22}
                    color={exercise.completed ? colors.success : isTrainingActive ? TRAINING_COLOR : colors.textSecondary}
                  />
                </View>
                <View style={styles.exerciseContent}>
                  <Text style={[
                    styles.exerciseTitle,
                    exercise.completed && styles.exerciseTitleCompleted,
                  ]}>
                    {exercise.title}
                  </Text>
                  <Text style={styles.exerciseDescription} numberOfLines={2}>
                    {exercise.description}
                  </Text>
                </View>
                {exercise.completed ? (
                  <View style={styles.completedBadge}>
                    <Text style={styles.completedBadgeText}>OK</Text>
                  </View>
                ) : (
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={isTrainingActive ? TRAINING_COLOR : colors.border}
                  />
                )}
              </TouchableOpacity>
            )
          })}
        </View>

        {/* ---------------------------------------------------------------- */}
        {/* Nota informativa                                                  */}
        {/* ---------------------------------------------------------------- */}
        <View style={styles.section}>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
            <Text style={styles.infoText}>
              Os dados criados durante o Modo Formação são marcados com a série{' '}
              <Text style={styles.infoTextBold}>TREINO</Text> e não têm validade fiscal
              nem operacional. Podem ser eliminados a qualquer momento pelo administrador.
            </Text>
          </View>
        </View>

        {/* ---------------------------------------------------------------- */}
        {/* Botão de saída                                                    */}
        {/* ---------------------------------------------------------------- */}
        {isTrainingActive && (
          <View style={styles.exitSection}>
            <TouchableOpacity
              style={[styles.exitButton, toggling && styles.exitButtonDisabled]}
              onPress={handleExit}
              activeOpacity={0.8}
              disabled={toggling}
            >
              {toggling ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="exit-outline" size={20} color="#FFFFFF" />
              )}
              <Text style={styles.exitButtonText}>SAIR DO MODO FORMAÇÃO</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  )
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
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },

  // Banner de aviso
  warningBanner: {
    backgroundColor: TRAINING_BG,
    borderBottomWidth: 2,
    borderBottomColor: '#FDE68A',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  warningTextBlock: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.trainingDark,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  warningSubtitle: {
    fontSize: 12,
    color: colors.trainingDark,
    lineHeight: 17,
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

  // Toggle card
  toggleCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  toggleCardActive: {
    borderColor: TRAINING_COLOR + '60',
    backgroundColor: TRAINING_BG,
  },
  toggleLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toggleIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleTextBlock: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  toggleStatus: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  // Progresso
  progressCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  progressTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  progressCount: {
    fontSize: 15,
    fontWeight: '700',
    color: TRAINING_COLOR,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#FDE68A',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: TRAINING_COLOR,
    borderRadius: 4,
  },
  allDoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  allDoneText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.success,
  },

  // Exercícios
  exerciseCard: {
    backgroundColor: colors.cardBg,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 0,
  },
  exerciseCardBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  exerciseCardCompleted: {
    backgroundColor: colors.success + '06',
  },
  exerciseIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseContent: {
    flex: 1,
  },
  exerciseTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 3,
  },
  exerciseTitleCompleted: {
    color: colors.success,
  },
  exerciseDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  completedBadge: {
    backgroundColor: colors.success,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  completedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Exercícios — card container com cantos arredondados
  // (os exercícios são agrupados num único cartão com overflow hidden)
  exercisesContainer: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },

  // Info card
  infoCard: {
    backgroundColor: colors.primary + '08',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary + '20',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: colors.primary,
    lineHeight: 18,
  },
  infoTextBold: {
    fontWeight: '700',
  },

  // Botão de saída
  exitSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  exitButton: {
    backgroundColor: colors.danger,
    borderRadius: 14,
    paddingVertical: 18,
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
  exitButtonDisabled: {
    opacity: 0.65,
  },
  exitButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },

  bottomSpacer: {
    height: 40,
  },
})
