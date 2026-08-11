// Astalty API client (server-only). Docs: https://api.app.astalty.com.au/docs
// Auth: Authorization: Bearer <API key>. Public endpoints under /public/v1.

const BASE = process.env.ASTALTY_API_BASE || "https://api.app.astalty.com.au";

export function astaltyEnabled(): boolean {
  return !!process.env.ASTALTY_API_TOKEN;
}

async function astaltyGet(path: string): Promise<unknown> {
  const token = process.env.ASTALTY_API_TOKEN;
  if (!token) throw new Error("ASTALTY_API_TOKEN not set");
  const res = await fetch(`${BASE}/public/v1${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Astalty ${res.status} ${res.statusText}`);
  return res.json();
}

export interface AstaltyGoal {
  astalty_goal_id: string;
  name: string;
}

export interface AstaltyParticipant {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  preferredName: string | null;
  status: string;
}

/** List participants from Astalty (first 100) for onboarding selection. */
export async function listAstaltyParticipants(): Promise<AstaltyParticipant[]> {
  const res = (await astaltyGet(`/participants?limit=100`)) as {
    data?: Record<string, unknown>[];
  } | null;
  const rows = Array.isArray(res?.data) ? res.data : [];
  return rows.map((p) => ({
    id: String(p.id),
    fullName: String(p.full_name ?? "").trim(),
    firstName: String(p.first_name ?? "").trim(),
    lastName: String(p.last_name ?? "").trim(),
    preferredName: (p.preferred_name as string) ?? null,
    status: String(p.status ?? ""),
  }));
}

interface AstaltyGoalRow {
  id: string;
  name?: string;
  description?: string;
  status?: string;
  archived_at?: string | null;
  achieved_at?: string | null;
}

/**
 * Pull a participant's current NDIS goals from Astalty.
 * Endpoint (confirmed against the live API): GET /public/v1/participants/{id}/goals
 * → { data: [{ id, name, goal_type, description, achievement_strategy, barriers,
 *              status, achieved_at, archived_at, created_at }], meta }.
 * We keep active goals (not archived), mapping id→astalty_goal_id and name→name.
 * `astaltyId` is the participant's Astalty UUID (the `id` field).
 */
export async function fetchAstaltyGoals(
  astaltyId: string,
): Promise<AstaltyGoal[]> {
  const res = (await astaltyGet(
    `/participants/${encodeURIComponent(astaltyId)}/goals?limit=100`,
  )) as { data?: AstaltyGoalRow[] } | null;

  const rows = Array.isArray(res?.data) ? res.data : [];
  return rows
    .filter((g) => !g.archived_at)
    .map((g) => ({
      astalty_goal_id: String(g.id),
      name: String(g.name ?? g.description ?? "").trim(),
    }))
    .filter((g) => g.astalty_goal_id && g.name);
}
