import { askJson, askText, aiEnabled } from "./anthropic";
import { CATEGORIES, XP_BY_DIFFICULTY } from "@/lib/gamification";
import type {
  Quest,
  Goal,
  Difficulty,
  QuestStyle,
  YNQuestion,
  CompletionWithQuest,
  Profile,
} from "@/lib/types";

export interface QuestDraft {
  title: string;
  category: string;
  style: QuestStyle;
  type: string;
  difficulty: Difficulty;
  est_minutes: number;
  location: string;
  description: string;
  steps: string[];
  skills_built: string[];
  capacities: string[];
  xp: number;
  yn_questions: YNQuestion[];
}

const words = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3);

/* ─────────────────────────── 1. Authoring ─────────────────────────── */

export async function authorQuest(idea: string): Promise<{
  draft: QuestDraft;
  source: "ai" | "fallback";
}> {
  const ai = await askJson<QuestDraft>(
    `You author activities ("quests") for an NDIS participant app called Quests, run by ESports Collective.
Quests are game-like real-world or gaming activities. Write for participants: warm, plain, Easy-Read, second person.
Return ONLY JSON matching this shape:
{"title","category","style","type","difficulty","est_minutes","location","description","steps":[],"skills_built":[],"capacities":[],"xp","yn_questions":[{"prompt","is_capacity"}]}
Rules: category is one of ${CATEGORIES.join(", ")}. style is "structured" (has steps), "open" (adaptive, the point is how you engage), or "suggestion" (a pure suggestion — we do NOT tell the person how). difficulty is "starter"|"regular"|"epic". xp: starter 10, regular 25, epic 50.
steps: EXPLICIT, plain, Easy-Read instructions telling the person how to do the quest, 3-6 short second-person steps (e.g. "Collect your empty cans and bottles."). For style "suggestion" return steps as an empty array (never tell them how). For "structured" and "open" ALWAYS provide clear steps.
Provide EXACTLY 4 yn_questions (simple yes/no, second person); exactly ONE has is_capacity:true (the one that evidences the key capacity). capacities are NDIS-style soft skills (e.g. Flexibility, Independence, Self-direction, Social adaptation, Communication).`,
    `Idea: ${idea}`,
  );
  if (ai && ai.title && Array.isArray(ai.yn_questions)) {
    return { draft: normaliseDraft(ai), source: "ai" };
  }
  return { draft: fallbackAuthor(idea), source: "fallback" };
}

function normaliseDraft(d: QuestDraft): QuestDraft {
  const difficulty: Difficulty = ["starter", "regular", "epic"].includes(
    d.difficulty,
  )
    ? d.difficulty
    : "starter";
  const style: QuestStyle =
    d.style === "open" || d.style === "suggestion" ? d.style : "structured";

  let yn = Array.isArray(d.yn_questions) ? d.yn_questions.slice(0, 4) : [];
  while (yn.length < 4)
    yn.push({ prompt: "Would you do this again?", is_capacity: false });
  if (!yn.some((q) => q.is_capacity)) yn[1].is_capacity = true;

  // Suggestion quests never carry instructions and use the fixed 2-question set.
  const steps =
    style === "suggestion" ? [] : (d.steps || []).slice(0, 6).filter(Boolean);
  if (style === "suggestion") {
    yn = [
      { prompt: "Did you enjoy it?", is_capacity: false },
      { prompt: "Would you do it again?", is_capacity: false },
    ];
  }

  return {
    title: d.title,
    category: CATEGORIES.includes(d.category as (typeof CATEGORIES)[number])
      ? d.category
      : "Life Skills",
    style,
    type: d.type || "Solo",
    difficulty,
    est_minutes: Number(d.est_minutes) || 30,
    location: d.location || "Hub",
    description: d.description || "",
    steps,
    skills_built: (d.skills_built || []).slice(0, 5),
    capacities: (d.capacities || []).slice(0, 5),
    xp: XP_BY_DIFFICULTY[difficulty],
    yn_questions: yn,
  };
}

