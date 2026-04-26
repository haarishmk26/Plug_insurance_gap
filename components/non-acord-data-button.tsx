'use client'

import { useId, useState } from 'react'

import { NON_ACORD_PRIVATE_DATA_ITEMS } from '@/lib/dashboard/non-acord-data'

export function NonAcordDataButton() {
  const [isOpen, setIsOpen] = useState(false)
  const titleId = useId()

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
      >
        Non-ACORD data
      </button>

      {isOpen ? (
        <div
          aria-labelledby={titleId}
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end bg-slate-950/35 px-3 py-3 backdrop-blur-sm sm:items-center sm:px-6"
          role="dialog"
        >
          <div className="mx-auto max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-md bg-white shadow-2xl">
            <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-normal text-emerald-700">Private underwriting evidence</p>
                  <h2 id={titleId} className="mt-1 text-xl font-semibold text-slate-950">
                    Non-ACORD 125 data used in the readiness score
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
                >
                  Close
                </button>
              </div>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                These are business-supplied private signals that do not live cleanly on ACORD 125. They help the broker
                prove risk controls, explain the score, and package the business for better carrier review.
              </p>
            </div>

            <div className="grid border-b border-slate-100 sm:grid-cols-3">
              <div className="px-5 py-4 sm:px-6">
                <p className="text-xs font-semibold uppercase text-slate-400">Coverage</p>
                <p className="mt-1 text-sm leading-6 text-slate-700">Converts hidden improvements into underwriter evidence.</p>
              </div>
              <div className="border-t border-slate-100 px-5 py-4 sm:border-l sm:border-t-0 sm:px-6">
                <p className="text-xs font-semibold uppercase text-slate-400">Cost</p>
                <p className="mt-1 text-sm leading-6 text-slate-700">Reduces uncertainty that can become premium load or decline logic.</p>
              </div>
              <div className="border-t border-slate-100 px-5 py-4 sm:border-l sm:border-t-0 sm:px-6">
                <p className="text-xs font-semibold uppercase text-slate-400">Business</p>
                <p className="mt-1 text-sm leading-6 text-slate-700">Turns vague insurance feedback into concrete fixes.</p>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {NON_ACORD_PRIVATE_DATA_ITEMS.map((item) => (
                <section key={item.label} className="px-5 py-5 sm:px-6">
                  <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-950">{item.label}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-500">{item.collected}</p>
                    </div>
                    <div className="grid gap-3 md:grid-cols-3">
                      <div>
                        <p className="text-xs font-semibold uppercase text-slate-400">Get coverage</p>
                        <p className="mt-1 text-sm leading-6 text-slate-700">{item.coverageUse}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase text-slate-400">Reduce cost</p>
                        <p className="mt-1 text-sm leading-6 text-slate-700">{item.costUse}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase text-slate-400">Help business</p>
                        <p className="mt-1 text-sm leading-6 text-slate-700">{item.businessHelp}</p>
                      </div>
                    </div>
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

