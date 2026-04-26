import Link from 'next/link'

import { ScoreBadge } from '@/components/score-badge'
import { countClientStatuses } from '@/lib/dashboard/dossier'
import { DEFAULT_DEMO_BROKER_ID, upsertDemoBroker } from '@/lib/supabase/demo-broker'
import { createServiceClient } from '@/lib/supabase/server'
import type { Client, ReadinessScore } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

type ClientWithScore = Client & { score?: ReadinessScore }

async function getClients(): Promise<ClientWithScore[]> {
  const supabase = createServiceClient() as any
  await upsertDemoBroker(supabase)

  const { data: clients, error: clientError } = await supabase
    .from('clients')
    .select('*')
    .eq('broker_id', DEFAULT_DEMO_BROKER_ID)
    .order('updated_at', { ascending: false })

  if (clientError) {
    throw clientError
  }

  const clientRows = (clients ?? []) as Client[]
  const ids = clientRows.map((client) => client.id)
  if (ids.length === 0) {
    return []
  }

  const { data: scores, error: scoreError } = await supabase
    .from('readiness_scores')
    .select('*')
    .in('client_id', ids)

  if (scoreError) {
    throw scoreError
  }

  const scoreRows = (scores ?? []) as ReadinessScore[]
  const scoreByClient = new Map(scoreRows.map((score) => [score.client_id, score]))
  return clientRows.map((client) => ({ ...client, score: scoreByClient.get(client.id) }))
}

function statusLabel(status: Client['intake_status']) {
  return status === 'complete' ? 'Complete' : status === 'in_progress' ? 'In progress' : 'Pending'
}

export default async function DashboardPage() {
  const clients = await getClients()
  const counts = countClientStatuses(clients)

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <section className="grid gap-6 border-b border-slate-200 pb-8 lg:grid-cols-[1fr_320px]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">Phase 1</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-normal text-slate-950 sm:text-4xl">
            Broker intake dashboard
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            Create a client intake, track completion, review the ACORD-aligned dossier, and export the broker package.
          </p>
          <div className="mt-6">
            <Link
              href="/clients/new"
              className="inline-flex items-center rounded-md bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              New client
            </Link>
          </div>
        </div>

        <div className="rounded-md border border-slate-200 bg-white p-5">
          <p className="text-sm font-medium text-slate-500">Current queue</p>
          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-sm text-slate-600">Pending intake</span>
              <span className="text-sm font-semibold">{counts.pending}</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-sm text-slate-600">In progress</span>
              <span className="text-sm font-semibold">{counts.in_progress}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Ready for review</span>
              <span className="text-sm font-semibold">{counts.complete}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-950">Clients</h2>
        </div>

        {clients.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm font-medium text-slate-950">No client intakes yet</p>
            <Link
              href="/clients/new"
              className="mt-4 inline-flex rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
            >
              New client
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Business</th>
                  <th className="px-5 py-3">Owner</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Score</th>
                  <th className="px-5 py-3">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <Link href={`/clients/${client.id}`} className="font-medium text-slate-950 hover:underline">
                        {client.business_name}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{client.owner_name}</td>
                    <td className="px-5 py-4 text-slate-600">{statusLabel(client.intake_status)}</td>
                    <td className="px-5 py-4">
                      <ScoreBadge score={client.score?.total_score} />
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      {new Date(client.updated_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
