import AsyncStorage from '@react-native-async-storage/async-storage'

type Language = 'pt' | 'en'

const translations = {
  pt: {
    // Auth
    'login.title': 'Bem-vindo',
    'login.subtitle': 'Aceda à sua conta',
    'login.email': 'Email',
    'login.password': 'Palavra-passe',
    'login.button': 'Entrar',
    'login.loading': 'A entrar...',
    // Common
    'common.loading': 'A carregar...',
    'common.error': 'Ocorreu um erro',
    'common.retry': 'Tentar novamente',
    'common.cancel': 'Cancelar',
    'common.confirm': 'Confirmar',
    'common.save': 'Guardar',
    'common.back': 'Voltar',
    'common.search': 'Pesquisar',
    'common.logout': 'Terminar sessão',
    'common.logout.confirm': 'Tem a certeza que quer terminar a sessão?',
    // Navigation tabs
    'nav.stay': 'Estadia',
    'nav.services': 'Serviços',
    'nav.activities': 'Atividades',
    'nav.chat': 'Chat',
    'nav.profile': 'Perfil',
    'nav.dashboard': 'Painel',
    'nav.attendance': 'Presença',
    'nav.tickets': 'Chamados',
    'nav.training': 'Formação',
    // Guest screens
    'stay.title': 'A Minha Estadia',
    'stay.room': 'Quarto',
    'stay.nights': 'noites',
    'stay.checkin': 'Check-in',
    'stay.checkout': 'Check-out',
    'services.title': 'Serviços',
    'services.order': 'Encomenda',
    'services.cart': 'Carrinho',
    // Staff screens
    'dashboard.title': 'Painel de Operações',
    'attendance.title': 'Registo de Ponto',
    'attendance.checkin': 'Registar Entrada',
    'attendance.checkout': 'Registar Saída',
    'tickets.title': 'Chamados',
    'tickets.new': 'Novo Chamado',
    'training.title': 'Modo Formação',
    'training.active': 'MODO FORMAÇÃO ATIVO',
  },
  en: {
    // Auth
    'login.title': 'Welcome',
    'login.subtitle': 'Sign in to your account',
    'login.email': 'Email',
    'login.password': 'Password',
    'login.button': 'Sign In',
    'login.loading': 'Signing in...',
    // Common
    'common.loading': 'Loading...',
    'common.error': 'An error occurred',
    'common.retry': 'Try again',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.save': 'Save',
    'common.back': 'Back',
    'common.search': 'Search',
    'common.logout': 'Sign Out',
    'common.logout.confirm': 'Are you sure you want to sign out?',
    // Navigation tabs
    'nav.stay': 'My Stay',
    'nav.services': 'Services',
    'nav.activities': 'Activities',
    'nav.chat': 'Chat',
    'nav.profile': 'Profile',
    'nav.dashboard': 'Dashboard',
    'nav.attendance': 'Attendance',
    'nav.tickets': 'Tickets',
    'nav.training': 'Training',
    // Guest screens
    'stay.title': 'My Stay',
    'stay.room': 'Room',
    'stay.nights': 'nights',
    'stay.checkin': 'Check-in',
    'stay.checkout': 'Check-out',
    'services.title': 'Services',
    'services.order': 'Order',
    'services.cart': 'Cart',
    // Staff screens
    'dashboard.title': 'Operations Dashboard',
    'attendance.title': 'Attendance',
    'attendance.checkin': 'Clock In',
    'attendance.checkout': 'Clock Out',
    'tickets.title': 'Tickets',
    'tickets.new': 'New Ticket',
    'training.title': 'Training Mode',
    'training.active': 'TRAINING MODE ACTIVE',
  },
}

let currentLanguage: Language = 'pt'

export function setLanguage(lang: Language): void {
  currentLanguage = lang
  AsyncStorage.setItem('@language', lang).catch(() => {})
}

export async function loadLanguage(): Promise<void> {
  try {
    const saved = await AsyncStorage.getItem('@language')
    if (saved === 'pt' || saved === 'en') currentLanguage = saved
  } catch {}
}

export function t(key: string): string {
  return translations[currentLanguage][key as keyof typeof translations['pt']] ?? key
}

export function getCurrentLanguage(): Language {
  return currentLanguage
}
