"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { buttonClass } from "./ui";
import { DURATION_OPTIONS } from "@/lib/gamification";

export default function LogForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [chosen, setChosen] = useState(true);
  const [durationMinutes, setDurationMinutes] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!title.trim()) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          freeFormTitle: title.trim(),
          chosen,
          durationMinutes,
          feedback: feedback.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="card p-8 text-center">
        <div className="text-5xl">✅</div>
        <h2 className="mt-3 font-display text-2xl font-bold text-[var(--brand-purple-deep)]">
          Logged it!
        </h2>
        <p className="mt-1 text-[var(--ink-soft)]">&ldquo;{title}&rdquo;</p>
        <div className="mt-6 grid gap-3">
          <button
            onClick={() => {
              router.push("/");
              router.refresh();
            }}
            className={buttonClass("primary", "lg")}
          >
            Back to quests
          </button>
          <button
            onClick={() => {
              setTitle("");
              setDone(false);
            }}
            className={buttonClass("ghost")}
          >
            Log another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <label className="block text-sm font-semibold text-[var(--brand-purple-deep)]">
        What did you do?
      </label>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="e.g. Fed the neighbour's cat"
        className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-[var(--brand-purple)]"
      />

      <p className="mt-5 mb-2 text-sm font-semibold text-[var(--brand-purple-deep)]">
        Whose idea was it?
      </p>
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setChosen(true)}
          className={`rounded-full px-4 py-3 font-semibold transition ${
            chosen
              ? "bg-[var(--brand-purple)] text-white"
              : "bg-[var(--brand-purple-soft)] text-[var(--brand-purple-deep)]"
          }`}
        >
          🙌 I chose it
        </button>
        <button
          onClick={() => setChosen(false)}
          className={`rounded-full px-4 py-3 font-semibold transition ${
            !chosen
              ? "bg-[var(--brand-purple)] text-white"
              : "bg-[var(--brand-purple-soft)] text-[var(--brand-purple-deep)]"
          }`}
        >
          💡 It was suggested
        </button>
      </div>

      <p className="mt-5 mb-2 text-sm font-semibold text-[var(--brand-purple-deep)]">
        How long did it take?
      </p>
      <select
        value={durationMinutes ?? ""}
        onChange={(e) =>
          setDurationMinutes(e.target.value ? Number(e.target.value) : null)
        }
        className="w-full rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-[var(--brand-purple)]"
      >
        <option value="">Choose…</option>
        {DURATION_OPTIONS.map((o) => (
          <option key={o.minutes} value={o.minutes}>
            {o.emoji} {o.label}
          </option>
        ))}
      </select>

      <p className="mt-5 mb-2 text-sm font-semibold text-[var(--brand-purple-deep)]">
        Anything you liked or didn&apos;t like? (optional)
      </p>
      <input
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="e.g. It was fun but a bit too noisy"
        className="w-full rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-[var(--brand-purple)]"
      />

      {error && <p className="mt-4 text-sm text-[var(--danger)]">{error}</p>}

      <button
        onClick={submit}
        disabled={busy || !title.trim()}
        className={`${buttonClass("cyan", "lg")} mt-6 w-full`}
      >
        {busy ? "Saving…" : "Log it & earn XP"}
      </button>
    </div>
  );
}
