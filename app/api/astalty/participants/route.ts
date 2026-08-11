import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { astaltyEnabled, listAstaltyParticipants } from "@/lib/astalty/client";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorised" }, { status: 401 });

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (me?.role !== "staff" && me?.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  if (!astaltyEnabled()) {
    return NextResponse.json(
      { error: "Astalty isn't connected (no API token)." },
      { status: 503 },
    );
  }

  let list;
  try {
    list = await listAstaltyParticipants();
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Astalty request failed" },
      { status: 502 },
    );
  }

  // Mark participants already onboarded into the app.
  const { data: existing } = await supabase
    .from("profiles")
    .select("astalty_id")
    .not("astalty_id", "is", null);
  const imported = new Set((existing ?? []).map((e) => e.astalty_id as string));

  return NextResponse.json({
    participants: list.map((p) => ({
      ...p,
      alreadyImported: imported.has(p.id),
    })),
  });
}
