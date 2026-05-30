"use client";

import AuthNavbar from "@/components/participant/AuthNavbar";
import Button from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import type { SocialPlatform } from "@/lib/user";
import { participantPost } from "@/lib/participant-fetch";

/* ── types ──────────────────────────────────────────────────────────── */

type VerifyState = "idle" | "checking" | "valid" | "not_found" | "taken" | "error";

interface PlatformState {
  handle: string;
  verifyState: VerifyState;
  savedHandle: string | null;
}

/* ── platform config ─────────────────────────────────────────────────── */

const PLATFORMS: {
  id: SocialPlatform;
  label: string;
  placeholder: string;
  prefix: string;
  icon: React.ReactNode;
}[] = [
    {
      id: "instagram",
      label: "Instagram",
      placeholder: "yourhandle",
      prefix: "@",
      icon: (
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
          style={{ background: "linear-gradient(135deg,#FEDA77,#F58529,#DD2A7B,#8134AF)" }}
        >
          Ig
        </div>
      ),
    },
    {
      id: "facebook",
      label: "Facebook",
      placeholder: "yourhandle",
      prefix: "fb/",
      icon: (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1877F2] text-sm font-bold text-white">
          Fb
        </div>
      ),
    },
    // {
    //   id: "x",
    //   label: "X (Twitter)",
    //   placeholder: "yourhandle",
    //   prefix: "@",
    //   icon: (
    //     <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black text-sm font-bold text-white">
    //       X
    //     </div>
    //   ),
    // },
  ];

/* ── verify badge ────────────────────────────────────────────────────── */

