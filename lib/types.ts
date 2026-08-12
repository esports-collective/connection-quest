export type Role = "participant" | "staff" | "admin";
export type QuestStyle = "structured" | "open" | "suggestion";
export type Difficulty = "starter" | "regular" | "epic";
export type SupportContext = "self_led" | "sw_supported";
export type EvidenceGrade =
  | "self_reported"
  | "noted"
  | "photo"
  | "staff_observed";
export type Cadence = "weekly" | "monthly";

export interface YNQuestion {
  prompt: string;
  is_capacity: boolean;
}
export interface YNAnswer extends YNQuestion {
  answer: boolean;
}

export interface Profile {
  id: string;
  role: Role;
  display_name: string;
  astalty_id: string | null;
  interests: string[];
  preferences: Record<string, unknown>;
  consent_photos: boolean;
  cadence: Cadence;
}

export interface Quest {
  id: string;
  code: string | null;
  title: string;
  category: string;
  style: QuestStyle;
  type: string | null;
  difficulty: Difficulty;
  est_minutes: number | null;
  location: string | null;
  description: string;
  steps: string[];
  skills_built: string[];
  capacities: string[];
  xp: number;
  yn_questions: YNQuestion[];
  is_active: boolean;
}

export type Recurrence = "once" | "weekly";

/** Which funding stream a session counts towards, for a participant's mix. */
export type SessionStream = "gaming" | "skill_development";

/**
 * A weekly NDIS session from the shared catalogue (`quests.sessions`). Staff
 * assign participants to these in the staff app; the participant sees the ones
 * assigned to them on their schedule. This is the same catalogue the staff-app
 * NDIS view is built on.
 */
export interface Session {
  id: string;
  name: string;
  weekday: number; // 1=Mon .. 7=Sun (ISO)
  starts_at: string; // "HH:MM:SS"
  ends_at: string; // "HH:MM:SS"
  has_support: boolean;
  ratio: string | null; // e.g. "1:2", or null for open/unspecified
  stream: SessionStream;
  is_active: boolean;
}

export interface SessionQuest {
  id: string;
  participant_id: string;
  session_id: string; // → quests.sessions
  quest_id: string;
  recurrence: Recurrence;
  scheduled_date: string | null; // set for once-off, null for weekly
}

export interface Goal {
  id: string;
  participant_id: string;
  name: string;
  source: "astalty" | "manual";
  astalty_goal_id: string | null;
}

export interface Completion {
  id: string;
  participant_id: string;
  quest_id: string | null;
  free_form_title: string | null;
  completed_at: string;
  author_id: string | null;
  sw_present: boolean;
  sw_name: string | null;
  support_context: SupportContext;
  chosen: boolean;
  yn_answers: YNAnswer[];
  duration_minutes: number | null;
  xp_awarded: number;
  evidence_grade: EvidenceGrade;
  observation: string | null;
  feedback: string | null;
  photo_url: string | null;
}

/** Completion joined with its quest (for lists / notes). */
export interface CompletionWithQuest extends Completion {
  quest: Pick<
    Quest,
    "title" | "category" | "capacities" | "skills_built" | "difficulty"
  > | null;
}
