"use client";

import { useState } from "react";
import { buttonClass, Pill } from "./ui";

type Participant = { id: string; name: string; cadence: string };
export type NoteRow = {
  id: string;
  participant_id: string;
  participantName: string;
  period_start: string;
  period_end: string;
  cadence: string;
  draft_body: string;
  status: string;
};

export default function NoteQueue({
  participants,
  initialNotes,
}: {
  participants: Participant[];
  initialNotes: NoteRow[];
}) {
  const [notes, setNotes] = useState<NoteRow[]>(initialNotes);
  const [selected, setSelected] = useState(participants[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function generate() {
    if (!selected) return;
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "draft", participantId: selected }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      const p = participants.find((x) => x.id === selected);
      setNotes([
        { ...data.note, participantName: p?.name ?? "Participant" },
        ...notes,
      ]);
      setMsg(
        `Drafted from ${data.completions} quest${data.completions === 1 ? "" : "s"} · ${
          data.source === "ai" ? "AI" : "heuristic"
        }`,
      );
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function approve(id: string) {
    await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve", noteId: id }),
    });
    setNotes((ns) =>
      ns.map((n) => (n.id === id ? { ...n, status: "approved" } : n)),
    );
  }

  async function saveEdit(id: string, body: string) {
    await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update", noteId: id, draftBody: body }),
    });
    setNotes((ns) =>
      ns.map((n) => (n.id === id ? { ...n, draft_body: body } : n)),
    );
  }

  return (
    <div>
      <div className="card mb-6 p-4">
        <p className="mb-2 text-sm font-semibold text-[var(--brand-purple-deep)]">
          Generate a period note
        </p>
        <div className="flex gap-2">
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="flex-1 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
          >
            {participants.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.cadence})
              </option>
            ))}
          </select>
          <button
            onClick={generate}
            disabled={busy || !selected}
            className={buttonClass("primary")}
          >
            {busy ? "Drafting…" : "Draft note"}
          </button>
        </div>
        {msg && (
          <p className="mt-2 text-xs font-semibold text-[var(--ink-soft)]">
            {msg}
          </p>
        )}
      </div>

      <div className="space-y-4">
        {notes.map((n) => (
          <NoteCard
            key={n.id}
            note={n}
            onApprove={() => approve(n.id)}
            onSave={(body) => saveEdit(n.id, body)}
          />
        ))}
        {notes.length === 0 && (
          <div className="card p-6 text-center text-[var(--ink-soft)]">
            No notes yet. Draft one above.
          </div>
        )}
      </div>
    </div>
  );
}

function NoteCard({
  note,
  onApprove,
  onSave,
}: {
  note: NoteRow;
  onApprove: () => void;
  onSave: (body: string) => void;
}) {
  const [body, setBody] = useState(note.draft_body);
  const [dirty, setDirty] = useState(false);
  const approved = note.status === "approved";

  return (
    <div className="card p-5">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <p className="font-display text-lg font-bold text-[var(--brand-purple-deep)]">
            {note.participantName}
          </p>
          <p className="text-xs text-[var(--ink-soft)]">
            {note.period_start} → {note.period_end} · {note.cadence}
          </p>
        </div>
        <Pill color={approved ? "#1f9d55" : "#d97706"}>
          {approved ? "Approved" : "Draft"}
        </Pill>
      </div>
      <textarea
        value={body}
        disabled={approved}
        onChange={(e) => {
          setBody(e.target.value);
          setDirty(true);
        }}
        rows={8}
        className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm leading-relaxed disabled:opacity-70"
      />
      {!approved && (
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => {
              onSave(body);
              setDirty(false);
            }}
            disabled={!dirty}
            className={buttonClass("secondary", "sm")}
          >
            Save edits
          </button>
          <button onClick={onApprove} className={buttonClass("primary", "sm")}>
            Approve
          </button>
        </div>
      )}
      {approved && (
        <p className="mt-2 text-xs text-[var(--ink-soft)]">
          Approved — ready to copy into Astalty (push endpoint pending).
        </p>
      )}
    </div>
  );
}
