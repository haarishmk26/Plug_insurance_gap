import Link from 'next/link'

import { ScoreBadge } from '@/components/score-badge'
import {
  ACORD_SECTIONS,
  SCORE_DIMENSIONS,
  buildTelegramLink,
  collectSectionEntries,
  getUploadGroups,
} from '@/lib/dashboard/dossier'
import { getDossierData } from '@/lib/dashboard/data'
import type { IntakeSectionKey, ReadinessScore } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

function statusClass(status: string) {
  if (status === 'complete') return 'bg-emerald-50 text-emerald-700'
  if (status === 'in_progress') return 'bg-blue-50 text-blue-700'
  return 'bg-slate-100 text-slate-500'
}

function statusLabel(status: string) {
  if (status === 'complete') return 'Complete'
  if (status === 'in_progress') return 'In progress'
  return 'Pending'
}

function dimensionValue(score: ReadinessScore, key: string) {
  return Number((score as unknown as Record<string, number>)[key] ?? 0)
}

export default async function ClientDossierPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string }
}) {
  const { id } = await params
  const { client, intakeData, uploads, score } = await getDossierData(id)
  const telegramLink = buildTelegramLink(
    client.intake_token,
    process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? 'DistrictCoverBot',
  )
  const uploadGroups = getUploadGroups(uploads)

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <Link href="/" className="mb-4 inline-flex text-sm text-slate-500 hover:text-slate-950">
          Back to clients
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-slate-950">{client.business_name}</h1>
            <p className="mt-1 text-sm text-slate-500">
              Owner: {client.owner_name}
              {client.owner_contact ? ` | ${client.owner_contact}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ScoreBadge score={score?.total_score} />
            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(client.intake_status)}`}>
              {statusLabel(client.intake_status)}
            </span>
          </div>
        </div>
      </div>

      {client.intake_status !== 'complete' ? (
        <section className="rounded-md border border-slate-200 bg-white p-5">
          <p className="text-sm font-semibold text-slate-950">Intake link</p>
          <p className="mt-1 text-sm text-slate-500">Share this with {client.owner_name} to start or resume intake.</p>
          <input
            readOnly
            value={telegramLink}
            className="mt-3 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
          />
        </section>
      ) : null}

      {score ? (
        <section className="rounded-md border border-slate-200 bg-white p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="font-semibold text-slate-950">Readiness score</h2>
            <span className="text-2xl font-bold text-slate-950">
              {score.total_score}
              <span className="text-sm font-normal text-slate-400">/100</span>
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {SCORE_DIMENSIONS.map(({ key, label, max }) => {
              const value = dimensionValue(score, key)
              return (
                <div key={key}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{label}</span>
                    <span className="font-medium text-slate-950">
                      {value}/{max}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.round((value / max) * 100)}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      ) : (
        <section className="rounded-md border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-400">
          Readiness score will appear after intake completion.
        </section>
      )}

      <section className="space-y-4">
        {ACORD_SECTIONS.map(({ key, label }) => {
          const section = intakeData?.[key as IntakeSectionKey] ?? {}
          const entries = collectSectionEntries(section)

          return (
            <div key={key} className="rounded-md border border-slate-200 bg-white">
              <div className="border-b border-slate-100 px-5 py-3.5">
                <h2 className="text-sm font-semibold text-slate-950">{label}</h2>
              </div>
              {entries.length === 0 ? (
                <p className="px-5 py-4 text-sm italic text-slate-400">No answers yet.</p>
              ) : (
                <dl className="divide-y divide-slate-50">
                  {entries.map((entry) => (
                    <div key={entry.key} className="grid gap-2 px-5 py-3 text-sm sm:grid-cols-3">
                      <dt className="font-medium text-slate-500">{entry.label}</dt>
                      <dd className="text-slate-950 sm:col-span-2">{entry.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          )
        })}
      </section>

      <section className="rounded-md border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-3.5">
          <h2 className="text-sm font-semibold text-slate-950">Uploaded documents</h2>
        </div>
        {uploadGroups.length === 0 ? (
          <p className="px-5 py-4 text-sm italic text-slate-400">No uploads yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {uploadGroups.map((group) => (
              <div key={group.label} className="px-5 py-4">
                <p className="text-sm font-semibold text-slate-950">{group.label}</p>
                <ul className="mt-2 space-y-1 text-sm text-slate-600">
                  {group.uploads.map((upload) => (
                    <li key={upload.id}>
                      {upload.file_name} | {upload.file_type} |{' '}
                      {new Date(upload.uploaded_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="flex justify-end pb-4">
        <a
          href={`/api/export/${client.id}`}
          className="rounded-md bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          Export PDF
        </a>
      </div>
    </div>
  )
}
