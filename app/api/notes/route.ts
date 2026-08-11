import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getParticipantGoals } from "@/lib/goals/provider";
import { draftPeriodNote } from "@/lib/ai/jobs";
import type { CompletionWithQuest, Cadence } from "@/lib/types";

function periodFor(cadence: Cadence): {
  start: Date;
  end: Date;
  label: string;
} {
  const now = new Date();
  if (cadence === "weekly") {
    const day = (now.getDay() + 6) % 7; // Monday = 0
    const start = new Date(now);
    start.setDate(now.getDate() - day);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return {
      start,
      end,
      label: `Week of ${start.toLocaleDateString()}`,
    };
  }
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return {
    start,
    end,
    label: start.toLocaleString(undefined, { month: "long", year: "numeric" }),
  };
}

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

  const body = await req.json().catch(() => ({}));
  const action = body.action as "draft" | "approve" | "update";

  if (action === "approve") {
    const { error } = await supabase
      .from("period_notes")
      .update({
        status: "approved",
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      })
      .eq("id", body.noteId);
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "update") {
    const { error } = await supabase
      .from("period_notes")
      .update({ draft_body: body.draftBody })
      .eq("id", body.noteId);
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // action === 'draft'
  const participantId = body.participantId as string;
  if (!participantId)
    return NextResponse.json({ error: "participantId required" }, { status: 400 });

  const { data: participant } = await supabase
    .from("profiles")
    .select("display_name, cadence")
    .eq("id", participantId)
    .single();
  const cadence: Cadence = (body.cadence ?? participant?.cadence ?? "monthly") as Cadence;
  const { start, end, label } = periodFor(cadence);

  const { data: completionsData } = await supabase
    .from("completions")
    .select(
      "*, quest:quests(title,category,capacities,skills_built,difficulty)",
    )
    .eq("participant_id", participantId)
    .gte("completed_at", start.toISOString())
    .lte("completed_at", end.toISOString())
    .order("completed_at", { ascending: true });
  const completions = (completionsData as CompletionWithQuest[]) ?? [];
  const goals = await getParticipantGoals(participantId);

  const { body: draftBody, source } = await draftPeriodNote({
    participantName: participant?.display_name ?? "Participant",
    cadence,
    periodLabel: label,
    completions,
    goals,
  });

  const { data: note, error } = await supabase
    .from("period_notes")
    .insert({
      participant_id: participantId,
      period_start: start.toISOString().slice(0, 10),
      period_end: end.toISOString().slice(0, 10),
      cadence,
      draft_body: draftBody,
      status: "draft",
    })
    .select("*")
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    ok: true,
    note,
    source,
    completions: completions.length,
  });
}
