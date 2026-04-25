import { NextResponse, type NextRequest } from 'next/server'

import { DEMO_SESSION_COOKIE, isPublicDashboardPath } from './lib/dashboard/session'

export function middleware(request: NextRequest) {
  const isLoggedIn = request.cookies.get(DEMO_SESSION_COOKIE)?.value === '1'
  const pathname = request.nextUrl.pathname

  if (pathname === '/login' && isLoggedIn) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  if (!isLoggedIn && !isPublicDashboardPath(pathname)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