function fallbackAuthor(idea: string): QuestDraft {
  const t = idea.trim();
  const lower = t.toLowerCase();
  const pick = (
    kws: string[],
    cat: string,
    loc: string,
    skills: string[],
    caps: string[],
  ) => ({ kws, cat, loc, skills, caps });
  const rules = [
    pick(
      ["game", "gaming", "console", "xbox", "playstation", "pc", "ranked", "co-op"],
      "Gaming",
      "Hub",
      ["Gaming", "Focus"],
      ["Self-direction", "Social adaptation"],
    ),
    pick(
      ["cook", "bake", "meal", "food", "kitchen", "recipe"],
      "Life Skills",
      "Hub kitchen",
      ["Cooking", "Independence"],
      ["Planning", "Independence"],
    ),
    pick(
      ["shop", "budget", "money", "deposit", "laundry", "clean", "wash"],
      "Life Skills",
      "Community",
      ["Independent living", "Money handling"],
      ["Independence", "Planning"],
    ),
    pick(
      ["gym", "library", "bus", "train", "cafe", "coffee", "community", "shop"],
      "Community Access",
      "Community",
      ["Community access"],
      ["Independence", "Confidence"],
    ),
    pick(
      ["friend", "lunch", "social", "group", "party", "meet", "chat"],
      "Social",
      "Community",
      ["Social skills"],
      ["Social adaptation", "Communication"],
    ),
    pick(
      ["quiz", "learn", "safety", "course", "study"],
      "Learning / Quizzes",
      "Hub",
      ["Learning"],
      ["Learning", "Self-direction"],
    ),
    pick(
      ["walk", "run", "health", "wellbeing", "mindful", "sleep"],
      "Health & Wellbeing",
      "Community",
      ["Physical activity", "Wellbeing"],
      ["Self-care", "Communication"],
    ),
    pick(
      ["photo", "art", "craft", "music", "draw", "paint", "create"],
      "Creative / Fun",
      "Community",
      ["Creativity"],
      ["Self-expression", "Initiative"],
    ),
  ];
  const match =
    rules.find((r) => r.kws.some((k) => lower.includes(k))) ?? rules[1];
  const title = t
    .split(" ")
    .slice(0, 5)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  return normaliseDraft({
    title: title || "New Quest",
    category: match.cat,
    style: "structured",
    type: "Solo with support",
    difficulty: "starter",
    est_minutes: 30,
    location: match.loc,
    description: `Give it a go: ${t}. Take your time and do what you can.`,
    steps: [
      `Get ready for: ${t}.`,
      "Give it a go at your own pace.",
      "Ask a support worker if you would like a hand.",
      "Finish up when you are done.",
    ],
    skills_built: match.skills,
    capacities: match.caps,
    xp: 10,
    yn_questions: [
      { prompt: "Did you give it a go?", is_capacity: false },
      { prompt: "Did you do it mostly by yourself?", is_capacity: true },
      { prompt: "Did you enjoy it?", is_capacity: false },
      { prompt: "Would you do this again?", is_capacity: false },
    ],
  });
}

/* ────────────────────────── 2. Recommend ─────────────────────────── */

export interface Recommendation {
  questId: string;
  reason: string;
}

export async function recommendQuests(args: {
  profile: Profile;
  goals: Goal[];
  quests: Quest[];
  recentQuestIds: string[];
  limit?: number;
}): Promise<{ recs: Recommendation[]; source: "ai" | "fallback" }> {
  const { profile, goals, quests, recentQuestIds, limit = 6 } = args;

  if (aiEnabled()) {
    const ai = await askJson<Recommendation[]>(
      `You personalise an NDIS activity app. Suggest quests for THIS participant from the library.
Balance: pull toward their goals, honour their interests, add variety (gently favour non-gaming and categories they haven't tried), respect comfort, occasionally a stretch. NEVER restrict — you only rank. Return ONLY a JSON array of {"questId","reason"} (reason: one short, warm sentence to the participant). Max ${limit} items.`,
      JSON.stringify({
        participant: {
          interests: profile.interests,
          goals: goals.map((g) => g.name),
        },
        recentlyDoneQuestIds: recentQuestIds,
        library: quests.map((q) => ({
          questId: q.id,
          title: q.title,
          category: q.category,
          capacities: q.capacities,
          skills: q.skills_built,
          difficulty: q.difficulty,
        })),
      }),
      1800,
    );
    if (Array.isArray(ai) && ai.length) {
      const valid = ai.filter((r) => quests.some((q) => q.id === r.questId));
      if (valid.length) return { recs: valid.slice(0, limit), source: "ai" };
    }
  }

  return { recs: fallbackRecommend(args), source: "fallback" };
}

