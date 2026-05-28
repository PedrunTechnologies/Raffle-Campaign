"use client";

import AuthLayout from "@/components/layout/AuthLayout";
import Button from "@/components/ui/Button";
import Divider from "@/components/ui/Divider";
import GoogleButton from "@/components/ui/GoogleButton";
import Input from "@/components/ui/Input";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { signUpWithEmail, signInWithGoogle } from "@/lib/auth-actions";


export default function SignupPage() {
  const router       = useRouter();
  const redirect     = "/link-socials";

  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [phone,    setPhone]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  /* ── email / password signup ── */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signUpWithEmail({ name, email, phone, password });
      router.push(redirect);
    } catch (err: unknown) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  /* ── Google signup ── */
  async function handleGoogle() {
    setError("");
    setLoading(true);
    try {
      await signInWithGoogle();
      router.push(redirect);
    } catch (err: unknown) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Create account" subtitle="Join today's raffle campaign.">
      <form onSubmit={handleSubmit} className="space-y-5">

        <GoogleButton onClick={handleGoogle} disabled={loading} />

        <Divider label="OR" />

        <Input
          label="Full name"
          placeholder="Firstname Lastname"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <Input
          label="Email address"
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Input
          label="Phone number"
          type="tel"
          placeholder="+2348012345678"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <Input
          label="Password"
          type="password"
          placeholder="Minimum 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />

        {error && (
          <p className="rounded-xl bg-[var(--blue)]/5 px-4 py-3 text-sm text-red-500">
            {error}
          </p>
        )}

        <Button fullWidth disabled={loading}>
          {loading ? "Creating account…" : "Create Account"}
        </Button>

        <p className="text-center text-sm text-[var(--ink-soft)]">
          Already have an account?{" "}
          <Link href="/login" className="ml-1 font-medium text-[var(--blue)]">
            Login
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}


/* ── map Firebase error codes to human-readable messages ── */
function friendlyError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";
  const MAP: Record<string, string> = {
    "auth/email-already-in-use":    "An account with this email already exists.",
    "auth/invalid-email":           "Please enter a valid email address.",
    "auth/weak-password":           "Password must be at least 8 characters.",
    "auth/popup-closed-by-user":    "Google sign-in was cancelled.",
    "auth/network-request-failed":  "Network error. Check your connection.",
  };
  return MAP[code] ?? "Something went wrong. Please try again.";
}


