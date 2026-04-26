"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Copy, MessageCircle } from "lucide-react";

const BOT_USERNAME =
  process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? "DistrictCoverBot";

interface CreatedClient {
  id: string;
  business_name: string;
  owner_name: string;
  intake_token: string;
}

export default function NewClientPage() {
  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerContact, setOwnerContact] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [client, setClient] = useState<CreatedClient | null>(null);
  const [copied, setCopied] = useState(false);

  const telegramLink = client
    ? `https://t.me/${BOT_USERNAME}?start=${client.intake_token}`
    : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessName, ownerName, ownerContact }),
    });

    const json = await res.json();

    if (!res.ok) {
      setError(json.error ?? "Something went wrong.");
      setLoading(false);
      return;
    }

    setClient(json);
    setLoading(false);
  }

  async function handleCopy() {
    if (!telegramLink) return;
    await navigator.clipboard.writeText(telegramLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (client && telegramLink) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="border-b border-slate-200 pb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">
            Client intake
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-950">
            Client created
          </h1>
        </div>

        <div className="mt-6 space-y-4">
          {/* Success card */}
          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-5">
            <div className="flex items-start gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <Check className="size-4" aria-hidden="true" />
              </div>
              <div>
                <p className="font-semibold text-emerald-900">
                  {client.business_name}
                </p>
                <p className="mt-0.5 text-sm text-emerald-700">
                  Owner: {client.owner_name}
                </p>
              </div>
            </div>
          </div>

          {/* Telegram link */}
          <div className="rounded-md border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <MessageCircle className="size-4 text-slate-500" aria-hidden="true" />
              <p className="text-sm font-semibold text-slate-950">
                Telegram intake link
              </p>
            </div>
            <p className="mt-1.5 text-sm text-slate-500">
              Send this link to {client.owner_name}. They can open it directly
              in Telegram to start their intake.
            </p>

            <div className="mt-4 flex items-center gap-2">
              <input
                readOnly
                value={telegramLink}
                className="min-w-0 flex-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
              />
              <button
                onClick={handleCopy}
                className="inline-flex shrink-0 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                {copied ? (
                  <>
                    <Check className="size-4 text-emerald-600" aria-hidden="true" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="size-4" aria-hidden="true" />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href={`/clients/${client.id}`}
              className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              View dossier
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <button
              onClick={() => {
                setClient(null);
                setBusinessName("");
                setOwnerName("");
                setOwnerContact("");
              }}
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Add another client
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="border-b border-slate-200 pb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">
          Client intake
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">
          New client
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Fill in the business details. A unique Telegram intake link will be
          generated for the owner.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5 rounded-md border border-slate-200 bg-white p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="businessName" className="block text-sm font-medium text-slate-700">
              Business name <span className="text-red-500">*</span>
            </label>
            <input
              id="businessName"
              name="businessName"
              type="text"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
              placeholder="Golden Gate Deli"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="ownerName" className="block text-sm font-medium text-slate-700">
              Owner name <span className="text-red-500">*</span>
            </label>
            <input
              id="ownerName"
              name="ownerName"
              type="text"
              required
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
              placeholder="Maria Santos"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="ownerContact" className="block text-sm font-medium text-slate-700">
            Owner contact
            <span className="ml-1.5 text-xs font-normal text-slate-400">phone or email — optional</span>
          </label>
          <input
            id="ownerContact"
            name="ownerContact"
            type="text"
            value={ownerContact}
            onChange={(e) => setOwnerContact(e.target.value)}
            className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
            placeholder="+1 415 555 0100"
          />
        </div>

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? "Creating…" : "Create client"}
          </button>
        </div>
      </form>
    </div>
  );
}
