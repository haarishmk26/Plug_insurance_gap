import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText, Image } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ScoreBadge } from "@/components/score-badge";

// Human-readable labels for every ACORD question key.
const FIELD_LABELS: Record<string, string> = {
  // Section A
  a_business_name: "Business name",
  a_entity_type: "Entity type",
  a_fein: "FEIN",
  a_date_started: "Date started",
  a_website: "Website",
  a_phone: "Phone",
  // Section B
  b_address: "Address",
  b_ownership: "Ownership",
  b_landlord: "Landlord",
  b_total_sqft: "Total sq ft",
  b_occupied_sqft: "Occupied sq ft",
  b_public_sqft: "Public sq ft",
  b_sublease: "Sublease",
  b_annual_revenue: "Annual revenue",
  b_fulltime_employees: "Full-time employees",
  b_parttime_employees: "Part-time employees",
  b_operations: "Description of operations",
  // Section C
  c_subsidiary: "Subsidiary / parent",
  c_safety_manual: "Safety manual",
  c_hazardous_materials: "Hazardous materials",
  c_other_insurance: "Other insurance",
  c_prior_cancellation: "Prior cancellation",
  c_discrimination_claims: "Discrimination claims",
  c_arson: "Arson history",
  c_code_violations: "Code violations",
  c_bankruptcy: "Bankruptcy",
  c_judgements: "Judgements",
  c_trust: "Trust",
  c_foreign_operations: "Foreign operations",
  c_other_ventures: "Other ventures",
  c_drones: "Drones",
  // Section D
  d_roof_age: "Roof age",
  d_roof_inspection: "Roof inspection",
  d_electrical_panel: "Electrical panel",
  d_electrical_photo: "Electrical photo",
  d_sprinklers: "Sprinklers",
  d_sprinkler_certificate: "Sprinkler certificate",
  d_alarm_system: "Alarm system",
  d_alarm_contract: "Alarm contract",
  d_fire_extinguishers: "Fire extinguishers",
  d_extinguisher_photo: "Extinguisher photo",
  // Section E
  e_prior_carrier: "Prior carrier",
  e_prior_policy_number: "Prior policy number",
  e_prior_policy_dates: "Prior policy dates",
  e_prior_premium: "Prior premium",
  e_claims: "Claims",
  e_claims_detail: "Claims detail",
};

const ACORD_SECTIONS = [
  { key: "section_a", label: "Section A — Applicant Identity" },
  { key: "section_b", label: "Section B — Premises" },
  { key: "section_c", label: "Section C — General Information" },
  { key: "section_d", label: "Section D — Physical Property" },
  { key: "section_e", label: "Section E — Loss History" },
];

const SCORE_DIMENSIONS = [
  { key: "documentation_score", label: "Documentation", max: 25 },
  { key: "safety_score", label: "Safety", max: 25 },
  { key: "property_score", label: "Property", max: 20 },
  { key: "claims_score", label: "Claims", max: 20 },
  { key: "neighborhood_score", label: "Neighborhood", max: 10 },
];

