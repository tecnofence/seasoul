import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Tipos
type IncidentType = 'MANUTENCAO' | 'SEGURANCA' | 'AMBIENTAL' | 'OPERACIONAL' | 'OUTRO';
type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

interface IncidentTypeOption {
  value: IncidentType;
  label: string;
}

interface SeverityOption {
  value: Severity;
  label: string;
  color: string;
  bgColor: string;
}

const incidentTypes: IncidentTypeOption[] = [
  { value: 'MANUTENCAO', label: 'Manutenção' },
  { value: 'SEGURANCA', label: 'Segurança' },
  { value: 'AMBIENTAL', label: 'Ambiental' },
  { value: 'OPERACIONAL', label: 'Operacional' },
  { value: 'OUTRO', label: 'Outro' },
];

const severityOptions: SeverityOption[] = [
  { value: 'LOW', label: 'Baixa', color: '#059669', bgColor: '#D1FAE5' },
  { value: 'MEDIUM', label: 'Média', color: '#D97706', bgColor: '#FEF3C7' },
  { value: 'HIGH', label: 'Alta', color: '#EA580C', bgColor: '#FFEDD5' },
  { value: 'CRITICAL', label: 'Crítica', color: '#DC2626', bgColor: '#FEE2E2' },
];

export default function IncidentReportScreen() {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<IncidentType | null>(null);
  const [severity, setSeverity] = useState<Severity | null>(null);
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const selectedType = incidentTypes.find((t) => t.value === type);

  const handleAddPhoto = () => {
    // Placeholder — integraria com expo-image-picker
    Alert.alert(
      'Adicionar Foto',
      'A funcionalidade de câmara será integrada com expo-image-picker.',
      [{ text: 'OK' }],
    );
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Erro', 'O título é obrigatório.');
      return;
    }
    if (!type) {
      Alert.alert('Erro', 'Selecione o tipo de incidente.');
      return;
    }
    if (!severity) {
      Alert.alert('Erro', 'Selecione a gravidade do incidente.');
      return;
    }

    setSubmitting(true);
    try {
      // Simular envio
      await new Promise((resolve) => setTimeout(resolve, 1500));
      Alert.alert('Sucesso', 'Incidente registado com sucesso.', [
        {
          text: 'OK',
          onPress: () => {
            // Limpar formulário
            setTitle('');
            setType(null);
            setSeverity(null);
            setLocation('');
            setDescription('');
            setPhotos([]);
          },
        },
      ]);
    } catch {
      Alert.alert('Erro', 'Não foi possível registar o incidente. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Título */}
        <Text style={styles.label}>Título *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Fuga de água no Bloco B"
          placeholderTextColor={colors.placeholder}
          value={title}
          onChangeText={setTitle}
        />

        {/* Tipo de incidente */}
        <Text style={styles.label}>Tipo de Incidente *</Text>
        <TouchableOpacity
          style={styles.picker}
          onPress={() => setShowTypePicker(!showTypePicker)}
          activeOpacity={0.7}
        >
          <Text style={[styles.pickerText, !selectedType && styles.pickerPlaceholder]}>
            {selectedType ? selectedType.label : 'Selecionar tipo...'}
          </Text>
          <Ionicons
            name={showTypePicker ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
        {showTypePicker && (
          <View style={styles.pickerDropdown}>
            {incidentTypes.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[styles.pickerOption, type === option.value && styles.pickerOptionActive]}
                onPress={() => {
                  setType(option.value);
                  setShowTypePicker(false);
                }}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    type === option.value && styles.pickerOptionTextActive,
                  ]}
                >
                  {option.label}
                </Text>
                {type === option.value && (
                  <Ionicons name="checkmark" size={18} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Gravidade */}
        <Text style={styles.label}>Gravidade *</Text>
        <View style={styles.severityContainer}>
          {severityOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.severityChip,
                { borderColor: option.color + '40' },
                severity === option.value && { backgroundColor: option.bgColor, borderColor: option.color },
              ]}
              onPress={() => setSeverity(option.value)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.severityDot,
                  { backgroundColor: option.color },
                ]}
              />
              <Text
                style={[
                  styles.severityText,
                  { color: severity === option.value ? option.color : colors.textSecondary },
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Localização */}
        <Text style={styles.label}>Localização</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Edifício A, Piso 2, Sala 204"
          placeholderTextColor={colors.placeholder}
          value={location}
          onChangeText={setLocation}
        />

        {/* Descrição */}
        <Text style={styles.label}>Descrição</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Descreva o incidente em detalhe..."
          placeholderTextColor={colors.placeholder}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />

        {/* Fotos */}
        <Text style={styles.label}>Fotos</Text>
        <View style={styles.photosContainer}>
          <TouchableOpacity style={styles.addPhotoButton} onPress={handleAddPhoto} activeOpacity={0.7}>
            <Ionicons name="camera-outline" size={28} color={colors.primary} />
            <Text style={styles.addPhotoText}>Adicionar Foto</Text>
          </TouchableOpacity>
          {photos.map((_, index) => (
            <View key={index} style={styles.photoThumb}>
              <Ionicons name="image" size={24} color={colors.textSecondary} />
            </View>
          ))}
        </View>

        {/* Botão submeter */}
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="send" size={20} color="#FFFFFF" style={styles.submitIcon} />
              <Text style={styles.submitText}>Registar Incidente</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const colors = {
  primary: '#0A5C8A',
  background: '#F9FAFB',
  text: '#111827',
  textSecondary: '#6B7280',
  placeholder: '#9CA3AF',
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
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
    marginTop: 16,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.cardBg,
  },
  textArea: {
    height: 120,
    paddingTop: 14,
  },
  // Picker
  picker: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 16,
    backgroundColor: colors.cardBg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerText: {
    fontSize: 15,
    color: colors.text,
  },
  pickerPlaceholder: {
    color: colors.placeholder,
  },
  pickerDropdown: {
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    marginTop: 4,
    overflow: 'hidden',
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerOptionActive: {
    backgroundColor: '#0A5C8A08',
  },
  pickerOptionText: {
    fontSize: 15,
    color: colors.text,
  },
  pickerOptionTextActive: {
    fontWeight: '600',
    color: colors.primary,
  },
  // Gravidade
  severityContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  severityChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    backgroundColor: colors.cardBg,
    gap: 5,
  },
  severityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  severityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Fotos
  photosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  addPhotoButton: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary + '40',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardBg,
  },
  addPhotoText: {
    fontSize: 11,
    color: colors.primary,
    marginTop: 4,
    fontWeight: '500',
  },
  photoThumb: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Submeter
  submitButton: {
    flexDirection: 'row',
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitIcon: {
    marginRight: 8,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
