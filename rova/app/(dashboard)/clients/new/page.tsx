export default function NewClientPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="border-b border-slate-200 pb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">
          Client intake
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">New client</h1>
      </div>

      <form className="mt-6 space-y-5 rounded-md border border-slate-200 bg-white p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-slate-700">
            Business name
            <input
              className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-slate-500"
              name="businessName"
              type="text"
            />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            Owner name
            <input
              className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-slate-500"
              name="ownerName"
              type="text"
            />
          </label>
        </div>
        <label className="block space-y-2 text-sm font-medium text-slate-700">
          Owner contact
          <input
            className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-slate-500"
            name="ownerContact"
            type="text"
          />
        </label>
        <div className="flex justify-end">
          <button
            className="rounded-md bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            disabled
            type="button"
          >
            Create client
          </button>
        </div>
      </form>
    </div>
  );
}
