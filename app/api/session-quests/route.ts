import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Session } from "@/lib/types";

// This participant's links for one quest (used for optimistic UI refresh).
export async function GET(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorised" }, { status: 401 });

  const questId = new URL(req.url).searchParams.get("questId");
  if (!questId) {
    return NextResponse.json({ error: "questId required" }, { status: 400 });
  }

  // RLS (sq_select_own) scopes session_quests to this participant.
  const { data } = await supabase
    .from("session_quests")
    .select("id, session_id, recurrence, scheduled_date")
    .eq("quest_id", questId);

  return NextResponse.json({ links: data ?? [] });
}

/** Next date (today or later) whose ISO weekday (1=Mon..7=Sun) matches. */
function nextDateForWeekday(weekday: number): string {
  const today = new Date();
  const todayIso = today.getDay() === 0 ? 7 : today.getDay();
  const delta = (weekday - todayIso + 7) % 7;
  const d = new Date(today);
  d.setDate(today.getDate() + delta);
  return d.toISOString().slice(0, 10);
}

// Attach a quest to one or more of the participant's assigned NDIS sessions.
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorised" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const questId: string | undefined = body.questId;
  const sessionIds: string[] = Array.isArray(body.sessionIds)
    ? body.sessionIds
    : [];
  const recurrence: "once" | "weekly" =
    body.recurrence === "once" ? "once" : "weekly";

  if (!questId || sessionIds.length === 0) {
    return NextResponse.json(
      { error: "questId and at least one sessionId required" },
      { status: 400 },
    );
  }

  // Only operate on sessions this participant is actually assigned to. RLS on
  // session_customers already restricts this to their own assignment; joining
  // the catalogue gives us the weekday for once-off scheduling.
  type AssignedRow = { session: Pick<Session, "id" | "weekday"> | null };
  const { data: assignedData } = await supabase
    .from("session_customers")
    .select("session:sessions(id,weekday)");
  const assigned = new Map<string, number>();
  for (const r of (assignedData as AssignedRow[] | null) ?? []) {
    if (r.session) assigned.set(r.session.id, r.session.weekday);
  }
  const targets = sessionIds.filter((id) => assigned.has(id));
  if (targets.length === 0) {
    return NextResponse.json({ error: "no matching sessions" }, { status: 400 });
  }

  // Skip sessions that already have this quest at the same recurrence/date.
  const { data: existingData } = await supabase
    .from("session_quests")
    .select("session_id, recurrence, scheduled_date")
    .eq("quest_id", questId)
    .in("session_id", targets);
  const existing = existingData ?? [];

  const rows = targets
    .map((sessionId) => ({
      participant_id: user.id,
      session_id: sessionId,
      quest_id: questId,
      recurrence,
      scheduled_date:
        recurrence === "once"
          ? nextDateForWeekday(assigned.get(sessionId)!)
          : null,
      added_by: user.id,
    }))
    .filter(
      (row) =>
        !existing.some(
          (e) =>
            e.session_id === row.session_id &&
            e.recurrence === row.recurrence &&
            e.scheduled_date === row.scheduled_date,
        ),
    );

  if (rows.length === 0) {
    return NextResponse.json({ ok: true, added: 0 });
  }

  const { data: inserted, error } = await supabase
    .from("session_quests")
    .insert(rows)
    .select("id");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, added: inserted?.length ?? 0 });
}

// Remove a single quest↔session link the participant owns.
export async function DELETE(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorised" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const linkId: string | undefined = body.linkId;
  if (!linkId) {
    return NextResponse.json({ error: "linkId required" }, { status: 400 });
  }

  // RLS (sq_delete_own) ensures a participant can only delete their own links.
  const { error } = await supabase
    .from("session_quests")
    .delete()
    .eq("id", linkId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
