"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { buttonClass } from "./ui";
import { DURATION_OPTIONS } from "@/lib/gamification";

type QuestOption = { id: string; title: string; category: string };

export default function StaffLogger({
  participantId,
  participantName,
  quests,
}: {
  participantId: string;
  participantName: string;
  quests: QuestOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [questId, setQuestId] = useState("");
  const [chosen, setChosen] = useState(true);
  const [swPresent, setSwPresent] = useState(false);
  const [swName, setSwName] = useState("");
  const [observation, setObservation] = useState("");
  const [feedback, setFeedback] = useState("");
  const [durationMinutes, setDurationMinutes] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function submit() {
    if (!questId) return;
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId,
          questId,
          chosen,
          swPresent,
          swName: swPresent ? swName : null,
          observation: observation.trim() || null,
          feedback: feedback.trim() || null,
          durationMinutes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setMsg(
        `Logged · +${data.xpAwarded} XP${
          data.mappedGoalIds?.length
            ? ` · ${data.mappedGoalIds.length} goal${data.mappedGoalIds.length === 1 ? "" : "s"}`
            : ""
        }`,
      );
      setQuestId("");
      setObservation("");
      setFeedback("");
      setDurationMinutes(null);
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className={buttonClass("secondary", "sm")}
      >
        + Log a quest
      </button>
    );
  }

  return (
    <div className="mt-3 rounded-2xl bg-[var(--brand-purple-soft)]/60 p-4">
      <p className="mb-2 text-sm font-semibold text-[var(--brand-purple-deep)]">
        Log for {participantName}
      </p>
      <select
        value={questId}
        onChange={(e) => setQuestId(e.target.value)}
        className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
      >
        <option value="">Choose a quest…</option>
        {quests.map((q) => (
          <option key={q.id} value={q.id}>
            {q.category} — {q.title}
          </option>
        ))}
      </select>

      <div className="mt-2 flex flex-wrap gap-2 text-xs">
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={chosen}
            onChange={(e) => setChosen(e.target.checked)}
          />
          Participant chose it
        </label>
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={swPresent}
            onChange={(e) => setSwPresent(e.target.checked)}
          />
          Support worker present
        </label>
        {swPresent && (
          <input
            value={swName}
            onChange={(e) => setSwName(e.target.value)}
            placeholder="SW name"
            className="rounded border border-black/10 px-2 py-0.5 text-xs"
          />
        )}
      </div>

      <select
        value={durationMinutes ?? ""}
        onChange={(e) =>
          setDurationMinutes(e.target.value ? Number(e.target.value) : null)
        }
        className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
      >
        <option value="">How long did it take?</option>
        {DURATION_OPTIONS.map((o) => (
          <option key={o.minutes} value={o.minutes}>
            {o.label}
          </option>
        ))}
      </select>

      <textarea
        value={observation}
        onChange={(e) => setObservation(e.target.value)}
        placeholder="Optional observation (strengthens the evidence)…"
        rows={2}
        className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
      />

      <input
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="What they liked / didn't like (e.g. too noisy)…"
        className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
      />

      <div className="mt-2 flex items-center gap-2">
        <button
          onClick={submit}
          disabled={busy || !questId}
          className={buttonClass("primary", "sm")}
        >
          {busy ? "Saving…" : "Save"}
        </button>
        <button onClick={() => setOpen(false)} className={buttonClass("ghost", "sm")}>
          Close
        </button>
        {msg && (
          <span className="text-xs font-semibold text-[var(--good)]">{msg}</span>
        )}
      </div>
    </div>
  );
}
