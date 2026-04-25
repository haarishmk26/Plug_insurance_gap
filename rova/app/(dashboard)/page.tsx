import Link from "next/link";
import { ArrowRight, ClipboardCheck, FileText, MessageCircle } from "lucide-react";

const workflow = [
  {
    title: "Create client",
    description: "Add the business owner and generate a Telegram intake link.",
    icon: MessageCircle,
  },
  {
    title: "Review dossier",
    description: "Read ACORD answers, uploaded files, and readiness scoring.",
    icon: ClipboardCheck,
  },
  {
    title: "Export package",
    description: "Download the broker-ready PDF for manual submission.",
    icon: FileText,
  },
];

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <section className="grid gap-6 border-b border-slate-200 pb-8 lg:grid-cols-[1fr_320px]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">
            Phase 1
          </p>
          <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-normal text-slate-950 sm:text-4xl">
            Broker intake dashboard
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            Create a client intake, track completion, review the ACORD-aligned
            dossier, and export the broker package.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/clients/new"
              className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              New client
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
        <div className="rounded-md border border-slate-200 bg-white p-5">
          <p className="text-sm font-medium text-slate-500">Current queue</p>
          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-sm text-slate-600">Pending intake</span>
              <span className="text-sm font-semibold">0</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-sm text-slate-600">In progress</span>
              <span className="text-sm font-semibold">0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Ready for review</span>
              <span className="text-sm font-semibold">0</span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {workflow.map((item) => (
          <div key={item.title} className="rounded-md border border-slate-200 bg-white p-5">
            <item.icon className="size-5 text-emerald-700" aria-hidden="true" />
            <h2 className="mt-4 text-base font-semibold text-slate-950">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
          </div>
        ))}
      </section>

      <section className="rounded-md border border-dashed border-slate-300 bg-white p-8 text-center">
        <h2 className="text-base font-semibold text-slate-950">No client intakes yet</h2>
        <Link
          href="/clients/new"
          className="mt-4 inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
        >
          New client
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </section>
    </div>
  );
}
