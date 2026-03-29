import React, { useState, useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { getToken, getUserInfo, removeToken, removeUserInfo, setOnUnauthorized, type UserInfo } from '../services/api';

// Auth
import LoginScreen from '../screens/LoginScreen';

// Guest screens
import MyStayScreen from '../screens/guest/MyStayScreen';
import RoomServiceScreen from '../screens/guest/RoomServiceScreen';
import ActivitiesScreen from '../screens/guest/ActivitiesScreen';
import ChatScreen from '../screens/guest/ChatScreen';
import GuestProfileScreen from '../screens/guest/GuestProfileScreen';
import SpaScreen from '../screens/guest/SpaScreen';
import GuestNotificationsScreen from '../screens/guest/NotificationsScreen';

// Staff screens
import HotelDashboardScreen from '../screens/staff/HotelDashboardScreen';
import AttendanceScreen from '../screens/staff/AttendanceScreen';
import StaffProfileScreen from '../screens/staff/StaffProfileScreen';
import StaffNotificationsScreen from '../screens/staff/NotificationsScreen';
import CheckInScreen from '../screens/staff/CheckInScreen';
import TicketsScreen from '../screens/staff/TicketsScreen';
import TrainingModeScreen from '../screens/staff/TrainingModeScreen';
import TasksScreen from '../screens/staff/TasksScreen';

// ─── Tipos de navegação ───────────────────────────────────────────────────────

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
};

export type GuestTabParamList = {
  Estadia: undefined;
  Servicos: undefined;
  Atividades: undefined;
  Chat: undefined;
  Perfil: undefined;
};

export type GuestStackParamList = {
  GuestTabs: undefined;
  Spa: undefined;
  Notificacoes: undefined;
};

export type StaffTabParamList = {
  Painel: undefined;
  Presenca: undefined;
  Chamados: undefined;
  Formacao: undefined;
  PerfilEquipa: undefined;
};

// Stack interno para o Painel (permite navegar para CheckIn / Alertas / Tarefas a partir do dashboard)
export type PainelStackParamList = {
  PainelHome: undefined;
  CheckIn: undefined;
  Alertas: undefined;
  Tarefas: undefined;
};

const Stack       = createStackNavigator<RootStackParamList>();
const GuestTab    = createBottomTabNavigator<GuestTabParamList>();
const GuestStack  = createStackNavigator<GuestStackParamList>();
const StaffTab    = createBottomTabNavigator<StaffTabParamList>();
const PainelStack = createStackNavigator<PainelStackParamList>();

// ─── Paletas de cores ─────────────────────────────────────────────────────────

const guestColors = {
  primary:    '#0A7EA4',
  inactive:   '#94A3B8',
  background: '#FFFFFF',
  border:     '#E0F2FE',
};

const staffColors = {
  primary:    '#1A3E6E',
  inactive:   '#9CA3AF',
  background: '#FFFFFF',
  border:     '#E5E7EB',
};

// ─── Stack do Painel (HotelDashboard + CheckIn + Alertas) ────────────────────
// Permite navegar para CheckIn e Notificações a partir do dashboard sem
// ocupar um separador dedicado na barra inferior.

function PainelNavigator({ userInfo }: { userInfo: UserInfo }) {
  return (
    <PainelStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: staffColors.primary,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: { fontWeight: '700', fontSize: 18, color: '#FFFFFF' },
        headerTintColor: '#FFFFFF',
      }}
    >
      <PainelStack.Screen
        name="PainelHome"
        options={{
          headerTitle: 'ENGERIS ONE',
          headerRight: () => null, // o ícone de sino pode ser adicionado aqui futuramente
        }}
      >
        {() => (
          <HotelDashboardScreen
            userName={userInfo.name}
            role={userInfo.role}
          />
        )}
      </PainelStack.Screen>
      <PainelStack.Screen
        name="CheckIn"
        component={CheckInScreen}
        options={{ headerTitle: 'Check-in / Check-out' }}
      />
      <PainelStack.Screen
        name="Alertas"
        component={StaffNotificationsScreen}
        options={{ headerTitle: 'Alertas e Notificações' }}
      />
      <PainelStack.Screen
        name="Tarefas"
        options={{ headerTitle: 'Tarefas do Dia' }}
      >
        {() => <TasksScreen role={userInfo.role} />}
      </PainelStack.Screen>
    </PainelStack.Navigator>
  );
}

