"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { buttonClass } from "./ui";
import { WEEKDAYS, formatTimeRange } from "@/lib/schedule";
import type { ScheduleSession, SessionQuest } from "@/lib/types";

type SessionLite = Pick<
  ScheduleSession,
  "id" | "weekday" | "starts_at" | "ends_at"
>;

function dayShort(weekday: number) {
  return WEEKDAYS.find((d) => d.iso === weekday)?.short ?? "";
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export default function AddToSchedule({
  questId,
  sessions,
  initialLinks,
}: {
  questId: string;
  sessions: SessionLite[];
  initialLinks: (Pick<
    SessionQuest,
    "id" | "session_id" | "recurrence" | "scheduled_date"
  >)[];
}) {
  const router = useRouter();
  const [links, setLinks] = useState(initialLinks);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [recurrence, setRecurrence] = useState<"weekly" | "once">("weekly");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState(0);
  const [open, setOpen] = useState(false);

  const sessionById = new Map(sessions.map((s) => [s.id, s]));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setJustAdded(0);
  }

  async function add() {
    if (selected.size === 0) return;
    setBusy(true);
    setError(null);
    setJustAdded(0);
    try {
      const res = await fetch("/api/session-quests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questId,
          sessionIds: [...selected],
          recurrence,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setSelected(new Set());
      setJustAdded(data.added ?? 0);
      router.refresh();
      // Reflect immediately without waiting for the refresh round-trip.
      await refetch();
      // Collapse back to the summary button once it's been added.
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function refetch() {
    try {
      const res = await fetch(`/api/session-quests?questId=${questId}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.links)) setLinks(data.links);
      }
    } catch {
      // best-effort; router.refresh() will reconcile on next render
    }
  }

  async function remove(linkId: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/session-quests", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setLinks((prev) => prev.filter((l) => l.id !== linkId));
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  // Collapsed: a single button until the participant chooses to plan this quest.
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="card group flex w-full items-center gap-4 p-5 text-left transition duration-200 hover:-translate-y-0.5 hover:ring-2 hover:ring-[var(--brand-cyan)]"
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--brand-purple-soft)] text-2xl">
          🗓️
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-lg font-bold text-[var(--brand-purple-deep)]">
            Add to my schedule
          </span>
          <span className="block text-sm text-[var(--ink-soft)]">
            {links.length > 0
              ? `Planned in ${links.length} session${links.length === 1 ? "" : "s"} · tap to manage`
              : "Plan this quest into your sessions — weekly or once."}
          </span>
        </span>
        <span className="font-display text-2xl font-black text-[var(--brand-purple)] transition group-hover:translate-x-0.5">
          +
        </span>
      </button>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-[var(--brand-purple-deep)]">
            Add to my schedule
          </h2>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">
            Plan this quest into your sessions — every week, or just once.
          </p>
        </div>
        <button
          onClick={() => setOpen(false)}
          aria-label="Close"
          className="shrink-0 rounded-full px-2 py-0.5 text-xl font-bold text-[var(--ink-soft)] hover:bg-black/5"
        >
          ×
        </button>
      </div>

      {/* Already on the schedule */}
      {links.length > 0 && (
        <ul className="mt-4 space-y-2">
          {links.map((l) => {
            const s = sessionById.get(l.session_id);
            return (
              <li
                key={l.id}
                className="flex items-center gap-2 rounded-2xl bg-[var(--brand-cyan-soft)] px-3 py-2 text-sm"
              >
                <span className="font-semibold text-[var(--brand-cyan-ink)]">
                  ✓ {s ? `${dayShort(s.weekday)} · ${formatTimeRange(s.starts_at, s.ends_at)}` : "Session"}
                </span>
                <span className="text-[var(--brand-cyan-ink)]/80">
                  {l.recurrence === "weekly"
                    ? "every week"
                    : l.scheduled_date
                      ? `once · ${formatDate(l.scheduled_date)}`
                      : "once"}
                </span>
                <button
                  onClick={() => remove(l.id)}
                  disabled={busy}
                  aria-label="Remove from schedule"
                  className="ml-auto rounded-full px-2 font-bold text-[var(--brand-cyan-ink)] hover:bg-black/5"
                >
                  ×
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {sessions.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--ink-soft)]">
          You don&apos;t have any sessions yet — your support team sets these up.
        </p>
      ) : (
        <>
          {/* How often */}
          <div className="mt-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">
              How often?
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setRecurrence("weekly")}
                className={`rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
                  recurrence === "weekly"
                    ? "bg-[var(--brand-violet)] text-white"
                    : "bg-[var(--brand-purple-soft)] text-[var(--brand-purple-deep)]"
                }`}
              >
                🔁 Every week
              </button>
              <button
                onClick={() => setRecurrence("once")}
                className={`rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
                  recurrence === "once"
                    ? "bg-[var(--brand-violet)] text-white"
                    : "bg-[var(--brand-purple-soft)] text-[var(--brand-purple-deep)]"
                }`}
              >
                📅 Just once
              </button>
            </div>
          </div>

          {/* Which sessions */}
          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">
              Which session{sessions.length === 1 ? "" : "s"}?
            </p>
            <div className="grid gap-2">
              {sessions.map((s) => {
                const on = selected.has(s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => toggle(s.id)}
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                      on
                        ? "border-[var(--brand-violet)] bg-[var(--brand-purple-soft)]"
                        : "border-black/10 hover:bg-[var(--brand-purple-soft)]"
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs font-bold ${
                        on
                          ? "border-[var(--brand-violet)] bg-[var(--brand-violet)] text-white"
                          : "border-black/25"
                      }`}
                    >
                      {on ? "✓" : ""}
                    </span>
                    <span className="font-semibold text-[var(--brand-purple-deep)]">
                      {WEEKDAYS.find((d) => d.iso === s.weekday)?.long}
                    </span>
                    <span className="text-sm text-[var(--ink-soft)]">
                      {formatTimeRange(s.starts_at, s.ends_at)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <p className="mt-3 text-sm text-[var(--danger)]">{error}</p>
          )}
          {justAdded > 0 && (
            <p className="mt-3 text-sm font-semibold text-[var(--brand-cyan-ink)]">
              ✅ Added to {justAdded} session{justAdded === 1 ? "" : "s"}.
            </p>
          )}

          <button
            onClick={add}
            disabled={busy || selected.size === 0}
            className={`${buttonClass("cyan", "lg")} mt-5 w-full`}
          >
            {busy
              ? "Saving…"
              : selected.size === 0
                ? "Pick a session"
                : `Add to ${selected.size} session${selected.size === 1 ? "" : "s"}`}
          </button>
        </>
      )}
    </div>
  );
}
