import { useEffect, useRef } from 'react'
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { Platform } from 'react-native'
import { parseDeepLink } from '../utils/deep-link'

// Configurar comportamento das notificações em foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

interface UseNotificationsOptions {
  onNotificationTap?: (route: ReturnType<typeof parseDeepLink>) => void
}

/**
 * Hook para gestão de push notifications (Expo Notifications)
 * Regista handlers para foreground e tap em notificações
 * Suporta deep linking via data payload
 */
export function useNotifications({ onNotificationTap }: UseNotificationsOptions = {}) {
  const notificationListener = useRef<Notifications.Subscription>()
  const responseListener = useRef<Notifications.Subscription>()

  useEffect(() => {
    // Listener para notificações recebidas em foreground
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log('[Notifications] Recebida:', notification.request.content.title)
    })

    // Listener para tap do utilizador na notificação
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, string> | undefined
      const deepLinkUrl = data?.url ?? data?.deepLink

      if (deepLinkUrl && onNotificationTap) {
        const route = parseDeepLink(deepLinkUrl)
        onNotificationTap(route)
      }
    })

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current)
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current)
      }
    }
  }, [onNotificationTap])
}

/**
 * Solicita permissão de notificações e devolve o Expo Push Token
 * Deve ser chamado após login
 */
export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn('[Notifications] Push notifications apenas disponíveis em dispositivo físico')
    return null
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') {
    console.warn('[Notifications] Permissão de notificações negada')
    return null
  }

  // Configuração específica Android
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Sea and Soul',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1A3E6E',
    })

    await Notifications.setNotificationChannelAsync('maintenance', {
      name: 'Manutenção',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 500],
      lightColor: '#EF4444',
    })

    await Notifications.setNotificationChannelAsync('checkin', {
      name: 'Check-in/Check-out',
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: '#10B981',
    })
  }

  try {
    const projectId = 'CHANGE_ME_EAS_PROJECT_ID' // Actualizar após registo EAS
    const token = await Notifications.getExpoPushTokenAsync({ projectId })
    return token.data
  } catch (err) {
    console.error('[Notifications] Erro ao obter push token:', err)
    return null
  }
}

/**
 * Agendar notificação local (ex: lembrete de check-out)
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  triggerDate: Date,
  data?: Record<string, string>
): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    content: { title, body, data: data ?? {} },
    trigger: { date: triggerDate },
  })
}

/**
 * Cancelar notificação local agendada
 */
export async function cancelLocalNotification(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId)
}
