import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("clients")
    .select("*, readiness_scores(total_score)")
    .eq("broker_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { businessName, ownerName, ownerContact } = await request.json();

  if (!businessName?.trim() || !ownerName?.trim()) {
    return NextResponse.json(
      { error: "Business name and owner name are required." },
      { status: 400 }
    );
  }

  // Ensure broker row exists (idempotent — uses email as initial name).
  await supabase.from("brokers").upsert(
    { id: user.id, email: user.email!, name: user.email! },
    { onConflict: "id", ignoreDuplicates: true }
  );

  const intakeToken = crypto.randomUUID();

  const { data, error } = await supabase
    .from("clients")
    .insert({
      broker_id: user.id,
      business_name: businessName.trim(),
      owner_name: ownerName.trim(),
      owner_contact: ownerContact?.trim() ?? null,
      intake_token: intakeToken,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
