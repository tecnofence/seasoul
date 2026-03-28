import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that should never be treated as resort slugs
const SKIP_PATHS = [
  '/dashboard', '/admin', '/login', '/_next', '/api', '/favicon',
  '/funcionalidades', '/precos', '/clientes', '/demo', '/sobre'
]

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Skip known app/marketing routes
  if (SKIP_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Skip root path (marketing homepage)
  if (pathname === '/') {
    return NextResponse.next()
  }

  // Subdomain detection (for production)
  const hostname = request.headers.get('host') || ''
  const parts = hostname.split('.')
  if (parts.length >= 3 && !hostname.includes('localhost') && !hostname.includes('127.0.0.1')) {
    const slug = parts[0]
    if (slug && slug !== 'www' && slug !== 'app' && slug !== 'api') {
      const url = request.nextUrl.clone()
      url.pathname = `/${slug}${pathname === '/' ? '' : pathname}`
      return NextResponse.rewrite(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
