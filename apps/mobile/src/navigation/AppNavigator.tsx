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
import SpaScreen from '../screens/guest/SpaScreen';
import ConciergeScreen from '../screens/guest/ConciergeScreen';
import GuestProfileScreen from '../screens/guest/GuestProfileScreen';

// Staff screens
import HotelDashboardScreen from '../screens/staff/HotelDashboardScreen';
import AttendanceScreen from '../screens/staff/AttendanceScreen';
import TasksScreen from '../screens/staff/TasksScreen';
import StaffProfileScreen from '../screens/staff/StaffProfileScreen';

// ─── Tipos de navegação ──────────────────────────────────────────────────────

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
};

export type GuestTabParamList = {
  Estadia: undefined;
  Servicos: undefined;
  Spa: undefined;
  Concierge: undefined;
  Perfil: undefined;
};

export type StaffTabParamList = {
  Painel: undefined;
  Presenca: undefined;
  Tarefas: undefined;
  PerfilEquipa: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const GuestTab = createBottomTabNavigator<GuestTabParamList>();
const StaffTab = createBottomTabNavigator<StaffTabParamList>();

// ─── Paletas de cores ────────────────────────────────────────────────────────

const guestColors = {
  primary: '#0A7EA4',
  inactive: '#94A3B8',
  background: '#FFFFFF',
  border: '#E0F2FE',
};

const staffColors = {
  primary: '#1A3E6E',
  inactive: '#9CA3AF',
  background: '#FFFFFF',
  border: '#E5E7EB',
};

// ─── Tab Navigator — Hóspede ─────────────────────────────────────────────────

function GuestTabs({ onLogout }: { onLogout: () => void }) {
  return (
    <GuestTab.Navigator
      screenOptions={{
        tabBarActiveTintColor: guestColors.primary,
        tabBarInactiveTintColor: guestColors.inactive,
        tabBarStyle: {
          backgroundColor: guestColors.background,
          borderTopWidth: 1,
          borderTopColor: guestColors.border,
          height: 62,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        headerStyle: {
          backgroundColor: guestColors.primary,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: { fontWeight: '700', fontSize: 18, color: '#FFFFFF' },
        headerTintColor: '#FFFFFF',
      }}
    >
      <GuestTab.Screen
        name="Estadia"
        component={MyStayScreen}
        options={{
          title: 'A Minha Estadia',
          headerTitle: 'Sea and Soul',
          tabBarIcon: ({ color, size }) => <Ionicons name="bed-outline" size={size} color={color} />,
        }}
      />
      <GuestTab.Screen
        name="Servicos"
        component={RoomServiceScreen}
        options={{
          title: 'Quarto',
          headerTitle: 'Serviço de Quarto',
          tabBarIcon: ({ color, size }) => <Ionicons name="fast-food-outline" size={size} color={color} />,
        }}
      />
      <GuestTab.Screen
        name="Spa"
        component={SpaScreen}
        options={{
          title: 'Spa',
          headerTitle: 'Spa & Atividades',
          tabBarIcon: ({ color, size }) => <Ionicons name="leaf-outline" size={size} color={color} />,
        }}
      />
      <GuestTab.Screen
        name="Concierge"
        component={ConciergeScreen}
        options={{
          title: 'Concierge',
          headerTitle: 'Concierge',
          tabBarIcon: ({ color, size }) => <Ionicons name="headset-outline" size={size} color={color} />,
        }}
      />
      <GuestTab.Screen
        name="Perfil"
        options={{
          title: 'Perfil',
          headerTitle: 'O Meu Perfil',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      >
        {() => <GuestProfileScreen onLogout={onLogout} />}
      </GuestTab.Screen>
    </GuestTab.Navigator>
  );
}

// ─── Tab Navigator — Equipa ──────────────────────────────────────────────────

function StaffTabs({ userInfo, onLogout }: { userInfo: UserInfo; onLogout: () => void }) {
  return (
    <StaffTab.Navigator
      screenOptions={{
        tabBarActiveTintColor: staffColors.primary,
        tabBarInactiveTintColor: staffColors.inactive,
        tabBarStyle: {
          backgroundColor: staffColors.background,
          borderTopWidth: 1,
          borderTopColor: staffColors.border,
          height: 62,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        headerStyle: {
          backgroundColor: staffColors.primary,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: { fontWeight: '700', fontSize: 18, color: '#FFFFFF' },
        headerTintColor: '#FFFFFF',
      }}
    >
      <StaffTab.Screen
        name="Painel"
        options={{
          title: 'Início',
          headerTitle: 'ENGERIS ONE',
          tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} />,
        }}
      >
        {() => <HotelDashboardScreen userName={userInfo.name} role={userInfo.role} />}
      </StaffTab.Screen>
      <StaffTab.Screen
        name="Presenca"
        component={AttendanceScreen}
        options={{
          title: 'Presença',
          headerTitle: 'Registo de Presença',
          tabBarIcon: ({ color, size }) => <Ionicons name="location-outline" size={size} color={color} />,
        }}
      />
      <StaffTab.Screen
        name="Tarefas"
        options={{
          title: 'Tarefas',
          headerTitle: 'As Minhas Tarefas',
          tabBarIcon: ({ color, size }) => <Ionicons name="list-outline" size={size} color={color} />,
        }}
      >
        {() => <TasksScreen role={userInfo.role} />}
      </StaffTab.Screen>
      <StaffTab.Screen
        name="PerfilEquipa"
        options={{
          title: 'Perfil',
          headerTitle: 'O Meu Perfil',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      >
        {() => <StaffProfileScreen userInfo={userInfo} onLogout={onLogout} />}
      </StaffTab.Screen>
    </StaffTab.Navigator>
  );
}

// ─── Root Navigator — fluxo de autenticação ──────────────────────────────────

export default function AppNavigator() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

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
            {() => <GuestTabs onLogout={handleLogout} />}
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
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
});
