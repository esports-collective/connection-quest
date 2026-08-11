import type { CompletionWithQuest, Difficulty } from "./types";

export const CATEGORIES = [
  "Gaming",
  "Life Skills",
  "Community Access",
  "Social",
  "Learning / Quizzes",
  "Health & Wellbeing",
  "Creative / Fun",
] as const;

export const CATEGORY_META: Record<string, { emoji: string; color: string }> = {
  Gaming: { emoji: "🎮", color: "#7c3aed" },
  "Life Skills": { emoji: "🍳", color: "#0ea5a3" },
  "Community Access": { emoji: "🚌", color: "#2563eb" },
  Social: { emoji: "🧑‍🤝‍🧑", color: "#db2777" },
  "Learning / Quizzes": { emoji: "🧠", color: "#d97706" },
  "Health & Wellbeing": { emoji: "🌿", color: "#16a34a" },
  "Creative / Fun": { emoji: "📸", color: "#e11d48" },
};

export const XP_BY_DIFFICULTY: Record<Difficulty, number> = {
  starter: 10,
  regular: 25,
  epic: 50,
};

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  starter: "Starter",
  regular: "Regular",
  epic: "Epic",
};

// Time spent drives the score — longer effort earns more XP.
export const DURATION_OPTIONS = [
  { label: "About 10 minutes", emoji: "⚡", minutes: 10, mult: 1 },
  { label: "About half an hour", emoji: "🙂", minutes: 30, mult: 1.5 },
  { label: "About an hour", emoji: "💪", minutes: 60, mult: 2.5 },
  { label: "A couple of hours", emoji: "🔥", minutes: 120, mult: 4 },
  { label: "Three hours or more", emoji: "🏆", minutes: 180, mult: 6 },
];

/** The XP range a quest can earn, from shortest to longest time spent. */
export function xpRange(baseXp: number): { min: number; max: number } {
  const mults = DURATION_OPTIONS.map((o) => o.mult);
  return {
    min: Math.round(baseXp * Math.min(...mults)),
    max: Math.round(baseXp * Math.max(...mults)),
  };
}

/** XP earned = base quest XP scaled by how long it took. */
export function xpForCompletion(
  baseXp: number,
  minutes: number | null | undefined,
): number {
  if (!minutes) return baseXp;
  const tier =
    [...DURATION_OPTIONS].reverse().find((o) => minutes >= o.minutes) ??
    DURATION_OPTIONS[0];
  return Math.round(baseXp * tier.mult);
}

// Cumulative XP required to *reach* each level (index 0 = level 1).
// Tuned for the time-scaled XP economy (10–300 XP per completion).
const LEVEL_THRESHOLDS = [
  0, 100, 250, 500, 900, 1500, 2400, 3600, 5200, 7200, 9600,
];

export interface LevelInfo {
  level: number;
  currentLevelXp: number; // xp into the current level
  levelSpan: number; // xp needed to clear the current level
  pct: number; // 0..100 progress to next level
  nextLevelAt: number | null; // total xp for next level, null if maxed
}

export function levelInfo(xp: number): LevelInfo {
  let level = 1;
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1;
  }
  const base = LEVEL_THRESHOLDS[level - 1];
  const next =
    level < LEVEL_THRESHOLDS.length ? LEVEL_THRESHOLDS[level] : null;
  const levelSpan = next !== null ? next - base : 0;
  const currentLevelXp = xp - base;
  const pct = next !== null ? Math.round((currentLevelXp / levelSpan) * 100) : 100;
  return { level, currentLevelXp, levelSpan, pct, nextLevelAt: next };
}

/** Consecutive-day streak ending today (or yesterday). */
export function computeStreak(completedAtIso: string[]): number {
  if (completedAtIso.length === 0) return 0;
  const days = new Set(
    completedAtIso.map((iso) => new Date(iso).toISOString().slice(0, 10)),
  );
  let streak = 0;
  const cursor = new Date();
  // allow the streak to count if the most recent day is today or yesterday
  const todayKey = cursor.toISOString().slice(0, 10);
  const yesterday = new Date(cursor);
  yesterday.setDate(cursor.getDate() - 1);
  if (!days.has(todayKey) && !days.has(yesterday.toISOString().slice(0, 10))) {
    return 0;
  }
  if (!days.has(todayKey)) cursor.setDate(cursor.getDate() - 1);
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export interface Badge {
  key: string;
  label: string;
  emoji: string;
  earned: boolean;
  hint: string;
}

export function computeBadges(completions: CompletionWithQuest[]): Badge[] {
  const count = completions.length;
  const categories = new Set(
    completions.map((c) => c.quest?.category).filter(Boolean) as string[],
  );
  const gamingCount = completions.filter(
    (c) => c.quest?.category === "Gaming",
  ).length;
  const nonGaming = completions.filter(
    (c) => c.quest && c.quest.category !== "Gaming",
  ).length;
  const epics = completions.filter(
    (c) => c.quest?.difficulty === "epic",
  ).length;
  const chosen = completions.filter((c) => c.chosen).length;
  const streak = computeStreak(completions.map((c) => c.completed_at));

  return [
    {
      key: "first",
      label: "First Quest",
      emoji: "⭐",
      earned: count >= 1,
      hint: "Complete your first quest",
    },
    {
      key: "five",
      label: "On a Roll",
      emoji: "🔥",
      earned: count >= 5,
      hint: "Complete 5 quests",
    },
    {
      key: "explorer",
      label: "Explorer",
      emoji: "🧭",
      earned: categories.size >= 3,
      hint: "Try 3 different categories",
    },
    {
      key: "beyond",
      label: "Beyond Gaming",
      emoji: "🌍",
      earned: nonGaming >= 3,
      hint: "Do 3 non-gaming quests",
    },
    {
      key: "gamer",
      label: "Squad Player",
      emoji: "🎮",
      earned: gamingCount >= 3,
      hint: "Do 3 gaming quests",
    },
    {
      key: "epic",
      label: "Epic Effort",
      emoji: "🏆",
      earned: epics >= 1,
      hint: "Complete an Epic quest",
    },
    {
      key: "chooser",
      label: "My Choice",
      emoji: "🙌",
      earned: chosen >= 5,
      hint: "Choose 5 quests yourself",
    },
    {
      key: "streak",
      label: "Streak x3",
      emoji: "⚡",
      earned: streak >= 3,
      hint: "Complete quests 3 days in a row",
    },
  ];
}