// ─── Stack Navigator — Hóspede (inclui tabs + ecrãs modais) ─────────────────

function GuestNavigator({ onLogout }: { onLogout: () => void }) {
  return (
    <GuestStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0A7EA4', elevation: 0, shadowOpacity: 0 },
        headerTitleStyle: { fontWeight: '700', fontSize: 18, color: '#FFFFFF' },
        headerTintColor: '#FFFFFF',
      }}
    >
      <GuestStack.Screen name="GuestTabs" options={{ headerShown: false }}>
        {() => <GuestTabsInner onLogout={onLogout} />}
      </GuestStack.Screen>
      <GuestStack.Screen
        name="Spa"
        component={SpaScreen}
        options={{ headerTitle: 'Spa & Bem-estar' }}
      />
      <GuestStack.Screen
        name="Notificacoes"
        component={GuestNotificationsScreen}
        options={{ headerTitle: 'Notificações' }}
      />
    </GuestStack.Navigator>
  );
}

// ─── Tab Navigator — Hóspede ──────────────────────────────────────────────────

function GuestTabsInner({ onLogout }: { onLogout: () => void }) {
  return (
    <GuestTab.Navigator
      screenOptions={{
        tabBarActiveTintColor:   guestColors.primary,
        tabBarInactiveTintColor: guestColors.inactive,
        tabBarStyle: {
          backgroundColor: guestColors.background,
          borderTopWidth:  1,
          borderTopColor:  guestColors.border,
          height:          62,
          paddingBottom:   8,
          paddingTop:      4,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        headerStyle: {
          backgroundColor: guestColors.primary,
          elevation:       0,
          shadowOpacity:   0,
        },
        headerTitleStyle: { fontWeight: '700', fontSize: 18, color: '#FFFFFF' },
        headerTintColor: '#FFFFFF',
      }}
    >
      <GuestTab.Screen
        name="Estadia"
        component={MyStayScreen}
        options={{
          title:       'A Minha Estadia',
          headerTitle: 'Sea and Soul',
          tabBarIcon: ({ color, size }) => <Ionicons name="bed-outline" size={size} color={color} />,
        }}
      />
      <GuestTab.Screen
        name="Servicos"
        component={RoomServiceScreen}
        options={{
          title:       'Quarto',
          headerTitle: 'Serviço de Quarto',
          tabBarIcon: ({ color, size }) => <Ionicons name="fast-food-outline" size={size} color={color} />,
        }}
      />
      <GuestTab.Screen
        name="Atividades"
        component={ActivitiesScreen}
        options={{
          title:       'Atividades',
          headerTitle: 'Atividades',
          tabBarIcon: ({ color, size }) => <Ionicons name="bicycle-outline" size={size} color={color} />,
        }}
      />
      <GuestTab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          title:       'Chat',
          headerTitle: 'Chat com a Receção',
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubble-ellipses-outline" size={size} color={color} />,
        }}
      />
      <GuestTab.Screen
        name="Perfil"
        options={{
          title:       'Perfil',
          headerTitle: 'O Meu Perfil',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      >
        {() => <GuestProfileScreen onLogout={onLogout} />}
      </GuestTab.Screen>
    </GuestTab.Navigator>
  );
}

// ─── Tab Navigator — Equipa ───────────────────────────────────────────────────
// Separadores:
//   1. Painel    → PainelNavigator (stack: Dashboard → CheckIn, Dashboard → Alertas)
//   2. Presença  → AttendanceScreen
//   3. Chamados  → TicketsScreen
//   4. Formação  → TrainingModeScreen
//   5. Perfil    → StaffProfileScreen

function StaffTabs({ userInfo, onLogout }: { userInfo: UserInfo; onLogout: () => void }) {
  return (
    <StaffTab.Navigator
      screenOptions={{
        tabBarActiveTintColor:   staffColors.primary,
        tabBarInactiveTintColor: staffColors.inactive,
        tabBarStyle: {
          backgroundColor: staffColors.background,
          borderTopWidth:  1,
          borderTopColor:  staffColors.border,
          height:          62,
          paddingBottom:   8,
          paddingTop:      4,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        headerStyle: {
          backgroundColor: staffColors.primary,
          elevation:       0,
          shadowOpacity:   0,
        },
        headerTitleStyle: { fontWeight: '700', fontSize: 18, color: '#FFFFFF' },
        headerTintColor: '#FFFFFF',
      }}
    >
      {/* 1. Painel — stack interno com CheckIn e Alertas acessíveis */}
      <StaffTab.Screen
        name="Painel"
        options={{
          title:          'Início',
          headerShown:    false, // o header é gerido pelo PainelNavigator
          tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} />,
        }}
      >
        {() => <PainelNavigator userInfo={userInfo} />}
      </StaffTab.Screen>

      {/* 2. Presença — registo GPS obrigatório */}
      <StaffTab.Screen
        name="Presenca"
        component={AttendanceScreen}
        options={{
          title:       'Presença',
          headerTitle: 'Registo de Presença',
          tabBarIcon: ({ color, size }) => <Ionicons name="location-outline" size={size} color={color} />,
        }}
      />

      {/* 3. Chamados — manutenção e resolução de tickets */}
      <StaffTab.Screen
        name="Chamados"
        component={TicketsScreen}
        options={{
          title:       'Chamados',
          headerTitle: 'Chamados de Manutenção',
          tabBarIcon: ({ color, size }) => <Ionicons name="construct-outline" size={size} color={color} />,
        }}
      />

      {/* 4. Formação — modo de treino sem impacto em dados reais */}
      <StaffTab.Screen
        name="Formacao"
        component={TrainingModeScreen}
        options={{
          title:       'Formação',
          headerTitle: 'Modo Formação',
          tabBarIcon: ({ color, size }) => <Ionicons name="school-outline" size={size} color={color} />,
        }}
      />

      {/* 5. Perfil */}
      <StaffTab.Screen
        name="PerfilEquipa"
        options={{
          title:       'Perfil',
          headerTitle: 'O Meu Perfil',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      >
        {() => <StaffProfileScreen userInfo={userInfo} onLogout={onLogout} />}
      </StaffTab.Screen>
    </StaffTab.Navigator>
  );
}

// ─── Root Navigator — fluxo de autenticação ───────────────────────────────────

export default function AppNavigator() {
  const [isLoading, setIsLoading]         = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo]           = useState<UserInfo | null>(null);

  const handleLogout = async () => {
    try {
      await removeToken();
      await removeUserInfo();
    } catch {
      // ignorar erros ao limpar sessão
    }
    setUserInfo(null);
    setIsAuthenticated(false);
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await getToken();
        if (token) {
          const info = await getUserInfo();
          setUserInfo(info);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch {
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    setOnUnauthorized(() => {
      handleLogout();
    });
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1A3E6E" />
      </View>
    );
  }

  const isGuest = userInfo?.role === 'GUEST';

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        isGuest ? (
          <Stack.Screen name="Main">
            {() => <GuestNavigator onLogout={handleLogout} />}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="Main">
            {() => <StaffTabs userInfo={userInfo!} onLogout={handleLogout} />}
          </Stack.Screen>
        )
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex:            1,
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: '#F9FAFB',
  },
});
