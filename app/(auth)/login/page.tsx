import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { DEMO_EMAIL_COOKIE, DEMO_SESSION_COOKIE } from '@/lib/dashboard/session'

async function login(formData: FormData) {
  'use server'

  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '').trim()

  if (!email || !password) {
    redirect('/login?error=missing')
  }

  const cookieStore = await cookies()
  cookieStore.set(DEMO_SESSION_COOKIE, '1', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  })
  cookieStore.set(DEMO_EMAIL_COOKIE, email, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  })

  redirect('/')
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }> | { error?: string }
}) {
  const params = await searchParams
  const showError = params.error === 'missing'

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white px-8 py-10 shadow-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-lg bg-slate-950 text-lg font-semibold text-white">
            R
          </div>
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Rova</p>
          <h1 className="mt-1 text-xl font-semibold text-slate-950">Broker portal</h1>
        </div>

        <form action={login} className="space-y-5">
          <label className="block text-sm font-medium text-slate-700">
            Email
            <input
              name="email"
              type="email"
              required
              className="mt-1.5 block h-10 w-full rounded-md border border-slate-300 px-3 text-sm text-slate-950 outline-none transition focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
              placeholder="demo@districtcover.local"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Password
            <input
              name="password"
              type="password"
              required
              className="mt-1.5 block h-10 w-full rounded-md border border-slate-300 px-3 text-sm text-slate-950 outline-none transition focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
              placeholder="Any password"
            />
          </label>

          {showError ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              Enter any email and password to continue.
            </p>
          ) : null}

          <button
            type="submit"
            className="w-full rounded-md bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Sign in
          </button>
        </form>
      </div>
    </main>
  )
}
