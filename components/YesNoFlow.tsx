"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { buttonClass } from "./ui";
import { DURATION_OPTIONS } from "@/lib/gamification";
import type { YNQuestion } from "@/lib/types";

type Phase =
  | "start"
  | "intro"
  | number
  | "duration"
  | "feedback"
  | "submitting"
  | "done"
  | "error";

const FEEDBACK_CHIPS = [
  "Loved it 😍",
  "Too loud 🔊",
  "Too busy 👥",
  "Too smelly 👃",
  "Too bright 💡",
  "Too long ⏳",
  "Made me nervous 😬",
];

export default function YesNoFlow({
  questId,
  title,
  xp,
  questions,
}: {
  questId: string;
  title: string;
  xp: number;
  questions: YNQuestion[];
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("start");
  const [chosen, setChosen] = useState(true);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [duration, setDuration] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [result, setResult] = useState<{ xp: number; goals: number } | null>(
    null,
  );
  const [errorMsg, setErrorMsg] = useState("");

  async function submit(finalAnswers: boolean[]) {
    setPhase("submitting");
    const ynAnswers = questions.map((q, i) => ({
      prompt: q.prompt,
      is_capacity: q.is_capacity,
      answer: finalAnswers[i],
    }));
    try {
      const res = await fetch("/api/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questId,
          ynAnswers,
          chosen,
          durationMinutes: duration,
          feedback: feedback.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setResult({ xp: data.xpAwarded, goals: data.mappedGoalIds?.length ?? 0 });
      setPhase("done");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Something went wrong");
      setPhase("error");
    }
  }

  function answer(value: boolean) {
    const idx = phase as number;
    const next = [...answers];
    next[idx] = value;
    setAnswers(next);
    if (idx + 1 < questions.length) {
      setPhase(idx + 1);
    } else {
      setPhase("duration");
    }
  }

  function addChip(chip: string) {
    setFeedback((f) => (f ? `${f}, ${chip}` : chip));
  }

  if (phase === "start") {
    return (
      <div className="card p-6 text-center">
        <p className="text-lg font-semibold text-[var(--brand-purple-deep)]">
          Did you do this quest?
        </p>
        <p className="mt-1 text-sm text-[var(--ink-soft)]">
          Mark it complete to answer a few quick questions and earn XP.
        </p>
        <button
          onClick={() => setPhase("intro")}
          className={`${buttonClass("cyan", "lg")} mt-5 w-full`}
        >
          ✅ Mark as complete
        </button>
      </div>
    );
  }

  if (phase === "intro") {
    return (
      <div className="card p-6 text-center">
        <p className="text-lg font-semibold text-[var(--brand-purple-deep)]">
          Whose idea was it?
        </p>
        <p className="mt-1 mb-4 text-sm text-[var(--ink-soft)]">
          This helps us record how you like to choose your quests.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              setChosen(true);
              setPhase(0);
            }}
            className={`${buttonClass("primary", "lg")}`}
          >
            🙌 I chose it
          </button>
          <button
            onClick={() => {
              setChosen(false);
              setPhase(0);
            }}
            className={`${buttonClass("secondary", "lg")}`}
          >
            💡 It was suggested
          </button>
        </div>
      </div>
    );
  }

  if (typeof phase === "number") {
    const q = questions[phase];
    return (
      <div className="card p-6">
        <div className="mb-4 flex justify-center gap-2">
          {questions.map((_, i) => (
            <span
              key={i}
              className={`h-2 w-8 rounded-full ${
                i <= phase ? "bg-[var(--brand-cyan)]" : "bg-[var(--brand-purple-soft)]"
              }`}
            />
          ))}
        </div>
        <p className="mb-1 text-center text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">
          Question {phase + 1} of {questions.length}
        </p>
        <h2 className="mb-6 text-center font-display text-2xl font-bold text-[var(--brand-purple-deep)]">
          {q.prompt}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => answer(true)}
            className={`${buttonClass("cyan", "lg")} py-6 text-xl`}
          >
            👍 Yes
          </button>
          <button
            onClick={() => answer(false)}
            className={`${buttonClass("secondary", "lg")} py-6 text-xl`}
          >
            👎 No
          </button>
        </div>
      </div>
    );
  }

  if (phase === "duration") {
    return (
      <div className="card p-6">
        <h2 className="text-center font-display text-xl font-bold text-[var(--brand-purple-deep)]">
          How long did it take?
        </h2>
        <p className="mt-1 text-center text-sm text-[var(--ink-soft)]">
          The longer you spent, the more XP you earn.
        </p>
        <div className="mt-4 grid gap-2">
          {DURATION_OPTIONS.map((opt) => (
            <button
              key={opt.minutes}
              onClick={() => {
                setDuration(opt.minutes);
                setPhase("feedback");
              }}
              className="flex items-center gap-3 rounded-2xl border border-black/10 px-4 py-3 text-left font-semibold text-[var(--brand-purple-deep)] transition hover:bg-[var(--brand-purple-soft)]"
            >
              <span className="text-2xl">{opt.emoji}</span>
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (phase === "feedback") {
    return (
      <div className="card p-6">
        <h2 className="text-center font-display text-xl font-bold text-[var(--brand-purple-deep)]">
          Anything you liked or didn&apos;t like?
        </h2>
        <p className="mt-1 text-center text-sm text-[var(--ink-soft)]">
          This is optional — tap a tag or type your own.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {FEEDBACK_CHIPS.map((chip) => (
            <button
              key={chip}
              onClick={() => addChip(chip)}
              className="rounded-full bg-[var(--brand-purple-soft)] px-3 py-1.5 text-sm font-semibold text-[var(--brand-purple-deep)] transition hover:brightness-95"
            >
              {chip}
            </button>
          ))}
        </div>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="e.g. It was fun but a bit too noisy for me"
          rows={3}
          className="mt-4 w-full rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-[var(--brand-purple)]"
        />
        <div className="mt-4 grid gap-2">
          <button
            onClick={() => submit(answers)}
            className={buttonClass("cyan", "lg")}
          >
            Finish quest 🎉
          </button>
          <button
            onClick={() => {
              setFeedback("");
              submit(answers);
            }}
            className={buttonClass("ghost")}
          >
            Skip
          </button>
        </div>
      </div>
    );
  }

  if (phase === "submitting") {
    return (
      <div className="card p-8 text-center text-[var(--ink-soft)]">
        Saving your quest…
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="card p-6 text-center">
        <p className="text-[var(--danger)]">{errorMsg}</p>
        <button
          onClick={() => setPhase("intro")}
          className={`${buttonClass("secondary")} mt-4`}
        >
          Try again
        </button>
      </div>
    );
  }

  // done
  return (
    <div className="card p-8 text-center">
      <div className="text-6xl">🎉</div>
      <h2 className="mt-3 font-display text-3xl font-extrabold text-[var(--brand-purple-deep)]">
        Quest complete!
      </h2>
      <p className="mt-1 text-[var(--ink-soft)]">{title}</p>
      <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full bg-[var(--brand-cyan-soft)] px-5 py-2 text-xl font-bold text-[var(--brand-cyan-ink)]">
        +{result?.xp ?? xp} XP
      </div>
      {result && result.goals > 0 && (
        <p className="mt-4 text-sm text-[var(--ink-soft)]">
          ✅ Counted towards {result.goals} of your goal
          {result.goals === 1 ? "" : "s"}.
        </p>
      )}
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
            router.push("/me");
            router.refresh();
          }}
          className={buttonClass("ghost")}
        >
          See my progress
        </button>
      </div>
    </div>
  );
}
