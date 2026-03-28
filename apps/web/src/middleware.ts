import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const pathname = request.nextUrl.pathname

  // Skip for dashboard, admin, login, api routes, static files
  if (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next()
  }

  // Subdomain detection: resort.engerisone.com → /resort/...
  const parts = hostname.split('.')
  if (parts.length >= 3 && !hostname.includes('localhost')) {
    const slug = parts[0]
    if (slug && slug !== 'www' && slug !== 'app') {
      const url = request.nextUrl.clone()
      url.pathname = `/${slug}${pathname}`
      return NextResponse.rewrite(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
