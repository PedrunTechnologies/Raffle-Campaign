"use client";

import Logo from "@/components/ui/Logo";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
// import { auth } from "@/lib/firebase";


import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";



function friendlyError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";
  const MAP: Record<string, string> = {
    "auth/user-not-found": "No account found with this email.",
    "auth/wrong-password": "Incorrect password.",
    "auth/invalid-credential": "Incorrect email or password.",
    "auth/too-many-requests": "Too many attempts. Please wait a moment.",
    "auth/network-request-failed": "Network error. Check your connection.",
  };
  return MAP[code] ?? "Something went wrong. Please try again.";
}


export default function VendorLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // After signInWithEmailAndPassword succeeds:
  onAuthStateChanged(auth, (user) => {
    console.log("Auth state:", user?.email, user?.uid);
  });


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await cred.user.getIdToken();

      const res = await fetch("/api/vendor/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      const data = await res.json() as { error?: string };

      if (!res.ok) {
        setError(data.error ?? "Access denied.");
        return;
      }

      router.push("/vendor/dashboard");
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }


  return (
    <div className="flex min-h-screen bg-[var(--bg)]">

      {/* ── Left panel ── */}
      <div className="hidden flex-col justify-between bg-[var(--bg-2)] p-16 lg:flex lg:w-1/2 text-white" style={{
        background:
          "radial-gradient(at 15% 15%, rgba(30,91,255,.55), transparent 50%), radial-gradient(at 85% 85%, rgba(217,242,60,.20), transparent 55%), #0A0F1F",
      }}>
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
            Get discovered. Get{" "}
            <em className="italic text-[var(--lime)]">delivered.</em>
          </h1>
          <p className="max-w-sm text-base leading-relaxed text-white/60">
            Set your supply each day. Verify voucher codes at the counter.
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

        <form onSubmit={handleSubmit} className="w-full max-w-sm">
          <h2
            className="mb-1 text-2xl font-medium"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Vendor sign-in
          </h2>
          <p className="mb-8 text-sm text-[var(--ink-soft)]">
            For approved vendors only.
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

          {/* Password */}
          <div className="mb-6 flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-widest text-[var(--mute)]">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••"
              required
              autoComplete="current-password"
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
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </div>

          <p className="mt-6 text-center text-sm text-[var(--ink-soft)]">
            Not a vendor yet?{" "}
            <Link
              href="/vendor/apply"
              className="font-medium text-[var(--blue)] underline underline-offset-2"
            >
              Apply to join
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}


