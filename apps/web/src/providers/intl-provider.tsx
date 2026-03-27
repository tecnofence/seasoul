'use client'

import { NextIntlClientProvider } from 'next-intl'
import { useEffect, useState, type ReactNode } from 'react'
import { defaultLocale, locales, type Locale } from '@/lib/i18n-config'

import ptMessages from '@/messages/pt.json'
import enMessages from '@/messages/en.json'
import frMessages from '@/messages/fr.json'
import esMessages from '@/messages/es.json'

const allMessages: Record<Locale, typeof ptMessages> = {
  pt: ptMessages,
  en: enMessages,
  fr: frMessages,
  es: esMessages,
}

function getStoredLocale(): Locale {
  if (typeof window === 'undefined') return defaultLocale
  const stored = localStorage.getItem('locale')
  if (stored && locales.includes(stored as Locale)) {
    return stored as Locale
  }
  return defaultLocale
}

export function IntlProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(defaultLocale)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setLocale(getStoredLocale())
    setMounted(true)

    const handleLocaleChange = (e: StorageEvent) => {
      if (e.key === 'locale' && e.newValue && locales.includes(e.newValue as Locale)) {
        setLocale(e.newValue as Locale)
      }
    }

    // Listen for custom locale change events from the language switcher
    const handleCustomLocaleChange = ((e: CustomEvent<Locale>) => {
      setLocale(e.detail)
    }) as EventListener

    window.addEventListener('storage', handleLocaleChange)
    window.addEventListener('locale-change', handleCustomLocaleChange)

    return () => {
      window.removeEventListener('storage', handleLocaleChange)
      window.removeEventListener('locale-change', handleCustomLocaleChange)
    }
  }, [])

  const messages = allMessages[locale]

  // Avoid hydration mismatch by rendering with default locale until mounted
  if (!mounted) {
    return (
      <NextIntlClientProvider locale={defaultLocale} messages={allMessages[defaultLocale]}>
        {children}
      </NextIntlClientProvider>
    )
  }

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  )
}
