import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { DEMO_EMAIL_COOKIE, DEMO_SESSION_COOKIE } from '@/lib/dashboard/session'

export function LogoutButton() {
  async function logout() {
    'use server'

    const cookieStore = await cookies()
    cookieStore.delete(DEMO_SESSION_COOKIE)
    cookieStore.delete(DEMO_EMAIL_COOKIE)
    redirect('/login')
  }

  return (
    <form action={logout}>
      <button
        type="submit"
        className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
      >
        Sign out
      </button>
    </form>
  )
}
