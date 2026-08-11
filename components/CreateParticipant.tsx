"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { buttonClass } from "./ui";

export default function CreateParticipant() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [astaltyId, setAstaltyId] = useState("");
  const [interests, setInterests] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");

  function generatePassword() {
    const words = ["quest", "level", "spark", "brave", "hero", "star"];
    const w = words[email.length % words.length] || "quest";
    setPassword(`${w}-${Math.abs(hash(email + displayName)) % 9000 + 1000}`);
  }

  async function submit() {
    setBusy(true);
    setError("");
    setOkMsg("");
    try {
      const res = await fetch("/api/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim(),
          email: email.trim(),
          password,
          astaltyId: astaltyId.trim() || null,
          interests,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setOkMsg(
        `Created ${displayName.trim()}. Login: ${email.trim()} · password: ${password}`,
      );
      setDisplayName("");
      setEmail("");
      setPassword("");
      setAstaltyId("");
      setInterests("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card p-6">
      <h3 className="font-display text-lg font-bold text-[var(--brand-purple-deep)]">
        ＋ Add a participant
      </h3>
      <p className="mt-1 text-sm text-[var(--ink-soft)]">
        Creates a login. Only a short name is stored — goals come from Astalty.
      </p>

      <div className="mt-4 grid gap-2">
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Display name (e.g. Hailey W)"
          className="rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-[var(--brand-purple)]"
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Login email"
          type="email"
          className="rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-[var(--brand-purple)]"
        />
        <div className="flex gap-2">
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Temporary password"
            className="flex-1 rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-[var(--brand-purple)]"
          />
          <button
            type="button"
            onClick={generatePassword}
            className={buttonClass("secondary", "sm")}
          >
            Generate
          </button>
        </div>
        <input
          value={astaltyId}
          onChange={(e) => setAstaltyId(e.target.value)}
          placeholder="Astalty participant ID (optional)"
          className="rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-[var(--brand-purple)]"
        />
        <input
          value={interests}
          onChange={(e) => setInterests(e.target.value)}
          placeholder="Interests, comma separated (e.g. Gaming, Cooking)"
          className="rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-[var(--brand-purple)]"
        />
      </div>

      {error && <p className="mt-3 text-sm text-[var(--danger)]">{error}</p>}
      {okMsg && (
        <p className="mt-3 rounded-xl bg-[var(--brand-cyan-soft)] px-3 py-2 text-sm font-semibold text-[#0a6b74]">
          ✅ {okMsg}
          <br />
          <span className="font-normal">
            Write this down — the password isn&apos;t shown again.
          </span>
        </p>
      )}

      <button
        onClick={submit}
        disabled={busy || !displayName.trim() || !email.trim() || password.length < 6}
        className={`${buttonClass("primary", "lg")} mt-4 w-full`}
      >
        {busy ? "Creating…" : "Create participant"}
      </button>
    </div>
  );
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return h;
}
