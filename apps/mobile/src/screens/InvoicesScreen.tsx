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
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatKwanza, formatDate } from '../utils/format';

// Tipos
type InvoiceType = 'FT' | 'FR' | 'NC' | 'ND' | 'RC';
type InvoiceStatus = 'RASCUNHO' | 'EMITIDA' | 'PAGA' | 'ANULADA';

interface Invoice {
  id: string;
  number: string;
  type: InvoiceType;
  clientName: string;
  total: number;
  status: InvoiceStatus;
  date: string;
}

const statusColors: Record<InvoiceStatus, { bg: string; text: string }> = {
  RASCUNHO: { bg: '#F3F4F6', text: '#6B7280' },
  EMITIDA: { bg: '#DBEAFE', text: '#1D4ED8' },
  PAGA: { bg: '#D1FAE5', text: '#059669' },
  ANULADA: { bg: '#FEE2E2', text: '#DC2626' },
};

const filterChips: (InvoiceType | 'TODOS')[] = ['TODOS', 'FT', 'FR', 'NC', 'ND', 'RC'];

// Dados de demonstração
const mockInvoices: Invoice[] = [
  { id: '1', number: 'FT 2026/0142', type: 'FT', clientName: 'Sonangol EP', total: 3250000, status: 'EMITIDA', date: '2026-03-27' },
  { id: '2', number: 'FT 2026/0141', type: 'FT', clientName: 'Banco BAI', total: 2500000, status: 'PAGA', date: '2026-03-26' },
  { id: '3', number: 'FR 2026/0023', type: 'FR', clientName: 'Unitel S.A.', total: 890000, status: 'RASCUNHO', date: '2026-03-26' },
  { id: '4', number: 'NC 2026/0005', type: 'NC', clientName: 'TAAG Airlines', total: 450000, status: 'EMITIDA', date: '2026-03-25' },
  { id: '5', number: 'FT 2026/0140', type: 'FT', clientName: 'Odebrecht Angola', total: 7800000, status: 'PAGA', date: '2026-03-24' },
  { id: '6', number: 'FT 2026/0139', type: 'FT', clientName: 'Ensa Seguros', total: 1200000, status: 'ANULADA', date: '2026-03-23' },
  { id: '7', number: 'FR 2026/0022', type: 'FR', clientName: 'Total Energies AO', total: 5600000, status: 'EMITIDA', date: '2026-03-22' },
  { id: '8', number: 'FT 2026/0138', type: 'FT', clientName: 'Caixa Angola', total: 980000, status: 'PAGA', date: '2026-03-21' },
];

export default function InvoicesScreen() {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<InvoiceType | 'TODOS'>('TODOS');
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const filteredInvoices = mockInvoices.filter((inv) => {
    const matchesSearch =
      inv.number.toLowerCase().includes(search.toLowerCase()) ||
      inv.clientName.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = activeFilter === 'TODOS' || inv.type === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  const onEndReached = useCallback(() => {
    if (loadingMore) return;
    setLoadingMore(true);
    // Simular carregamento de mais dados
    setTimeout(() => setLoadingMore(false), 1000);
  }, [loadingMore]);

  const renderInvoice = ({ item }: { item: Invoice }) => {
    const statusStyle = statusColors[item.status];
    return (
      <TouchableOpacity style={styles.invoiceCard} activeOpacity={0.7}>
        <View style={styles.invoiceHeader}>
          <View style={styles.invoiceNumberContainer}>
            <Text style={styles.invoiceNumber}>{item.number}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
              <Text style={[styles.statusText, { color: statusStyle.text }]}>{item.status}</Text>
            </View>
          </View>
          <Text style={styles.invoiceTotal}>{formatKwanza(item.total)}</Text>
        </View>
        <View style={styles.invoiceFooter}>
          <Text style={styles.clientName}>{item.clientName}</Text>
          <Text style={styles.invoiceDate}>{formatDate(item.date)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
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
            placeholder="Pesquisar faturas..."
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

      {/* Filtros */}
      <View style={styles.filterContainer}>
        <FlatList
          data={filterChips}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterChip, activeFilter === item && styles.filterChipActive]}
              onPress={() => setActiveFilter(item)}
            >
              <Text style={[styles.filterText, activeFilter === item && styles.filterTextActive]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Lista de faturas */}
      <FlatList
        data={filteredInvoices}
        renderItem={renderInvoice}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyText}>Nenhuma fatura encontrada</Text>
          </View>
        }
      />

      {/* FAB — Nova fatura */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.8}>
        <Ionicons name="add" size={28} color="#FFFFFF" />
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
  // Filtros
  filterContainer: {
    paddingBottom: 8,
  },
  filterList: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  // Lista
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  invoiceCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  invoiceNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  invoiceNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  invoiceTotal: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  invoiceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clientName: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  invoiceDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: 'center',
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
