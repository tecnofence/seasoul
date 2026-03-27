'use client'

import { useState, useRef, useEffect } from 'react'
import { useLocale } from 'next-intl'
import { locales, localeNames, localeFlags, type Locale } from '@/lib/i18n-config'
import { ChevronDown, Globe } from 'lucide-react'

export function LanguageSwitcher() {
  const currentLocale = useLocale() as Locale
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function changeLocale(locale: Locale) {
    localStorage.setItem('locale', locale)
    window.dispatchEvent(new CustomEvent('locale-change', { detail: locale }))
    setOpen(false)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
        aria-label="Change language"
        aria-expanded={open}
      >
        <Globe className="h-4 w-4" />
        <span>{localeFlags[currentLocale]}</span>
        <span className="hidden sm:inline">{currentLocale.toUpperCase()}</span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-1 w-48 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
          {locales.map((locale) => (
            <button
              key={locale}
              type="button"
              onClick={() => changeLocale(locale)}
              className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-gray-100 ${
                locale === currentLocale ? 'bg-blue-50 font-medium text-blue-700' : 'text-gray-700'
              }`}
            >
              <span className="text-base">{localeFlags[locale]}</span>
              <span>{localeNames[locale]}</span>
              <span className="ml-auto text-xs text-gray-400">{locale.toUpperCase()}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
