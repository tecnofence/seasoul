import { Linking } from 'react-native'

/**
 * Mapeamento de deep links da app Sea and Soul
 *
 * Scheme: seaandsoul://
 * Universal Links (iOS): https://app.seasoul.ao/app/...
 *
 * Exemplos:
 *   seaandsoul://reservation/abc123          → detalhes de reserva
 *   seaandsoul://checkin/abc123              → ecrã de check-in
 *   seaandsoul://invoice/abc123              → fatura
 *   seaandsoul://notification                → centro de notificações
 *   seaandsoul://maintenance/abc123          → chamado de manutenção
 */

export const DEEP_LINK_SCHEME = 'seaandsoul'
export const UNIVERSAL_LINK_HOST = 'app.seasoul.ao'

export type DeepLinkRoute =
  | { type: 'reservation';   id: string }
  | { type: 'checkin';       id: string }
  | { type: 'invoice';       id: string }
  | { type: 'notification' }
  | { type: 'maintenance';   id: string }
  | { type: 'task';          id: string }
  | { type: 'unknown' }

export function parseDeepLink(url: string): DeepLinkRoute {
  try {
    // Normalizar: remover scheme e host se universal link
    let path = url
    if (url.startsWith(`${DEEP_LINK_SCHEME}://`)) {
      path = url.replace(`${DEEP_LINK_SCHEME}://`, '')
    } else if (url.includes(`${UNIVERSAL_LINK_HOST}/app/`)) {
      path = url.split(`${UNIVERSAL_LINK_HOST}/app/`)[1]
    }

    const [segment, id] = path.split('/')

    switch (segment) {
      case 'reservation':  return { type: 'reservation', id }
      case 'checkin':      return { type: 'checkin',     id }
      case 'invoice':      return { type: 'invoice',     id }
      case 'notification': return { type: 'notification' }
      case 'maintenance':  return { type: 'maintenance', id }
      case 'task':         return { type: 'task',        id }
      default:             return { type: 'unknown' }
    }
  } catch {
    return { type: 'unknown' }
  }
}

export function buildDeepLink(route: Exclude<DeepLinkRoute, { type: 'unknown' }>): string {
  switch (route.type) {
    case 'reservation':  return `${DEEP_LINK_SCHEME}://reservation/${route.id}`
    case 'checkin':      return `${DEEP_LINK_SCHEME}://checkin/${route.id}`
    case 'invoice':      return `${DEEP_LINK_SCHEME}://invoice/${route.id}`
    case 'notification': return `${DEEP_LINK_SCHEME}://notification`
    case 'maintenance':  return `${DEEP_LINK_SCHEME}://maintenance/${route.id}`
    case 'task':         return `${DEEP_LINK_SCHEME}://task/${route.id}`
  }
}

export function openExternalUrl(url: string): void {
  Linking.canOpenURL(url).then((supported) => {
    if (supported) Linking.openURL(url)
  })
}
