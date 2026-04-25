"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setConfirming(true);
    setLoading(false);
  }

  if (confirming) {
    return (
      <div className="w-full max-w-sm px-4">
        <div className="rounded-xl border border-slate-200 bg-white px-8 py-10 shadow-sm text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
            <ShieldCheck className="size-6" aria-hidden="true" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-slate-950">Check your email</h2>
          <p className="mt-2 text-sm text-slate-600">
            We sent a confirmation link to <span className="font-medium">{email}</span>. Click it to activate your account.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block text-sm font-medium text-slate-700 underline underline-offset-2 hover:text-slate-950"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm px-4">
      <div className="rounded-xl border border-slate-200 bg-white px-8 py-10 shadow-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-lg bg-slate-950 text-white">
            <ShieldCheck className="size-6" aria-hidden="true" />
          </div>
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Rova
            </p>
            <p className="mt-0.5 text-lg font-semibold text-slate-950">
              Create an account
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-700"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 placeholder-slate-400 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-700"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 placeholder-slate-400 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              placeholder="Min. 8 characters"
            />
          </div>

          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-slate-700 underline underline-offset-2 hover:text-slate-950"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
