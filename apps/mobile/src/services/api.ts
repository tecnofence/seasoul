import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/v1';

const TOKEN_KEY = 'auth_token';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de request — adiciona JWT do SecureStore
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // SecureStore pode falhar em ambientes sem suporte
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

// Interceptor de response — 401 redireciona para login
let onUnauthorized: (() => void) | null = null;

export function setOnUnauthorized(callback: () => void) {
  onUnauthorized = callback;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Remove token expirado
      try {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      } catch {
        // Ignorar erro ao limpar token
      }
      if (onUnauthorized) {
        onUnauthorized();
      }
    }
    return Promise.reject(error);
  },
);

// Funções auxiliares para gestão do token
export async function saveToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function removeToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export default api;
