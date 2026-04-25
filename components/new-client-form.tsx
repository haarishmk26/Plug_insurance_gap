'use client'

import Link from 'next/link'
import { useState } from 'react'

type CreatedClient = {
  id: string
  business_name: string
  owner_name: string
  intake_token: string
  telegramLink: string
}

export function NewClientForm() {
  const [businessName, setBusinessName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [ownerContact, setOwnerContact] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [client, setClient] = useState<CreatedClient | null>(null)
  const [copied, setCopied] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setLoading(true)

    const response = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessName, ownerName, ownerContact }),
    })
    const json = await response.json()

    if (!response.ok) {
      setError(json.error ?? 'Something went wrong.')
      setLoading(false)
      return
    }

    setClient(json)
    setLoading(false)
  }

  async function copyLink() {
    if (!client) return
    await navigator.clipboard.writeText(client.telegramLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  if (client) {
    return (
      <div className="mt-6 space-y-4">
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-5">
          <p className="font-semibold text-emerald-900">{client.business_name}</p>
          <p className="mt-1 text-sm text-emerald-700">Owner: {client.owner_name}</p>
        </div>

        <div className="rounded-md border border-slate-200 bg-white p-5">
          <p className="text-sm font-semibold text-slate-950">Telegram intake link</p>
          <p className="mt-1.5 text-sm text-slate-500">
            Send this link to the business owner to start their intake.
          </p>
          <div className="mt-4 flex items-center gap-2">
            <input
              readOnly
              value={client.telegramLink}
              className="min-w-0 flex-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
            />
            <button
              type="button"
              onClick={copyLink}
              className="shrink-0 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={`/clients/${client.id}`}
            className="rounded-md bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            View dossier
          </Link>
          <button
            type="button"
            onClick={() => {
              setClient(null)
              setBusinessName('')
              setOwnerName('')
              setOwnerContact('')
              setCopied(false)
            }}
            className="rounded-md border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Add another client
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-5 rounded-md border border-slate-200 bg-white p-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">
          Business name
          <input
            required
            value={businessName}
            onChange={(event) => setBusinessName(event.target.value)}
            className="mt-1.5 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
            placeholder="Golden Gate Deli"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Owner name
          <input
            required
            value={ownerName}
            onChange={(event) => setOwnerName(event.target.value)}
            className="mt-1.5 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
            placeholder="Maria Santos"
          />
        </label>
      </div>

      <label className="block text-sm font-medium text-slate-700">
        Owner contact
        <input
          value={ownerContact}
          onChange={(event) => setOwnerContact(event.target.value)}
          className="mt-1.5 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
          placeholder="+1 415 555 0100"
        />
      </label>

      {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
        >
          {loading ? 'Creating...' : 'Create client'}
        </button>
      </div>
    </form>
  )
}
