'use client'

import { useId, useState } from 'react'

import {
  COST_REDUCTION_ACTIONS,
  PREMIUM_BASELINE,
  SAVINGS_HORIZON_YEARS,
  projectedGrossSavings,
  projectedNetSavings,
  totalImplementationCost,
  totalProjectedGrossSavings,
  totalProjectedNetSavings,
} from '@/lib/dashboard/cost-reduction-plan'

function money(value: number) {
  return new Intl.NumberFormat('en-US', {
    currency: 'USD',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(value)
}

export function CostReductionPlanButton() {
  const [isOpen, setIsOpen] = useState(false)
  const titleId = useId()

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center justify-center rounded-md bg-slate-950 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
      >
        Cost reduction plan
      </button>

      {isOpen ? (
        <div
          aria-labelledby={titleId}
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end bg-slate-950/35 px-3 py-3 backdrop-blur-sm sm:items-center sm:px-6"
          role="dialog"
        >
          <div className="mx-auto max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-md bg-white shadow-2xl">
            <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-normal text-emerald-700">
                    Readiness actions
                  </p>
                  <h2 id={titleId} className="mt-1 text-xl font-semibold text-slate-950">
                    Suggested building changes and projected savings
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
                Based on the private building evidence and the current {money(PREMIUM_BASELINE)} prior premium, this
                plan turns readiness signals into practical actions for broker review. Savings are planning estimates,
                not guaranteed carrier credits or a scoring formula.
              </p>
            </div>

            <div className="grid border-b border-slate-100 sm:grid-cols-3">
              <div className="px-5 py-4 sm:px-6">
                <p className="text-xs font-semibold uppercase text-slate-400">Estimated investment</p>
                <p className="mt-1 text-2xl font-semibold text-slate-950">{money(totalImplementationCost())}</p>
                <p className="mt-1 text-sm text-slate-500">Over {SAVINGS_HORIZON_YEARS} years</p>
              </div>
              <div className="border-t border-slate-100 px-5 py-4 sm:border-l sm:border-t-0 sm:px-6">
                <p className="text-xs font-semibold uppercase text-slate-400">Projected gross savings</p>
                <p className="mt-1 text-2xl font-semibold text-slate-950">{money(totalProjectedGrossSavings())}</p>
                <p className="mt-1 text-sm text-slate-500">Before action costs</p>
              </div>
              <div className="border-t border-slate-100 px-5 py-4 sm:border-l sm:border-t-0 sm:px-6">
                <p className="text-xs font-semibold uppercase text-slate-400">Projected net savings</p>
                <p className="mt-1 text-2xl font-semibold text-emerald-700">{money(totalProjectedNetSavings())}</p>
                <p className="mt-1 text-sm text-slate-500">After {SAVINGS_HORIZON_YEARS} years</p>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {COST_REDUCTION_ACTIONS.map((action) => (
                <section key={action.label} className="px-5 py-5 sm:px-6">
                  <div className="grid gap-4 lg:grid-cols-[230px_1fr_170px]">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-950">{action.label}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-500">{action.signal}</p>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <p className="text-xs font-semibold uppercase text-slate-400">Qualification focus</p>
                        <p className="mt-1 text-sm leading-6 text-slate-700">{action.qualificationFocus}</p>
                        <p className="mt-3 text-xs font-semibold uppercase text-slate-400">Recommended change</p>
                        <p className="mt-1 text-sm leading-6 text-slate-700">{action.recommendation}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase text-slate-400">Broker positioning</p>
                        <p className="mt-1 text-sm leading-6 text-slate-700">{action.brokerPositioning}</p>
                        <p className="mt-3 text-xs font-semibold uppercase text-slate-400">Why it can lower cost</p>
                        <p className="mt-1 text-sm leading-6 text-slate-700">{action.reason}</p>
                      </div>
                    </div>
                    <div className="rounded-md bg-slate-50 p-3">
                      <p className="text-xs font-semibold uppercase text-slate-400">Projection</p>
                      <p className="mt-2 text-sm text-slate-600">Cost: {money(action.implementationCost)}</p>
                      <p className="mt-1 text-sm text-slate-600">Annual impact: {money(action.annualSavings)}</p>
                      <p className="mt-2 text-sm font-semibold text-emerald-700">
                        {money(projectedNetSavings(action))} net after {SAVINGS_HORIZON_YEARS} years
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {money(projectedGrossSavings(action))} gross projected savings
                      </p>
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
