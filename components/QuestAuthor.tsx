"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { buttonClass, Pill } from "./ui";
import { CATEGORIES } from "@/lib/gamification";
import type { QuestDraft } from "@/lib/ai/jobs";

// A suggestion quest doesn't tell the person what or how to do it — we only ask
// whether they chose it (captured at the start of the flow), enjoyed it, and
// would do it again.
const SUGGESTION_QUESTIONS = [
  { prompt: "Did you enjoy it?", is_capacity: false },
  { prompt: "Would you do it again?", is_capacity: false },
];

export default function QuestAuthor() {
  const router = useRouter();
  const [idea, setIdea] = useState("");
  const [draft, setDraft] = useState<QuestDraft | null>(null);
  const [source, setSource] = useState<"ai" | "fallback" | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    if (!idea.trim()) return;
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch("/api/quests/author", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: idea.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setDraft(data.draft);
      setSource(data.source);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!draft) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/quests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setSaved(true);
      setDraft(null);
      setIdea("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  function set<K extends keyof QuestDraft>(key: K, value: QuestDraft[K]) {
    if (draft) setDraft({ ...draft, [key]: value });
  }

  return (
    <div className="card p-6">
      <h3 className="font-display text-lg font-bold text-[var(--brand-purple-deep)]">
        ✨ New quest with AI
      </h3>
      <p className="mt-1 text-sm text-[var(--ink-soft)]">
        Describe an activity in a few words. AI drafts the full quest — you
        review and save.
      </p>

      <div className="mt-3 flex gap-2">
        <input
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          placeholder="e.g. visit the farmers market with a friend"
          className="flex-1 rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-[var(--brand-purple)]"
        />
        <button
          onClick={generate}
          disabled={busy || !idea.trim()}
          className={buttonClass("primary")}
        >
          {busy && !draft ? "Drafting…" : "Draft"}
        </button>
      </div>

      {saved && (
        <p className="mt-3 text-sm font-semibold text-[var(--good)]">
          ✅ Saved to the library.
        </p>
      )}
      {error && <p className="mt-3 text-sm text-[var(--danger)]">{error}</p>}

      {draft && (
        <div className="mt-5 space-y-3 rounded-2xl bg-[var(--brand-purple-soft)]/50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-[var(--ink-soft)]">
              Draft
            </span>
            <Pill color={source === "ai" ? "#5a2da8" : "#6b5b86"}>
              {source === "ai" ? "AI-drafted" : "Draft (no API key — heuristic)"}
            </Pill>
          </div>

          <input
            value={draft.title}
            onChange={(e) => set("title", e.target.value)}
            className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 font-semibold"
          />
          <textarea
            value={draft.description}
            onChange={(e) => set("description", e.target.value)}
            rows={2}
            className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
          />

          <div>
            <select
              value={draft.style}
              onChange={(e) => {
                const style = e.target.value as QuestDraft["style"];
                if (style === "suggestion") {
                  setDraft({
                    ...draft,
                    style,
                    yn_questions: SUGGESTION_QUESTIONS,
                  });
                } else {
                  set("style", style);
                }
              }}
              className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
            >
              <option value="structured">Structured — step-by-step</option>
              <option value="open">Open — adaptive, your way</option>
              <option value="suggestion">
                Suggestion — no steps, just try it
              </option>
            </select>
            {draft.style === "suggestion" && (
              <p className="mt-1 text-xs text-[var(--ink-soft)]">
                We won&apos;t tell the person how to do it. They&apos;ll be asked:
                did you choose it, did you enjoy it, would you do it again.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <select
              value={draft.category}
              onChange={(e) => set("category", e.target.value)}
              className="rounded-xl border border-black/10 bg-white px-3 py-2"
            >
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <select
              value={draft.difficulty}
              onChange={(e) =>
                set("difficulty", e.target.value as QuestDraft["difficulty"])
              }
              className="rounded-xl border border-black/10 bg-white px-3 py-2"
            >
              <option value="starter">Starter (+10)</option>
              <option value="regular">Regular (+25)</option>
              <option value="epic">Epic (+50)</option>
            </select>
          </div>

          {draft.style !== "suggestion" && (
            <div>
              <p className="text-xs font-semibold text-[var(--ink-soft)]">
                How to do it (one step per line)
              </p>
              <textarea
                value={draft.steps.join("\n")}
                onChange={(e) =>
                  set(
                    "steps",
                    e.target.value.split("\n").map((s) => s.trimStart()),
                  )
                }
                rows={Math.max(3, draft.steps.length)}
                className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
              />
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-[var(--ink-soft)]">
              Capacities evidenced
            </p>
            <div className="mt-1 flex flex-wrap gap-1">
              {draft.capacities.map((c) => (
                <Pill key={c}>{c}</Pill>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-[var(--ink-soft)]">
              Yes/No questions
            </p>
            <ol className="mt-1 list-decimal space-y-0.5 pl-5 text-sm text-[var(--ink)]">
              {draft.yn_questions.map((q, i) => (
                <li key={i}>
                  {q.prompt}
                  {q.is_capacity && (
                    <span className="ml-1 text-xs text-[var(--brand-cyan)]">
                      (capacity)
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </div>

          <div className="flex gap-2 pt-1">
            <button onClick={save} disabled={busy} className={buttonClass("cyan")}>
              {busy ? "Saving…" : "Save to library"}
            </button>
            <button
              onClick={() => setDraft(null)}
              className={buttonClass("ghost")}
            >
              Discard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
