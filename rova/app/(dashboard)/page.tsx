import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ScoreBadge } from "@/components/score-badge";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  in_progress: "In progress",
  complete: "Complete",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-slate-100 text-slate-500",
  in_progress: "bg-blue-50 text-blue-700",
  complete: "bg-emerald-50 text-emerald-700",
};

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: clients } = await supabase
    .from("clients")
    .select("*, readiness_scores(total_score)")
    .eq("broker_id", user!.id)
    .order("updated_at", { ascending: false });

  const counts = {
    pending: clients?.filter((c) => c.intake_status === "pending").length ?? 0,
    in_progress: clients?.filter((c) => c.intake_status === "in_progress").length ?? 0,
    complete: clients?.filter((c) => c.intake_status === "complete").length ?? 0,
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Header */}
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
          <div className="mt-6">
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

      {/* Client list */}
      {!clients?.length ? (
        <section className="rounded-md border border-dashed border-slate-300 bg-white p-8 text-center">
          <h2 className="text-base font-semibold text-slate-950">
            No client intakes yet
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Create a client to generate a Telegram intake link.
          </p>
          <Link
            href="/clients/new"
            className="mt-4 inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
          >
            New client
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </section>
      ) : (
        <section>
          <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Business
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Owner
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Score
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Updated
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clients.map((client) => {
                  const score = client.readiness_scores?.[0]?.total_score ?? null;
                  const status = client.intake_status as string;
                  return (
                    <tr key={client.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-950">
                        {client.business_name}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {client.owner_name}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[status] ?? STATUS_COLOR.pending}`}
                        >
                          {STATUS_LABEL[status] ?? status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <ScoreBadge score={score} />
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(client.updated_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/clients/${client.id}`}
                          className="text-xs font-medium text-slate-700 hover:text-slate-950 hover:underline"
                        >
                          View →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
