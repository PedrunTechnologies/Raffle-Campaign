"use client";

import Logo from "@/components/ui/Logo";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";


function friendlyError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";
  const MAP: Record<string, string> = {
    "auth/user-not-found":         "No account found with this email.",
    "auth/invalid-email":          "Please enter a valid email address.",
    "auth/too-many-requests":      "Too many attempts. Please wait a moment.",
    "auth/network-request-failed": "Network error. Check your connection.",
  };
  return MAP[code] ?? "Something went wrong. Please try again.";
}


export default function VendorForgotPasswordPage() {
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
    } catch (err: unknown) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-[var(--bg)]">

      {/* ── Left panel ── */}
      <div
        className="hidden flex-col justify-between bg-[var(--bg-2)] p-16 lg:flex lg:w-1/2 text-white"
        style={{
          background:
            "radial-gradient(at 15% 15%, rgba(30,91,255,.55), transparent 50%), radial-gradient(at 85% 85%, rgba(217,242,60,.20), transparent 55%), #0A0F1F",
        }}
      >
        <div className="flex items-center gap-3">
          <Logo width="36" height="36" />
          <div>
            <p className="text-sm font-bold">Pedrun</p>
            <p className="text-xs text-white/50">Vendor portal</p>
          </div>
        </div>

        <div>
          <h1
            className="mb-6 leading-tight tracking-tight"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(32px, 4vw, 52px)",
              fontWeight: 300,
            }}
          >
            Back in{" "}
            <em className="italic text-[var(--lime)]">seconds.</em>
          </h1>
          <p className="max-w-sm text-base leading-relaxed text-white/60">
            Enter your email and we&apos;ll send you a link to reset your password.
          </p>
        </div>

        <p className="text-sm text-white/50">
          Trusted by <strong className="text-[var(--lime)]">vendors</strong>{" "}
          across Uyo.
        </p>
      </div>

      {/* ── Right panel ── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
        <div className="mb-10 flex items-center justify-start w-100 gap-3 lg:hidden">
          <Logo width="36" height="36" />
          <p className="text-sm font-bold">Pedrun Vendor</p>
        </div>

        <div className="w-full max-w-sm">
          {sent ? (
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--blue-soft)] text-2xl">
                📬
              </div>
              <h2
                className="mb-2 text-2xl font-medium"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Check your email
              </h2>
              <p className="mb-8 text-sm leading-relaxed text-[var(--ink-soft)]">
                We sent a reset link to <strong>{email}</strong>. Click it to set
                a new password. Check your spam folder if it doesn&apos;t arrive
                within a minute.
              </p>
              <Button
                variant="ghost"
                fullWidth
                onClick={() => { setSent(false); setEmail(""); }}
              >
                Use a different email
              </Button>
              <p className="mt-4 text-center text-sm text-[var(--ink-soft)]">
                <Link
                  href="/vendor/login"
                  className="font-medium text-[var(--blue)] underline underline-offset-2"
                >
                  Back to sign in
                </Link>
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <h2
                className="mb-1 text-2xl font-medium"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Forgot password?
              </h2>
              <p className="mb-8 text-sm text-[var(--ink-soft)]">
                We&apos;ll email you a link to reset it.
              </p>

              <div className="mb-6 flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-widest text-[var(--mute)]">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="orders@yourbusiness.com"
                  required
                  autoComplete="email"
                  className="
                    rounded-xl border border-[var(--line)]
                    bg-[var(--grey-50)] px-4 py-3 text-sm text-[var(--ink)]
                    outline-none transition-all
                    focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/10
                  "
                />
              </div>

              {error && (
                <div className="mb-5 rounded-xl border border-[var(--blue)]/20 bg-[var(--blue)]/5 px-4 py-3 text-sm text-[var(--blue)]">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-3">
                <Button type="submit" fullWidth disabled={loading}>
                  {loading ? "Sending…" : "Send reset link"}
                </Button>
              </div>

              <p className="mt-6 text-center text-sm text-[var(--ink-soft)]">
                Remember it?{" "}
                <Link
                  href="/vendor/login"
                  className="font-medium text-[var(--blue)] underline underline-offset-2"
                >
                  Back to sign in
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

