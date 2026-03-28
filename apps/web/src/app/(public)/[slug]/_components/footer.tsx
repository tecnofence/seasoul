import Link from 'next/link'
import { Phone, Mail, MapPin, Facebook, Instagram, MessageCircle } from 'lucide-react'

interface ResortContact {
  phone?: string
  email?: string
  address?: string
}

interface Resort {
  name: string
  contact?: ResortContact
  primaryColor?: string
}

interface PublicFooterProps {
  resort: Resort
  slug: string
}

const NAV_LINKS = [
  { label: 'Início', href: '' },
  { label: 'Quartos', href: 'quartos' },
  { label: 'Spa', href: 'spa' },
  { label: 'Atividades', href: 'atividades' },
  { label: 'Galeria', href: 'galeria' },
  { label: 'Contacto', href: 'contacto' },
  { label: 'Reservar', href: 'reservar' },
]

export default function PublicFooter({ resort, slug }: PublicFooterProps) {
  const contact = resort.contact ?? {}
  const year = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Column 1 — Brand */}
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold tracking-tight text-white">{resort.name}</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Luxo e conforto em Angola.
              <br />
              Uma experiência inesquecível à beira-mar.
            </p>
          </div>

          {/* Column 2 — Navigation */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
              Navegação
            </h3>
            <nav className="flex flex-col gap-2">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={`/${slug}${link.href ? `/${link.href}` : ''}`}
                  className="text-sm text-gray-300 hover:text-white transition-colors duration-150"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Column 3 — Contact + Social */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
              Contacto
            </h3>
            <ul className="flex flex-col gap-3 mb-6">
              {contact.phone && (
                <li className="flex items-start gap-3 text-sm text-gray-300">
                  <Phone className="h-4 w-4 mt-0.5 flex-shrink-0 text-gray-500" />
                  <a
                    href={`tel:${contact.phone}`}
                    className="hover:text-white transition-colors duration-150"
                  >
                    {contact.phone}
                  </a>
                </li>
              )}
              {contact.email && (
                <li className="flex items-start gap-3 text-sm text-gray-300">
                  <Mail className="h-4 w-4 mt-0.5 flex-shrink-0 text-gray-500" />
                  <a
                    href={`mailto:${contact.email}`}
                    className="hover:text-white transition-colors duration-150"
                  >
                    {contact.email}
                  </a>
                </li>
              )}
              {contact.address && (
                <li className="flex items-start gap-3 text-sm text-gray-300">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-gray-500" />
                  <span>{contact.address}</span>
                </li>
              )}
            </ul>

            {/* Social Media */}
            <div className="flex items-center gap-4">
              <a
                href="#"
                aria-label="Facebook"
                className="p-2 rounded-full bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors duration-150"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="#"
                aria-label="Instagram"
                className="p-2 rounded-full bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors duration-150"
              >
                <Instagram className="h-4 w-4" />
              </a>
              {contact.phone && (
                <a
                  href={`https://wa.me/${contact.phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  className="p-2 rounded-full bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors duration-150"
                >
                  <MessageCircle className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500">
          <p>
            &copy; {year} {resort.name} &middot; Desenvolvido por{' '}
            <a
              href="https://engeris.co.ao"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-300 transition-colors duration-150"
            >
              ENGERIS
            </a>
          </p>
          <p>Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
