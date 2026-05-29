"use client";

import AuthLayout from "@/components/layout/AuthLayout";
import Button from "@/components/ui/Button";
import Divider from "@/components/ui/Divider";
import GoogleButton from "@/components/ui/GoogleButton";
import Input from "@/components/ui/Input";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { signInWithEmail, signInWithGoogle } from "@/lib/auth-actions";

export default function LoginPage() {
  const router       = useRouter();
  const redirect     = "/dashboard";

  const [email,   setEmail]   = useState("");
  const [password,setPassword]= useState("");
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmail({ email, password });
      router.push(redirect);
    } catch (err: unknown) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

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
    <AuthLayout title="Welcome back" subtitle="Login to continue.">
      <form onSubmit={handleSubmit} className="space-y-5">

        <GoogleButton onClick={handleGoogle} disabled={loading} />

        <Divider label="OR" />

        <Input
          label="Email address"
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Input
          label="Password"
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && (
          <p className="rounded-xl bg-[var(--blue)]/5 px-4 py-3 text-sm text-red-500">
            {error}
          </p>
        )}

        <Button type="submit" fullWidth disabled={loading}>
          {loading ? "Signing in…" : "Login"}
        </Button>

        <p className="text-center text-sm text-[var(--ink-soft)]">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="ml-1 font-medium text-[var(--blue)]">
            Sign up
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}


function friendlyError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";
  const MAP: Record<string, string> = {
    "auth/user-not-found":          "No account found with this email.",
    "auth/wrong-password":          "Incorrect password. Try again.",
    "auth/invalid-credential":      "Incorrect email or password.",
    "auth/too-many-requests":       "Too many attempts. Please wait a moment.",
    "auth/popup-closed-by-user":    "Google sign-in was cancelled.",
    "auth/network-request-failed":  "Network error. Check your connection.",
  };
  return MAP[code] ?? "Something went wrong. Please try again.";
}

