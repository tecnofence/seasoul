import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDate } from '../utils/format';

// Tipos
type ClientType = 'EMPRESA' | 'PARTICULAR' | 'GOVERNO';

interface Client {
  id: string;
  name: string;
  type: ClientType;
  phone: string;
  email: string;
  lastDeal: string;
  nif: string;
}

const typeBadgeColors: Record<ClientType, { bg: string; text: string }> = {
  EMPRESA: { bg: '#DBEAFE', text: '#1D4ED8' },
  PARTICULAR: { bg: '#D1FAE5', text: '#059669' },
  GOVERNO: { bg: '#FEF3C7', text: '#D97706' },
};

// Dados de demonstração
const mockClients: Client[] = [
  { id: '1', name: 'Sonangol EP', type: 'GOVERNO', phone: '+244 222 321 456', email: 'contacto@sonangol.co.ao', lastDeal: '2026-03-27', nif: '5417652340' },
  { id: '2', name: 'Banco BAI', type: 'EMPRESA', phone: '+244 222 693 200', email: 'geral@bai.ao', lastDeal: '2026-03-26', nif: '5417689012' },
  { id: '3', name: 'Unitel S.A.', type: 'EMPRESA', phone: '+244 923 001 001', email: 'empresas@unitel.co.ao', lastDeal: '2026-03-25', nif: '5417643210' },
  { id: '4', name: 'TAAG Airlines', type: 'GOVERNO', phone: '+244 222 332 348', email: 'reservas@taag.com', lastDeal: '2026-03-24', nif: '5417698765' },
  { id: '5', name: 'Maria da Silva', type: 'PARTICULAR', phone: '+244 923 456 789', email: 'maria.silva@gmail.com', lastDeal: '2026-03-20', nif: '001234567LA041' },
  { id: '6', name: 'Ensa Seguros', type: 'EMPRESA', phone: '+244 222 310 190', email: 'info@ensa.co.ao', lastDeal: '2026-03-18', nif: '5417611234' },
  { id: '7', name: 'João Santos', type: 'PARTICULAR', phone: '+244 912 345 678', email: 'joao.santos@email.com', lastDeal: '2026-03-15', nif: '002345678LA042' },
  { id: '8', name: 'Total Energies AO', type: 'EMPRESA', phone: '+244 222 670 500', email: 'angola@totalenergies.com', lastDeal: '2026-03-12', nif: '5417655678' },
];

export default function ClientsScreen() {
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const filteredClients = mockClients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.nif.includes(search),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  const renderClient = ({ item }: { item: Client }) => {
    const badge = typeBadgeColors[item.type];
    return (
      <TouchableOpacity style={styles.clientCard} activeOpacity={0.7}>
        {/* Avatar */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.name
              .split(' ')
              .slice(0, 2)
              .map((w) => w[0])
              .join('')}
          </Text>
        </View>

        {/* Informações */}
        <View style={styles.clientInfo}>
          <View style={styles.clientNameRow}>
            <Text style={styles.clientName} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={[styles.typeBadge, { backgroundColor: badge.bg }]}>
              <Text style={[styles.typeText, { color: badge.text }]}>{item.type}</Text>
            </View>
          </View>
          <View style={styles.clientDetails}>
            <View style={styles.detailRow}>
              <Ionicons name="call-outline" size={13} color={colors.textSecondary} />
              <Text style={styles.detailText}>{item.phone}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={13} color={colors.textSecondary} />
              <Text style={styles.detailText}>Último negócio: {formatDate(item.lastDeal)}</Text>
            </View>
          </View>
        </View>

        {/* Seta */}
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Barra de pesquisa */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Pesquisar clientes..."
            placeholderTextColor={colors.placeholder}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Contador */}
      <View style={styles.countContainer}>
        <Text style={styles.countText}>{filteredClients.length} clientes</Text>
      </View>

      {/* Lista de clientes */}
      <FlatList
        data={filteredClients}
        renderItem={renderClient}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyText}>Nenhum cliente encontrado</Text>
          </View>
        }
      />

      {/* FAB — Novo cliente */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.8}>
        <Ionicons name="person-add" size={24} color="#FFFFFF" />
      </TouchableOpacity>
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
  // Pesquisa
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: colors.text,
  },
  countContainer: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  countText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  // Lista
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  clientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#0A5C8A15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  clientInfo: {
    flex: 1,
  },
  clientNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  clientName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    flexShrink: 1,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  clientDetails: {
    gap: 3,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  detailText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 12,
  },
  // FAB
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
});