function VerifyBadge({ state }: { state: VerifyState }) {
  const map: Record<VerifyState, { label: string; cls: string } | null> = {
    idle: null,
    checking: { label: "Checking…", cls: "bg-[var(--grey-100)] text-[var(--mute)]" },
    valid: { label: "✓ Verified", cls: "bg-[var(--forest)]/10 text-[var(--forest)]" },
    not_found: { label: "Not found", cls: "bg-[var(--blue)]/10 text-[var(--blue)]" },
    taken: { label: "Already used", cls: "bg-red-100 text-red-700" },
    error: { label: "Try again", cls: "bg-[var(--grey-100)] text-[var(--mute)]" },
  };
  const item = map[state];
  if (!item) return null;
  return (
    <span className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${item.cls}`}>
      {item.label}
    </span>
  );
}

/* ── page ────────────────────────────────────────────────────────────── */

export default function LinkSocialsPage() {
  const { profile, refreshProfile, loading } = useAuth();
  const router = useRouter();

  const [platforms, setPlatforms] = useState<Record<SocialPlatform, PlatformState>>({
    instagram: { handle: "", verifyState: "idle", savedHandle: null },
    facebook: { handle: "", verifyState: "idle", savedHandle: null },
    // x: { handle: "", verifyState: "idle", savedHandle: null },
  });

  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState("");
  const [saved, setSaved] = useState(false);

  const debounceRefs = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  /* ── pre-fill saved handles from Firestore ── */
  useEffect(() => {
    if (!profile?.socials) return;
    setPlatforms((prev) => {
      const next = { ...prev };
      (Object.keys(profile.socials) as SocialPlatform[]).forEach((id) => {
        const handle = profile.socials[id]?.handle ?? "";
        if (handle) {
          next[id] = { handle, verifyState: "valid", savedHandle: handle };
        }
      });
      return next;
    });
  }, [profile]);

  /* ── handle input change — strip prefix typos, debounce verify ── */
  function handleChange(id: SocialPlatform, raw: string) {
    const clean = raw.replace(/^@+/, "").replace(/^fb\//, "").toLowerCase();

    setPlatforms((prev) => ({
      ...prev,
      [id]: { ...prev[id], handle: clean, verifyState: "idle" },
    }));

    clearTimeout(debounceRefs.current[id]);
    if (!clean) return;

    debounceRefs.current[id] = setTimeout(() => verify(id, clean), 800);
  }

  /* ── call the handle existence API ── */
  async function verify(id: SocialPlatform, handle: string) {
    if (!handle) return;

    setPlatforms((prev) => ({
      ...prev,
      [id]: { ...prev[id], verifyState: "checking" },
    }));

    try {
      const res = await fetch(
        `/api/participant/verify-handle?platform=${id}&handle=${encodeURIComponent(handle)}`,
        { credentials: "include" }
      );
      const data = await res.json() as { exists: boolean; taken?: boolean; };

      setPlatforms((prev) => ({
        ...prev,
        [id]: { ...prev[id], verifyState: data.taken ? "taken" : "valid", },
      }));
    } catch {
      setPlatforms((prev) => ({
        ...prev,
        [id]: { ...prev[id], verifyState: "error" },
      }));
    }
  }

  /* ── save all verified handles to Firestore ── */
  async function handleSave() {
    const verified = (Object.entries(platforms) as [SocialPlatform, PlatformState][])
      .filter(([, s]) => s.verifyState === "valid" && s.handle)
      .map(([id, s]) => ({ platform: id, handle: s.handle }));

    if (!verified.length) {
      setSaveErr("Verify at least one handle before continuing.");
      return;
    }

    setSaving(true); setSaveErr("");

    try {
      await participantPost("/api/participant/socials", { socials: verified });

      await refreshProfile();
      setSaved(true);
      setTimeout(() => router.push("/dashboard"), 800);
    } catch {
      setSaveErr("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const verifiedCount = Object.values(platforms).filter(
    (s) => s.verifyState === "valid" && s.handle
  ).length;

  /* ── loading ── */
  if (loading) {
    return (
      <>
        <AuthNavbar />
        <main className="flex min-h-screen items-center justify-center">
          <p className="text-sm text-[var(--ink-soft)]">Loading…</p>
        </main>
      </>
    );
  }

  return (
    <>
      <AuthNavbar />

      <main className="min-h-screen px-6 py-16 md:py-24">
        <div className="mx-auto max-w-lg">

          {/* Header */}
          <div className="mb-10">
            <span className="mb-5 inline-flex rounded-full bg-[var(--blue-soft)] px-4 py-2 text-sm font-medium text-[var(--blue)]">
              Connect socials
            </span>
            <h1
              className="mb-3 text-4xl leading-tight tracking-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Add your{" "}
              <em className="italic text-[var(--blue)]">handles.</em>
            </h1>
            <p className="text-base leading-relaxed text-[var(--ink-soft)]">
              Enter your username on each platform you use. We&apos;ll confirm
              the account has not been added, then use it to track your tasks each cycle.
            </p>
          </div>

          {/* Platform rows */}
          <div className="mb-6 flex flex-col gap-4">
            {PLATFORMS.map((p) => {
              const s = platforms[p.id];
              return (
                <div
                  key={p.id}
                  className="rounded-2xl border border-[var(--line)] bg-white px-5 py-4"
                >
                  {/* Row header */}
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {p.icon}
                      <span className="text-sm font-semibold text-[var(--ink)]">
                        {p.label}
                      </span>
                    </div>
                    <VerifyBadge state={s.verifyState} />
                  </div>

                  {/* Input */}
                  <div
                    className="
                      flex overflow-hidden rounded-xl border
                      border-[var(--line)] bg-[var(--grey-50)]
                      transition-all
                      focus-within:border-[var(--blue)]
                      focus-within:ring-2 focus-within:ring-[var(--blue)]/10
                    "
                  >
                    <span className="flex items-center border-r border-[var(--line)] bg-white px-3 text-sm font-medium text-[var(--mute)]">
                      {p.prefix}
                    </span>
                    <input
                      type="text"
                      value={s.handle}
                      onChange={(e) => handleChange(p.id, e.target.value)}
                      placeholder={p.placeholder}
                      className="
                        flex-1 bg-transparent px-3 py-3 text-sm
                        text-[var(--ink)] outline-none
                        placeholder:text-[var(--grey-300)]
                      "
                    />
                    {/* Manual re-verify */}
                    {s.handle && s.verifyState !== "checking" && s.verifyState !== "valid" && (
                      <button
                        type="button"
                        onClick={() => verify(p.id, s.handle)}
                        className="px-3 text-xs font-semibold text-[var(--blue)] hover:opacity-70 transition-opacity"
                      >
                        Verify
                      </button>
                    )}
                  </div>

                  {/* Hint text */}
                  <p className="mt-2 text-xs text-[var(--ink-soft)]">
                    {s.verifyState === "not_found" &&
                      "We couldn't find this account. Check for typos."}
                    {s.verifyState === "taken" &&
                      "Another participant is already using this handle."}
                    {s.verifyState === "valid" &&
                      s.savedHandle === s.handle &&
                      `Saved · ${p.prefix}${s.handle}`}
                    {s.verifyState === "valid" &&
                      s.savedHandle !== s.handle &&
                      "Ready to save"}
                    {s.verifyState === "idle" &&
                      !s.handle &&
                      `Your ${p.label} username — make sure your account is public`}
                    {s.verifyState === "error" &&
                      "Something went wrong. Click Verify to try again."}
                  </p>
                </div>
              );
            })}
          </div>

          {/* How it works note */}
          <div className="mb-8 rounded-2xl border border-[var(--line)] bg-[var(--grey-50)] px-5 py-4">
            <p className="text-xs leading-relaxed text-[var(--ink-soft)]">
              <span className="mr-1 font-semibold text-[var(--ink)]">
                How tasks work:
              </span>
              Each cycle, you&apos;ll complete tasks like following an account or
              sharing a post. You mark tasks as done yourself — our team
              spot-checks entries using your handle before the draw runs. Keep
              your accounts <strong className="text-[var(--ink)]">public</strong>{" "}
              so we can verify.
            </p>
          </div>

          {/* Error */}
          {saveErr && (
            <div className="mb-5 rounded-2xl border border-[var(--blue)]/20 bg-[var(--blue)]/5 px-5 py-4 text-sm text-[var(--blue)]">
              {saveErr}
            </div>
          )}

          {/* CTA */}
          <div className="flex flex-col gap-3">
            <Button
              fullWidth
              onClick={handleSave}
              loading={saving}
              disabled={!verifiedCount || saving}
            >
              {saved
                ? "✓ Saved"
                : saving
                  ? "Saving…"
                  : verifiedCount
                    ? `Save & continue  (${verifiedCount} verified)`
                    : "Verify at least one handle to continue"}
            </Button>
            <p className="text-center text-xs text-[var(--mute)]">
              Your handles are only used to verify campaign tasks.
            </p>
          </div>

        </div>
      </main>
    </>
  );
}