export default async function ClientDossierPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch client (RLS ensures this broker owns it)
  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", params.id)
    .eq("broker_id", user!.id)
    .single();

  if (!client) notFound();

  // Fetch related data in parallel
  const [{ data: intakeData }, { data: uploads }, { data: score }] =
    await Promise.all([
      supabase
        .from("intake_data")
        .select("*")
        .eq("client_id", client.id)
        .single(),
      supabase
        .from("uploads")
        .select("*")
        .eq("client_id", client.id)
        .order("uploaded_at", { ascending: true }),
      supabase
        .from("readiness_scores")
        .select("*")
        .eq("client_id", client.id)
        .single(),
    ]);

  const telegramLink = `https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? "DistrictCoverBot"}?start=${client.intake_token}`;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-950"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          All clients
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-slate-950">
              {client.business_name}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Owner: {client.owner_name}
              {client.owner_contact ? ` · ${client.owner_contact}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ScoreBadge score={score?.total_score} />
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                client.intake_status === "complete"
                  ? "bg-emerald-50 text-emerald-700"
                  : client.intake_status === "in_progress"
                  ? "bg-blue-50 text-blue-700"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {client.intake_status === "complete"
                ? "Complete"
                : client.intake_status === "in_progress"
                ? "In progress"
                : "Pending"}
            </span>
          </div>
        </div>
      </div>

      {/* Telegram link (shown when intake is not complete) */}
      {client.intake_status !== "complete" && (
        <div className="rounded-md border border-slate-200 bg-white p-5">
          <p className="text-sm font-semibold text-slate-950">Intake link</p>
          <p className="mt-1 text-sm text-slate-500">
            Share this with {client.owner_name} to start or resume their Telegram intake.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <input
              readOnly
              value={telegramLink}
              className="min-w-0 flex-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
            />
          </div>
        </div>
      )}

      {/* Readiness score breakdown */}
      {score && (
        <div className="rounded-md border border-slate-200 bg-white p-5">
          <div className="flex items-baseline justify-between">
            <p className="font-semibold text-slate-950">Readiness score</p>
            <span className="text-2xl font-bold text-slate-950">
              {score.total_score}
              <span className="text-sm font-normal text-slate-400">/100</span>
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {SCORE_DIMENSIONS.map(({ key, label, max }) => {
              const val = (score as Record<string, number>)[key] ?? 0;
              const pct = Math.round((val / max) * 100);
              return (
                <div key={key}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{label}</span>
                    <span className="font-medium text-slate-950">
                      {val}/{max}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ACORD sections */}
      {intakeData ? (
        <div className="space-y-4">
          {ACORD_SECTIONS.map(({ key, label }) => {
            const section = (intakeData as Record<string, Record<string, unknown>>)[key] ?? {};
            const entries = Object.entries(section).filter(([, v]) => v !== "" && v != null && v !== false);

            return (
              <div key={key} className="rounded-md border border-slate-200 bg-white">
                <div className="border-b border-slate-100 px-5 py-3.5">
                  <p className="text-sm font-semibold text-slate-950">{label}</p>
                </div>
                {entries.length === 0 ? (
                  <p className="px-5 py-4 text-sm text-slate-400 italic">
                    No answers yet.
                  </p>
                ) : (
                  <dl className="divide-y divide-slate-50">
                    {entries.map(([fieldKey, value]) => (
                      <div
                        key={fieldKey}
                        className="grid grid-cols-2 gap-4 px-5 py-3 text-sm sm:grid-cols-3"
                      >
                        <dt className="font-medium text-slate-500">
                          {FIELD_LABELS[fieldKey] ?? fieldKey}
                        </dt>
                        <dd className="col-span-1 text-slate-950 sm:col-span-2">
                          {String(value)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-md border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-400">
          ACORD intake not started yet.
        </div>
      )}

      {/* Uploads */}
      <div className="rounded-md border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-3.5">
          <p className="text-sm font-semibold text-slate-950">Uploaded documents</p>
        </div>
        {!uploads?.length ? (
          <p className="px-5 py-4 text-sm text-slate-400 italic">
            No uploads yet.
          </p>
        ) : (
          <ul className="divide-y divide-slate-50">
            {uploads.map((upload) => (
              <li key={upload.id} className="flex items-center gap-3 px-5 py-3">
                {upload.file_type === "photo" ? (
                  <Image className="size-4 shrink-0 text-slate-400" aria-hidden="true" />
                ) : (
                  <FileText className="size-4 shrink-0 text-slate-400" aria-hidden="true" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-950">
                    {upload.label ?? upload.file_name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {upload.file_name} ·{" "}
                    {new Date(upload.uploaded_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Export placeholder */}
      <div className="flex justify-end pb-4">
        <button
          disabled
          className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-400 cursor-not-allowed"
          title="PDF export coming soon"
        >
          <FileText className="size-4" aria-hidden="true" />
          Export PDF
        </button>
      </div>
    </div>
  );
}
