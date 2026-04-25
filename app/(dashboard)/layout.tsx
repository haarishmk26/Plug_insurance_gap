import Link from 'next/link'
import { cookies } from 'next/headers'

import { LogoutButton } from '@/components/logout-button'
import { DEMO_EMAIL_COOKIE } from '@/lib/dashboard/session'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const email = cookieStore.get(DEMO_EMAIL_COOKIE)?.value ?? 'demo@districtcover.local'

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-md bg-slate-950 text-sm font-semibold text-white">
              R
            </span>
            <span>
              <span className="block text-sm font-semibold text-slate-950">Rova</span>
              <span className="block text-xs text-slate-500">District Cover intake</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-500 sm:inline">{email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="px-4 py-8 sm:px-6">{children}</main>
    </div>
  )
}
