import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ScheduleSession } from "@/lib/types";

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

  // Restrict to the participant's own sessions.
  const { data: sessionsData } = await supabase
    .from("schedule_sessions")
    .select("id")
    .eq("participant_id", user.id);
  const ownSessionIds = (sessionsData ?? []).map((s) => s.id);
  if (ownSessionIds.length === 0) return NextResponse.json({ links: [] });

  const { data } = await supabase
    .from("session_quests")
    .select("id, session_id, recurrence, scheduled_date")
    .eq("quest_id", questId)
    .in("session_id", ownSessionIds);

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

// Attach a quest to one or more of the participant's own sessions.
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

  // Only operate on sessions that belong to this participant (RLS also guards).
  const { data: sessionsData } = await supabase
    .from("schedule_sessions")
    .select("id, weekday")
    .in("id", sessionIds)
    .eq("participant_id", user.id);
  const sessions = (sessionsData as Pick<ScheduleSession, "id" | "weekday">[]) ?? [];
  if (sessions.length === 0) {
    return NextResponse.json({ error: "no matching sessions" }, { status: 400 });
  }

  // Skip sessions that already have this quest at the same recurrence/date.
  const { data: existingData } = await supabase
    .from("session_quests")
    .select("session_id, recurrence, scheduled_date")
    .eq("quest_id", questId)
    .in(
      "session_id",
      sessions.map((s) => s.id),
    );
  const existing = existingData ?? [];

  const rows = sessions
    .map((s) => ({
      session_id: s.id,
      quest_id: questId,
      recurrence,
      scheduled_date:
        recurrence === "once" ? nextDateForWeekday(s.weekday) : null,
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

  // RLS (sq_delete_own) ensures a participant can only delete links on their
  // own sessions.
  const { error } = await supabase
    .from("session_quests")
    .delete()
    .eq("id", linkId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
