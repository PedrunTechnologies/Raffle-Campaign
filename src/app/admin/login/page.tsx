"use client";

import Logo from "@/components/ui/Logo";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";



export default function AdminLoginPage() {
  const router = useRouter();
  const redirect = "/admin/overview";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1. Sign in with Firebase Auth
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await cred.user.getIdToken();

      // 2. Verify against /admins collection and set session cookie
      const res = await fetch("/api/admin/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (!res.ok) {
        const data = await res.json() as { error?: string };
        setError(data.error ?? "Access denied.");
        setLoading(false);
        return;
      }

      router.push(redirect);
    } catch (err: unknown) {
      setError(friendlyError(err));
      setLoading(false);
    }
  }


  return (
    <div className="flex min-h-screen bg-[var(--bg)]">

      {/* ── Left panel — dark brand ── */}
      <div
        className="hidden flex-col justify-between p-16 lg:flex lg:w-1/2"
        style={{
          background:
            "radial-gradient(at 15% 15%, rgba(30,91,255,.55), transparent 50%), radial-gradient(at 85% 85%, rgba(217,242,60,.20), transparent 55%), #0A0F1F",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <Logo width="36" height="36" />
          <div>
            <p className="text-sm font-bold text-white">Pedrun</p>
            <p className="text-xs text-white/50">Admin console</p>
          </div>
        </div>

        {/* Hero copy */}
        <div>
          <h1
            className="mb-5 leading-tight tracking-tight text-white"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(28px, 3.5vw, 48px)",
              fontWeight: 300,
            }}
          >
            Orchestrate every cycle,{" "}
            <em className="italic text-[var(--lime)]">one draw at a time.</em>
          </h1>
          <p className="max-w-sm text-sm leading-relaxed text-white/60">
            Configure windows, approve vendors, trigger draws, and audit every
            result — all from one place.
          </p>
        </div>

        {/* Access note */}
        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <span className="h-2 w-2 rounded-full bg-[var(--lime)]" />
          <p className="text-xs text-white/60">
            Restricted access · Pedrun operations team only
          </p>
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">

        {/* Mobile logo */}
        <div className="mb-10 flex items-center gap-3 lg:hidden">
          <Logo width="36" height="36" />
          <div>
            <p className="text-sm font-bold">Pedrun</p>
            <p className="text-xs text-[var(--mute)]">Admin console</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="w-full max-w-sm">
          <h2
            className="mb-1 text-2xl font-medium"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Admin sign-in
          </h2>
          <p className="mb-8 text-sm text-[var(--ink-soft)]">
            Log in using your admin login details
          </p>

          {/* Email */}
          <div className="mb-4 flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-widest text-[var(--mute)]">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tunde@pedrun.ng"
              required
              autoComplete="email"
              className="
                rounded-xl border border-[var(--line)]
                bg-[var(--grey-50)] px-4 py-3
                text-sm text-[var(--ink)] outline-none
                focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/10
                transition-all
              "
            />
          </div>

          {/* Password */}
          <div className="mb-6 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold uppercase tracking-widest text-[var(--mute)]">
                Password
              </label>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••"
              required
              autoComplete="current-password"
              className="
                rounded-xl border border-[var(--line)]
                bg-[var(--grey-50)] px-4 py-3
                text-sm text-[var(--ink)] outline-none
                focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/10
                transition-all
              "
            />
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 rounded-xl border border-[var(--blue)]/20 bg-[var(--blue)]/5 px-4 py-3 text-sm text-[var(--blue)]">
              {error}
            </div>
          )}

          <Button fullWidth disabled={loading}>
            {loading ? "Signing in…" : "Login"}
          </Button>

          <p className="mt-8 text-center text-xs text-[var(--mute)]">
            Looking for the vendor portal?{" "}
            <Link
              href="/vendor/login"
              className="font-medium text-[var(--blue)] underline underline-offset-2"
            >
              Sign in as a vendor
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}



function friendlyError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";
  const MAP: Record<string, string> = {
    "auth/user-not-found": "No account found with this email.",
    "auth/wrong-password": "Incorrect password.",
    "auth/invalid-credential": "Incorrect email or password.",
    "auth/too-many-requests": "Too many attempts. Please wait.",
    "auth/network-request-failed": "Network error. Check your connection.",
  };
  return MAP[code] ?? "Something went wrong. Please try again.";
}

