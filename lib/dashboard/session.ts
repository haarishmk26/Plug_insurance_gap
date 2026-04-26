export const DEMO_SESSION_COOKIE = 'district_cover_demo_session'
export const DEMO_EMAIL_COOKIE = 'district_cover_demo_email'

export function isPublicDashboardPath(pathname: string): boolean {
  return (
    pathname.startsWith('/login') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico'
  )
}
