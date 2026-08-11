"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { buttonClass } from "@/components/ui";

const DEMO = [
  { label: "Hailey W", sub: "Participant", email: "hailey@demo.quests", emoji: "🎮" },
  { label: "Sam T", sub: "Staff", email: "sam@demo.quests", emoji: "🧑‍💼" },
  { label: "Anna W", sub: "Admin", email: "anna@demo.quests", emoji: "⚙️" },
];

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [usePassword, setUsePassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  async function sendCode() {
    if (!email.trim()) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        // Participants are provisioned by staff (staff app → Quest logins /
        // onboarding), so the login never creates a new account itself.
        shouldCreateUser: false,
        // Fallback magic-link lands on the callback of whatever origin asked
        // for the code (dev → dev, prod → prod). The typed code is primary.
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setCodeSent(true);
    setNotice(`We emailed a 6-digit code to ${email.trim()}.`);
  }

  async function verifyCode() {
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: "email",
    });
    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }
    router.push("/");
    router.refresh();
  }

  async function signInPassword(withEmail: string, withPassword: string) {
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: withEmail,
      password: withPassword,
    });
    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <main className="brand-gradient relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-6 text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[var(--brand-cyan)]/15 blur-3xl"
      />
      <div className="relative w-full max-w-sm">
        <div className="mb-8 text-center">
          <Image
            src="/side-quests-logo.png"
            alt="Side Quests"
            width={340}
            height={274}
            priority
            className="mx-auto h-auto w-56 drop-shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
          />
          <p className="mt-3 text-white/80">
            Choose your quest. Level up your life.
          </p>
        </div>

        <div className="card p-6 text-[var(--ink)]">
          {!codeSent ? (
            <>
              <input
                type="email"
                required
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-[var(--brand-purple)]"
              />

              {usePassword && (
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-3 w-full rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-[var(--brand-purple)]"
                />
              )}

              {error && <p className="mt-3 text-sm text-[var(--danger)]">{error}</p>}

              {!usePassword ? (
                <button
                  onClick={sendCode}
                  disabled={busy || !email.trim()}
                  className={`${buttonClass("primary", "lg")} mt-4 w-full`}
                >
                  {busy ? "Sending…" : "Email me a code"}
                </button>
              ) : (
                <button
                  onClick={() => signInPassword(email.trim(), password)}
                  disabled={busy || !email.trim() || !password}
                  className={`${buttonClass("primary", "lg")} mt-4 w-full`}
                >
                  {busy ? "Signing in…" : "Sign in"}
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setUsePassword((v) => !v);
                  setError(null);
                }}
                className="mt-3 w-full text-center text-sm font-semibold text-[var(--brand-purple)]"
              >
                {usePassword ? "Use an email code instead" : "Use a password instead"}
              </button>
            </>
          ) : (
            <>
              {notice && (
                <p className="mb-3 text-sm text-[var(--ink-soft)]">{notice}</p>
              )}
              <input
                inputMode="numeric"
                autoFocus
                placeholder="6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full rounded-2xl border border-black/10 px-4 py-3 text-center text-2xl tracking-widest outline-none focus:border-[var(--brand-purple)]"
              />
              {error && <p className="mt-3 text-sm text-[var(--danger)]">{error}</p>}
              <button
                onClick={verifyCode}
                disabled={busy || code.trim().length < 6}
                className={`${buttonClass("primary", "lg")} mt-4 w-full`}
              >
                {busy ? "Checking…" : "Verify & sign in"}
              </button>
              <div className="mt-3 flex justify-between text-sm font-semibold text-[var(--brand-purple)]">
                <button onClick={() => { setCodeSent(false); setCode(""); setError(null); }}>
                  ← Change email
                </button>
                <button onClick={sendCode} disabled={busy}>
                  Resend code
                </button>
              </div>
            </>
          )}

          {demoMode && !codeSent && (
            <>
              <div className="my-5 flex items-center gap-3 text-xs text-[var(--ink-soft)]">
                <span className="h-px flex-1 bg-black/10" />
                demo logins
                <span className="h-px flex-1 bg-black/10" />
              </div>
              <div className="grid gap-2">
                {DEMO.map((d) => (
                  <button
                    key={d.email}
                    disabled={busy}
                    onClick={() => signInPassword(d.email, "questsdemo")}
                    className="flex items-center gap-3 rounded-2xl border border-black/10 px-4 py-3 text-left transition hover:bg-[var(--brand-purple-soft)]"
                  >
                    <span className="text-2xl">{d.emoji}</span>
                    <span>
                      <span className="block font-semibold">{d.label}</span>
                      <span className="block text-xs text-[var(--ink-soft)]">
                        {d.sub}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        <p className="mt-4 text-center text-xs text-white/60">
          ESports Collective
        </p>
      </div>
    </main>
  );
}