function fallbackRecommend(args: {
  profile: Profile;
  goals: Goal[];
  quests: Quest[];
  recentQuestIds: string[];
  limit?: number;
}): Recommendation[] {
  const { profile, goals, quests, recentQuestIds, limit = 6 } = args;
  const interestWords = new Set(profile.interests.flatMap((i) => words(i)));
  const goalWords = new Set(goals.flatMap((g) => words(g.name)));
  const recentSet = new Set(recentQuestIds);
  const recentCategories = new Set(
    quests.filter((q) => recentSet.has(q.id)).map((q) => q.category),
  );

  const scored = quests
    .filter((q) => !recentSet.has(q.id))
    .map((q) => {
      const bag = new Set(
        [q.category, ...q.skills_built, ...q.capacities].flatMap((s) =>
          words(s),
        ),
      );
      let score = 0;
      let reason = "";
      for (const w of bag) {
        if (goalWords.has(w)) score += 3;
        if (interestWords.has(w)) score += 2;
      }
      if (goalWords.size && [...bag].some((w) => goalWords.has(w)))
        reason = `Works towards your goals.`;
      else if ([...bag].some((w) => interestWords.has(w)))
        reason = `Matches something you enjoy.`;
      // variety nudge
      if (!recentCategories.has(q.category)) score += 1;
      if (q.category !== "Gaming") score += 0.5;
      if (!reason)
        reason =
          q.category === "Gaming"
            ? "A fresh way to play."
            : "Something new to try.";
      return { q, score, reason };
    })
    .sort((a, b) => b.score - a.score);

  // ensure category variety in the top picks
  const out: Recommendation[] = [];
  const usedCats = new Set<string>();
  for (const s of scored) {
    if (out.length >= limit) break;
    if (usedCats.has(s.q.category) && out.length < limit - 1) continue;
    usedCats.add(s.q.category);
    out.push({ questId: s.q.id, reason: s.reason });
  }
  for (const s of scored) {
    if (out.length >= limit) break;
    if (!out.some((r) => r.questId === s.q.id))
      out.push({ questId: s.q.id, reason: s.reason });
  }
  return out;
}

/* ────────────────────────── 3. Goal mapping ──────────────────────── */

export async function mapGoals(args: {
  quest: Pick<Quest, "title" | "capacities" | "skills_built" | "category">;
  goals: Goal[];
  ynCapacityAffirmed?: boolean;
}): Promise<{ goalIds: string[]; source: "ai" | "fallback" }> {
  const { quest, goals } = args;
  if (goals.length === 0) return { goalIds: [], source: "fallback" };

  if (aiEnabled()) {
    const ai = await askJson<{ goalIds: string[] }>(
      `Map an activity to a participant's NDIS goals. Return ONLY JSON {"goalIds":[...]} listing the goal ids this activity clearly advances (0..n). Be selective.`,
      JSON.stringify({
        activity: {
          title: quest.title,
          capacities: quest.capacities,
          skills: quest.skills_built,
          category: quest.category,
        },
        goals: goals.map((g) => ({ goalId: g.id, name: g.name })),
      }),
      600,
    );
    if (ai && Array.isArray(ai.goalIds)) {
      const valid = ai.goalIds.filter((id) => goals.some((g) => g.id === id));
      return { goalIds: valid, source: "ai" };
    }
  }

  // fallback: keyword overlap
  const bag = new Set(
    [...quest.capacities, ...quest.skills_built, quest.category].flatMap((s) =>
      words(s),
    ),
  );
  const matched = goals
    .map((g) => ({
      g,
      overlap: words(g.name).filter((w) => bag.has(w)).length,
    }))
    .filter((x) => x.overlap > 0)
    .sort((a, b) => b.overlap - a.overlap)
    .map((x) => x.g.id);
  return { goalIds: matched, source: "fallback" };
}

