import { NewClientForm } from '@/components/new-client-form'

export default function NewClientPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="border-b border-slate-200 pb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">Client intake</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">New client</h1>
        <p className="mt-2 text-sm text-slate-500">
          Fill in the business details. A unique Telegram intake link will be generated for the owner.
        </p>
      </div>

      <NewClientForm />
    </div>
  )
}
