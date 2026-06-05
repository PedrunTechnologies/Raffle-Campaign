"use client";

import AuthLayout from "@/components/layout/AuthLayout";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Link from "next/link";
import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";


export default function ForgotPasswordPage() {
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
      const code = (err as { code?: string })?.code ?? "";
      const MAP: Record<string, string> = {
        "auth/user-not-found":         "No account found with this email.",
        "auth/invalid-email":          "Please enter a valid email address.",
        "auth/too-many-requests":      "Too many attempts. Please wait a moment.",
        "auth/network-request-failed": "Network error. Check your connection.",
      };
      setError(MAP[code] ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <AuthLayout title="Check your email" subtitle={`We sent a reset link to ${email}`}>
        <div className="space-y-5 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--blue-soft)] text-2xl">
            📬
          </div>
          <p className="text-sm leading-relaxed text-[var(--ink-soft)]">
            Click the link in the email to set a new password. It may take a
            minute to arrive — check your spam folder if you don&apos;t see it.
          </p>
          <Button
            variant="ghost"
            fullWidth
            onClick={() => { setSent(false); setEmail(""); }}
          >
            Use a different email
          </Button>
          <p className="text-center text-sm text-[var(--ink-soft)]">
            <Link href="/login" className="font-medium text-[var(--blue)]">
              Back to sign in
            </Link>
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Forgot password?"
      subtitle="Enter your email and we'll send you a reset link."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Email address"
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        {error && (
          <p className="rounded-xl bg-[var(--blue)]/5 px-4 py-3 text-sm text-red-500">
            {error}
          </p>
        )}

        <Button type="submit" fullWidth disabled={loading}>
          {loading ? "Sending…" : "Send reset link"}
        </Button>

        <p className="text-center text-sm text-[var(--ink-soft)]">
          Remember it?{" "}
          <Link href="/login" className="font-medium text-[var(--blue)]">
            Back to sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

