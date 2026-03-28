'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'

interface Resort {
  name: string
  logo?: string
  primaryColor?: string
}

interface PublicNavbarProps {
  resort: Resort
  slug: string
}

const NAV_LINKS = [
  { label: 'Quartos', href: 'quartos' },
  { label: 'Spa', href: 'spa' },
  { label: 'Atividades', href: 'atividades' },
  { label: 'Galeria', href: 'galeria' },
  { label: 'Contacto', href: 'contacto' },
]

export default function PublicNavbar({ resort, slug }: PublicNavbarProps) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const primaryColor = resort.primaryColor ?? '#1A3E6E'

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <header
      className={[
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled || mobileOpen
          ? 'bg-white shadow-md'
          : 'bg-transparent',
      ].join(' ')}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href={`/${slug}`} className="flex items-center gap-3 flex-shrink-0">
            {resort.logo ? (
              <Image
                src={resort.logo}
                alt={resort.name}
                width={120}
                height={40}
                className="h-10 w-auto object-contain"
              />
            ) : (
              <span
                className={[
                  'text-xl font-bold tracking-tight transition-colors duration-300',
                  scrolled || mobileOpen ? 'text-gray-900' : 'text-white',
                ].join(' ')}
                style={scrolled || mobileOpen ? { color: primaryColor } : undefined}
              >
                {resort.name}
              </span>
            )}
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={`/${slug}/${link.href}`}
                className={[
                  'px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200',
                  scrolled
                    ? 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                    : 'text-white/90 hover:text-white hover:bg-white/10',
                ].join(' ')}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* CTA Button (desktop) */}
          <div className="hidden md:block">
            <Link
              href={`/${slug}/reservar`}
              className="inline-flex items-center px-5 py-2.5 rounded-full text-sm font-semibold text-white shadow-sm transition-opacity duration-200 hover:opacity-90"
              style={{ backgroundColor: primaryColor }}
            >
              Reservar
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            className={[
              'md:hidden p-2 rounded-md transition-colors duration-200',
              scrolled || mobileOpen
                ? 'text-gray-700 hover:bg-gray-100'
                : 'text-white hover:bg-white/10',
            ].join(' ')}
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white shadow-lg">
          <nav className="flex flex-col px-4 py-3 gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={`/${slug}/${link.href}`}
                className="px-4 py-3 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors duration-150"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 pb-1">
              <Link
                href={`/${slug}/reservar`}
                className="flex items-center justify-center w-full px-5 py-3 rounded-full text-sm font-semibold text-white shadow-sm transition-opacity duration-200 hover:opacity-90"
                style={{ backgroundColor: primaryColor }}
                onClick={() => setMobileOpen(false)}
              >
                Reservar
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