/* ────────────────────────── 4. Note drafting ─────────────────────── */

export async function draftPeriodNote(args: {
  participantName: string;
  cadence: string;
  periodLabel: string;
  completions: CompletionWithQuest[];
  goals: Goal[];
}): Promise<{ body: string; source: "ai" | "fallback" }> {
  const { participantName, cadence, periodLabel, completions, goals } = args;

  if (aiEnabled() && completions.length) {
    const text = await askText(
      `You write NDIS progress notes for support staff at ESports Collective. Write a clear, factual, strengths-based ${cadence} note about a participant, ORGANISED BY THEIR GOALS. Use their activity (quests completed, the yes/no self-reports, any staff observations). Mention the balance of activity (e.g. gaming vs community/life-skills) and any choice/flexibility shown. Where the participant said what they liked or did not like (including sensory feedback like "too noisy" or "too smelly"), reflect it — these preferences matter for planning. Note roughly how engaged they were, including time spent where given. Plain professional prose, ready for a case note. No markdown headers, no bullet symbols — short paragraphs. 150-250 words.`,
      JSON.stringify({
        participant: participantName,
        period: periodLabel,
        goals: goals.map((g) => g.name),
        completions: completions.map((c) => ({
          quest: c.quest?.title ?? c.free_form_title,
          category: c.quest?.category,
          capacities: c.quest?.capacities,
          chosen: c.chosen,
          minutesSpent: c.duration_minutes,
          supportWorkerPresent: c.sw_present,
          selfReport: c.yn_answers?.map((a) => ({
            q: a.prompt,
            yes: a.answer,
          })),
          likedOrDisliked: c.feedback,
          staffObservation: c.observation,
        })),
      }),
      900,
    );
    if (text) return { body: text, source: "ai" };
  }

  return {
    body: fallbackNote({ participantName, periodLabel, completions, goals }),
    source: "fallback",
  };
}

function fallbackNote(args: {
  participantName: string;
  periodLabel: string;
  completions: CompletionWithQuest[];
  goals: Goal[];
}): string {
  const { participantName, periodLabel, completions, goals } = args;
  if (completions.length === 0) {
    return `${participantName} — ${periodLabel}. No quests were recorded in this period.`;
  }
  const total = completions.length;
  const gaming = completions.filter(
    (c) => c.quest?.category === "Gaming",
  ).length;
  const nonGaming = total - gaming;
  const chosen = completions.filter((c) => c.chosen).length;
  const cats = [
    ...new Set(completions.map((c) => c.quest?.category).filter(Boolean)),
  ];
  const caps = [
    ...new Set(completions.flatMap((c) => c.quest?.capacities ?? [])),
  ].slice(0, 6);

  const paras: string[] = [];
  paras.push(
    `${participantName} — ${periodLabel}. Over this period ${participantName} completed ${total} quest${
      total === 1 ? "" : "s"
    } across ${cats.length} area${
      cats.length === 1 ? "" : "s"
    } (${cats.join(", ")}). ${chosen} of these were self-chosen, showing choice and control. The balance was ${gaming} gaming and ${nonGaming} non-gaming activit${
      nonGaming === 1 ? "y" : "ies"
    }.`,
  );

  for (const g of goals) {
    const related = completions.filter((c) => {
      const bag = new Set(
        [...(c.quest?.capacities ?? []), ...(c.quest?.skills_built ?? [])].flatMap(
          (s) => words(s),
        ),
      );
      return words(g.name).some((w) => bag.has(w));
    });
    if (related.length) {
      const titles = [
        ...new Set(
          related.map((c) => c.quest?.title ?? c.free_form_title ?? "an activity"),
        ),
      ];
      paras.push(
        `Towards "${g.name}": ${participantName} took part in ${titles.join(
          ", ",
        )}. This built on ${[
          ...new Set(related.flatMap((c) => c.quest?.capacities ?? [])),
        ]
          .slice(0, 3)
          .join(", ")}.`,
      );
    }
  }

  paras.push(
    `Capacities evidenced this period included ${caps.join(
      ", ",
    )}. ${participantName} continued to engage well and self-direct activity.`,
  );
  return paras.join("\n\n");
}
