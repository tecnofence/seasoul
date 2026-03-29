/**
 * ENGERIS ONE — Mobile App
 * Copyright (c) 2025 ENGERIS — Engenharia e Sistemas, Lda. Todos os direitos reservados.
 * Software proprietário. Consultar ficheiro LICENSE na raiz do repositório.
 */
import { useRef } from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppNavigator from './navigation/AppNavigator';
import { useNotifications } from './hooks/useNotifications';
import { parseDeepLink } from './utils/deep-link';
import { DEEP_LINK_SCHEME } from './utils/deep-link';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000,
    },
  },
});

// Configuração de deep linking para NavigationContainer
const linking = {
  prefixes: [`${DEEP_LINK_SCHEME}://`, 'https://app.seasoul.ao/app/'],
  config: {
    screens: {
      Main: {
        screens: {
          GuestTabs: {
            screens: {
              Estadia: 'stay',
              Chat: 'chat',
            },
          },
          StaffTabs: {
            screens: {
              Painel: 'dashboard',
              Chamados: 'maintenance/:id',
              Tarefas: 'task/:id',
            },
          },
        },
      },
    },
  },
};

function AppWithNotifications() {
  const navigationRef = useRef<NavigationContainerRef<any>>(null);

  useNotifications({
    onNotificationTap: (route) => {
      if (!navigationRef.current) return;
      switch (route.type) {
        case 'maintenance':
          navigationRef.current.navigate('Chamados' as never);
          break;
        case 'task':
          navigationRef.current.navigate('Tarefas' as never);
          break;
        case 'notification':
          navigationRef.current.navigate('Notificações' as never);
          break;
        default:
          break;
      }
    },
  });

  return (
    <NavigationContainer ref={navigationRef} linking={linking}>
      <AppNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppWithNotifications />
    </QueryClientProvider>
  );
}
