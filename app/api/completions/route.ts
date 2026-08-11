import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getParticipantGoals } from "@/lib/goals/provider";
import { mapGoals } from "@/lib/ai/jobs";
import { XP_BY_DIFFICULTY, xpForCompletion } from "@/lib/gamification";
import type { Quest, YNAnswer, EvidenceGrade } from "@/lib/types";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorised" }, { status: 401 });

  const { data: me } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .single();
  const isStaff = me?.role === "staff" || me?.role === "admin";

  const body = await req.json().catch(() => ({}));
  const {
    questId = null,
    freeFormTitle = null,
    ynAnswers = [] as YNAnswer[],
    chosen = true,
    participantId,
    swPresent = false,
    swName = null,
    observation = null,
    feedback = null,
    durationMinutes = null,
  } = body;

  // Who is this completion for?
  const targetId = isStaff && participantId ? participantId : user.id;

  // Load quest (if any) for XP + capacities/skills
  let quest: Quest | null = null;
  if (questId) {
    const { data } = await supabase
      .from("quests")
      .select("*")
      .eq("id", questId)
      .single();
    quest = (data as Quest) ?? null;
  }

  if (!quest && !freeFormTitle) {
    return NextResponse.json(
      { error: "questId or freeFormTitle required" },
      { status: 400 },
    );
  }

  const baseXp = quest ? quest.xp : XP_BY_DIFFICULTY.starter;
  const xpAwarded = xpForCompletion(baseXp, durationMinutes);

  const hasPhoto = false; // photo upload is a later phase
  const evidence_grade: EvidenceGrade = hasPhoto
    ? "photo"
    : observation
      ? isStaff
        ? "staff_observed"
        : "noted"
      : "self_reported";

  const support_context = swPresent ? "sw_supported" : "self_led";

  const { data: inserted, error } = await supabase
    .from("completions")
    .insert({
      participant_id: targetId,
      quest_id: questId,
      free_form_title: freeFormTitle,
      author_id: isStaff ? user.id : null,
      sw_present: swPresent,
      sw_name: swName,
      support_context,
      chosen,
      yn_answers: ynAnswers,
      duration_minutes: durationMinutes,
      xp_awarded: xpAwarded,
      evidence_grade,
      observation,
      feedback,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    return NextResponse.json(
      { error: error?.message ?? "insert failed" },
      { status: 500 },
    );
  }

  // AI goal-mapping → completion_goals
  let mappedGoalIds: string[] = [];
  try {
    const goals = await getParticipantGoals(targetId);
    if (goals.length && quest) {
      const capacityAffirmed = (ynAnswers as YNAnswer[]).some(
        (a) => a.is_capacity && a.answer,
      );
      const { goalIds } = await mapGoals({
        quest: {
          title: quest.title,
          capacities: quest.capacities,
          skills_built: quest.skills_built,
          category: quest.category,
        },
        goals,
        ynCapacityAffirmed: capacityAffirmed,
      });
      mappedGoalIds = goalIds;
      if (goalIds.length) {
        await supabase.from("completion_goals").insert(
          goalIds.map((goal_id) => ({
            completion_id: inserted.id,
            goal_id,
            ai_suggested: true,
          })),
        );
      }
    }
  } catch {
    // goal-mapping is best-effort; never block the completion
  }

  return NextResponse.json({
    ok: true,
    completionId: inserted.id,
    xpAwarded,
    evidenceGrade: evidence_grade,
    mappedGoalIds,
  });
}
