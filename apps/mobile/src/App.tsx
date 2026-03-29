/**
 * ENGERIS ONE — Mobile App
 * Copyright (c) 2025 ENGERIS — Engenharia e Sistemas, Lda. Todos os direitos reservados.
 * Software proprietário. Consultar ficheiro LICENSE na raiz do repositório.
 */
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppNavigator from './navigation/AppNavigator';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutos
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </QueryClientProvider>
  );
}
