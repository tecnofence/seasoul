import React, { useState } from 'react';
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
};

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------
type Category = 'Refeições' | 'Bebidas' | 'Snacks' | 'Outros';

interface MenuItem {
  id: string;
  name: string;
  price: number | null; // null = Gratuito
  category: Category;
  icon: keyof typeof Ionicons.glyphMap;
}

interface CartItem {
  item: MenuItem;
  quantity: number;
}

// ---------------------------------------------------------------------------
// Utilitários
// ---------------------------------------------------------------------------
function formatPrice(price: number | null): string {
  if (price === null) return 'Gratuito';
  return price.toLocaleString('pt-PT').replace(/\s/g, '.') + ' KZ';
}

// Garante separador de milhar com ponto (pt-PT usa espaço, substituímos)
function formatPriceStrict(price: number): string {
  const parts = price.toString().split('');
  const result: string[] = [];
  parts.reverse().forEach((d, i) => {
    if (i > 0 && i % 3 === 0) result.push('.');
    result.push(d);
  });
  return result.reverse().join('') + ' KZ';
}

function priceDisplay(price: number | null): string {
  if (price === null) return 'Gratuito';
  return formatPriceStrict(price);
}

// ---------------------------------------------------------------------------
// Dados mock
// ---------------------------------------------------------------------------
const CATEGORIES: Category[] = ['Refeições', 'Bebidas', 'Snacks', 'Outros'];

const MENU_ITEMS: MenuItem[] = [
  // Refeições
  { id: 'r1', name: 'Peixe Grelhado', price: 5500, category: 'Refeições', icon: 'fish' },
  { id: 'r2', name: 'Muamba de Galinha', price: 4500, category: 'Refeições', icon: 'flame' },
  { id: 'r3', name: 'Bife com Batatas', price: 6000, category: 'Refeições', icon: 'restaurant' },
  { id: 'r4', name: 'Calulu de Peixe', price: 4800, category: 'Refeições', icon: 'fish' },
  // Bebidas
  { id: 'b1', name: 'Cerveja Cuca', price: 800, category: 'Bebidas', icon: 'beer' },
  { id: 'b2', name: 'Sumo Natural', price: 1200, category: 'Bebidas', icon: 'nutrition' },
  { id: 'b3', name: 'Água Mineral', price: 300, category: 'Bebidas', icon: 'water' },
  { id: 'b4', name: 'Caipirinha', price: 2500, category: 'Bebidas', icon: 'wine' },
  // Snacks
  { id: 's1', name: 'Batatas Fritas', price: 1200, category: 'Snacks', icon: 'fast-food' },
  { id: 's2', name: 'Fruta da Época', price: 900, category: 'Snacks', icon: 'leaf' },
  // Outros
  { id: 'o1', name: 'Toalhas Extra', price: null, category: 'Outros', icon: 'layers' },
  { id: 'o2', name: 'Almofada Extra', price: null, category: 'Outros', icon: 'bed' },
];

// ---------------------------------------------------------------------------
// Ecrã principal
// ---------------------------------------------------------------------------
export default function RoomServiceScreen() {
  const [activeCategory, setActiveCategory] = useState<Category>('Refeições');
  const [cart, setCart] = useState<Record<string, CartItem>>({});

  const filteredItems = MENU_ITEMS.filter((m) => m.category === activeCategory);

  const cartCount = Object.values(cart).reduce((sum, c) => sum + c.quantity, 0);
  const cartTotal = Object.values(cart).reduce(
    (sum, c) => sum + (c.item.price ?? 0) * c.quantity,
    0,
  );

  function getQuantity(id: string): number {
    return cart[id]?.quantity ?? 0;
  }

  function increment(item: MenuItem) {
    setCart((prev) => ({
      ...prev,
      [item.id]: { item, quantity: (prev[item.id]?.quantity ?? 0) + 1 },
    }));
  }

  function decrement(item: MenuItem) {
    setCart((prev) => {
      const current = prev[item.id]?.quantity ?? 0;
      if (current <= 1) {
        const next = { ...prev };
        delete next[item.id];
        return next;
      }
      return { ...prev, [item.id]: { item, quantity: current - 1 } };
    });
  }

  function handleCheckout() {
    if (cartCount === 0) {
      Alert.alert('Carrinho vazio', 'Adicione itens ao carrinho antes de encomendar.');
      return;
    }
    Alert.alert(
      'Confirmar Encomenda',
      `Total: ${priceDisplay(cartTotal)}\n\nO seu pedido será entregue no Quarto 201.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: () => {
            setCart({});
            Alert.alert('Pedido enviado!', 'O seu pedido foi registado e está a ser preparado.');
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Serviço de Quarto</Text>
        <Text style={styles.headerSub}>Quarto 201</Text>
      </View>

      {/* Category Tabs */}
      <View style={styles.tabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsRow}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.tab, activeCategory === cat && styles.tabActive]}
              onPress={() => setActiveCategory(cat)}
              activeOpacity={0.75}
            >
              <Text style={[styles.tabText, activeCategory === cat && styles.tabTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Menu Items */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredItems.map((item) => {
          const qty = getQuantity(item.id);
          const isFree = item.price === null;

          return (
            <View key={item.id} style={styles.itemCard}>
              <View style={[styles.itemIconWrap, { backgroundColor: COLORS.primaryLight }]}>
                <Ionicons name={item.icon} size={26} color={COLORS.primary} />
              </View>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={[styles.itemPrice, isFree && styles.itemPriceFree]}>
                  {priceDisplay(item.price)}
                </Text>
              </View>
              <View style={styles.qtyControls}>
                {qty > 0 ? (
                  <>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => decrement(item)}
                      activeOpacity={0.75}
                    >
                      <Ionicons name="remove" size={18} color={COLORS.primary} />
                    </TouchableOpacity>
                    <Text style={styles.qtyValue}>{qty}</Text>
                  </>
                ) : null}
                <TouchableOpacity
                  style={[styles.qtyBtn, styles.qtyBtnAdd]}
                  onPress={() => increment(item)}
                  activeOpacity={0.75}
                >
                  <Ionicons name="add" size={18} color={COLORS.white} />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {/* Espaço para o botão flutuante */}
        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Floating Cart Button */}
      <TouchableOpacity
        style={[styles.cartButton, cartCount === 0 && styles.cartButtonEmpty]}
        onPress={handleCheckout}
        activeOpacity={0.85}
      >
        <View style={styles.cartLeft}>
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>{cartCount}</Text>
          </View>
          <Text style={styles.cartButtonText}>Ver Encomenda</Text>
        </View>
        <Text style={styles.cartTotal}>{priceDisplay(cartTotal)}</Text>
      </TouchableOpacity>
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
  // ---------- Category Tabs ----------
  tabsWrapper: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.white,
  },
  // ---------- Scroll ----------
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  // ---------- Item Card ----------
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    marginBottom: 10,
  },
  itemIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 3,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
  },
  itemPriceFree: {
    color: COLORS.accent,
  },
  // ---------- Quantity Controls ----------
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },
  qtyBtnAdd: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  qtyValue: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    minWidth: 20,
    textAlign: 'center',
  },
  // ---------- Cart Button ----------
  cartButton: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  cartButtonEmpty: {
    backgroundColor: COLORS.textMuted,
    shadowOpacity: 0,
  },
  cartLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cartBadge: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  cartButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
  cartTotal: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '800',
  },
});
