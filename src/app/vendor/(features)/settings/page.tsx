"use client";

import Button from "@/components/ui/Button";
import { PageHeader } from "@/components/vendor/VendorUI";
import { useVendorAuth } from "@/context/VendorAuthContext";
import { useState } from "react";
import {
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
} from "firebase/auth";
import { auth } from "@/lib/firebase";


function PasswordInput({
  placeholder, value, onChange,
}: {
  placeholder: string; value: string; onChange: (v: string) => void;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="
          w-full rounded-2xl border border-[var(--line)]
          bg-white px-4 py-4 pr-14 text-sm outline-none transition-all
          placeholder:text-[var(--grey-300)]
          focus:border-[var(--blue)] focus:ring-4 focus:ring-[rgba(30,91,255,.10)]
        "
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors"
      >
        {show ? "Hide" : "Show"}
      </button>
    </div>
  );
}

function strengthLabel(pw: string): { label: string; color: string; width: string } {
  if (!pw) return { label: "", color: "bg-[var(--grey-200)]", width: "0%" };
  if (pw.length < 6) return { label: "Weak", color: "bg-[var(--blue)]", width: "25%" };
  if (pw.length < 10) return { label: "Fair", color: "bg-amber-400", width: "55%" };
  const hasSpecial = /[^a-zA-Z0-9]/.test(pw);
  const hasNum = /\d/.test(pw);
  if (hasSpecial && hasNum) return { label: "Strong", color: "bg-[var(--forest)]", width: "100%" };
  return { label: "Good", color: "bg-[var(--forest)]", width: "75%" };
}


export default function VendorSettingsPage() {
  const { vendor, logout } = useVendorAuth();

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const strength = strengthLabel(next);
  const mismatch = confirm.length > 0 && next !== confirm;
  const canSubmit = current.length > 0 && next.length >= 8 && next === confirm;


  async function handleSubmit() {
    setError(""); setSaving(true); setSuccess(false);

    const user = auth.currentUser;
    if (!user?.email) { setError("Not signed in."); setSaving(false); return; }

    try {
      // Re-authenticate first
      const credential = EmailAuthProvider.credential(user.email, current);
      await reauthenticateWithCredential(user, credential);

      // Then update password
      await updatePassword(user, next);

      setSuccess(true);
      setCurrent(""); setNext(""); setConfirm("");
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? "";
      if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
        setError("Current password is incorrect.");
      } else if (code === "auth/too-many-requests") {
        setError("Too many attempts. Please wait a moment.");
      } else {
        setError("Failed to update password. Try again.");
      }
    } finally {
      setSaving(false);
    }
  }


  return (
    <>
      <PageHeader
        title={<>Account <em className="italic text-[var(--blue)]">settings</em></>}
        sub="Manage your sign-in credentials."
      />

      <div className="max-w-md space-y-5">

        {/* Change password */}
        <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
          <div className="border-b border-[var(--line)] px-6 py-4">
            <h3 className="text-base font-medium" style={{ fontFamily: "var(--font-display)" }}>
              Change password
            </h3>
          </div>
          <div className="space-y-5 p-6">
            {success && (
              <div className="flex items-center gap-3 rounded-2xl border border-[var(--forest)]/20 bg-[var(--forest)]/5 px-4 py-3">
                <span>✓</span>
                <p className="text-sm font-medium text-[var(--forest)]">Password updated successfully.</p>
              </div>
            )}
            {error && (
              <div className="rounded-2xl border border-[var(--blue)]/20 bg-[var(--blue)]/5 px-4 py-3 text-sm text-[var(--blue)]">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-widest text-[var(--mute)]">
                Current password
              </label>
              <PasswordInput placeholder="Enter your current password" value={current} onChange={setCurrent} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-widest text-[var(--mute)]">
                New password
              </label>
              <PasswordInput placeholder="Min 8 characters" value={next} onChange={(v) => { setNext(v); setSuccess(false); }} />
              {next.length > 0 && (
                <div className="mt-1">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--grey-100)]">
                    <div className={`h-full rounded-full transition-all duration-500 ${strength.color}`} style={{ width: strength.width }} />
                  </div>
                  <p className="mt-1 text-xs text-[var(--ink-soft)]">
                    Strength: <span className="font-semibold text-[var(--ink)]">{strength.label}</span>
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-widest text-[var(--mute)]">
                Confirm new password
              </label>
              <PasswordInput placeholder="Repeat new password" value={confirm} onChange={(v) => { setConfirm(v); setSuccess(false); }} />
              {mismatch && <p className="text-xs text-[var(--blue)]">Passwords don't match.</p>}
            </div>

            <Button fullWidth onClick={handleSubmit} disabled={!canSubmit || saving}>
              {saving ? "Updating…" : "Update password"}
            </Button>
          </div>
        </div>

        {/* Session */}
        <div className="rounded-2xl border border-[var(--line)] bg-white p-5">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-[var(--mute)]">
            Current session
          </p>
          <div className="space-y-2.5 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-[var(--ink-soft)]">Signed in as</span>
              <span className="font-medium text-[var(--ink)]">{vendor?.email ?? "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--ink-soft)]">Business</span>
              <span className="font-medium text-[var(--ink)]">{vendor?.name ?? "—"}</span>
            </div>
          </div>
          <div className="mt-4 border-t border-[var(--line)] pt-4">
            <Button variant="ghost" fullWidth onClick={logout}>Sign out</Button>
          </div>
        </div>

      </div>
    </>
  );
}




