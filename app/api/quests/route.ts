import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { QuestDraft } from "@/lib/ai/jobs";

export async function POST(req: Request) {
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

  const draft = (await req.json().catch(() => null)) as QuestDraft | null;
  if (!draft || !draft.title) {
    return NextResponse.json({ error: "quest draft required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("quests")
    .insert({
      title: draft.title,
      category: draft.category,
      style: draft.style,
      type: draft.type,
      difficulty: draft.difficulty,
      est_minutes: draft.est_minutes,
      location: draft.location,
      description: draft.description,
      steps: (draft.steps ?? []).map((s) => s.trim()).filter(Boolean),
      skills_built: draft.skills_built,
      capacities: draft.capacities,
      xp: draft.xp,
      yn_questions: draft.yn_questions,
      created_by: user.id,
      is_active: true,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, id: data.id });
}
