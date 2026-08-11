"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { buttonClass, Pill } from "./ui";

type AstaltyRow = {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  preferredName: string | null;
  status: string;
  alreadyImported: boolean;
};

function shortName(r: AstaltyRow) {
  const first = r.preferredName || r.firstName || r.fullName;
  const initial = r.lastName ? ` ${r.lastName[0].toUpperCase()}` : "";
  return `${first}${initial}`.trim();
}

export default function AstaltyOnboard() {
  const router = useRouter();
  const [rows, setRows] = useState<AstaltyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<AstaltyRow | null>(null);

  // per-selection form
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [okMsg, setOkMsg] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/astalty/participants");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed");
        setRows(data.participants);
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : "Failed");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function pick(r: AstaltyRow) {
    setSelected(r);
    setOkMsg("");
    setFormError("");
    const name = shortName(r);
    setDisplayName(name);
    const handle = `${(r.preferredName || r.firstName || "user").toLowerCase()}.${(r.lastName[0] || "x").toLowerCase()}${r.id.slice(0, 4)}`;
    setEmail(`${handle}@participant.esc`.replace(/\s+/g, ""));
    setPassword(`quest-${r.id.slice(0, 4)}${Math.floor(1000 + (r.id.charCodeAt(0) % 9) * 1000)}`);
  }

  async function create() {
    if (!selected) return;
    setBusy(true);
    setFormError("");
    try {
      const res = await fetch("/api/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim(),
          email: email.trim(),
          password,
          astaltyId: selected.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setRows((rs) =>
        rs.map((r) =>
          r.id === selected.id ? { ...r, alreadyImported: true } : r,
        ),
      );
      setOkMsg(
        `Created ${displayName.trim()} · login ${email.trim()} · password ${password}`,
      );
      setSelected(null);
      router.refresh();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="card p-6 text-center text-[var(--ink-soft)]">
        Loading participants from Astalty…
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="card p-6">
        <p className="font-semibold text-[var(--brand-purple-deep)]">
          Astalty import unavailable
        </p>
        <p className="mt-1 text-sm text-[var(--ink-soft)]">{loadError}</p>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">
          You can still add participants manually below.
        </p>
      </div>
    );
  }

  const filtered = rows.filter((r) =>
    r.fullName.toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <div className="card p-6">
      <h3 className="font-display text-lg font-bold text-[var(--brand-purple-deep)]">
        Add from Astalty
      </h3>
      <p className="mt-1 text-sm text-[var(--ink-soft)]">
        Pick who to onboard. Only the ones you choose get a login — goals pull
        automatically from Astalty.
      </p>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name…"
        className="mt-3 w-full rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-[var(--brand-purple)]"
      />

      <div className="mt-3 max-h-80 space-y-1 overflow-y-auto">
        {filtered.map((r) => (
          <div
            key={r.id}
            className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 hover:bg-[var(--brand-purple-soft)]/50"
          >
            <div className="min-w-0">
              <p className="truncate font-semibold text-[var(--brand-purple-deep)]">
                {r.fullName || shortName(r)}
              </p>
              <p className="text-xs text-[var(--ink-soft)]">{r.status}</p>
            </div>
            {r.alreadyImported ? (
              <Pill color="#1f9d55">Added ✓</Pill>
            ) : (
              <button
                onClick={() => pick(r)}
                className={buttonClass("secondary", "sm")}
              >
                Add
              </button>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="px-3 py-4 text-sm text-[var(--ink-soft)]">
            No matches.
          </p>
        )}
      </div>

      {okMsg && (
        <p className="mt-3 rounded-xl bg-[var(--brand-cyan-soft)] px-3 py-2 text-sm font-semibold text-[#0a6b74]">
          ✅ {okMsg}
          <br />
          <span className="font-normal">
            Write this down — the password isn&apos;t shown again.
          </span>
        </p>
      )}

      {selected && (
        <div className="mt-4 rounded-2xl bg-[var(--brand-purple-soft)]/60 p-4">
          <p className="mb-2 text-sm font-semibold text-[var(--brand-purple-deep)]">
            New login for {selected.fullName}
          </p>
          <div className="grid gap-2">
            <label className="text-xs font-semibold text-[var(--ink-soft)]">
              Display name (kept minimal)
            </label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
            />
            <label className="text-xs font-semibold text-[var(--ink-soft)]">
              Login email
            </label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
            />
            <label className="text-xs font-semibold text-[var(--ink-soft)]">
              Temporary password
            </label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
            />
          </div>
          {formError && (
            <p className="mt-2 text-sm text-[var(--danger)]">{formError}</p>
          )}
          <div className="mt-3 flex gap-2">
            <button
              onClick={create}
              disabled={busy || !displayName.trim() || !email.trim() || password.length < 6}
              className={buttonClass("primary", "sm")}
            >
              {busy ? "Creating…" : "Create login"}
            </button>
            <button
              onClick={() => setSelected(null)}
              className={buttonClass("ghost", "sm")}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
