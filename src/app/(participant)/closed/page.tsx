"use client";

import Navbar from "@/components/participant/Navbar";
import Button from "@/components/ui/Button";
import { useState } from "react";

export default function WindowClosedPage() {
  const [notified, setNotified] = useState(false);

  return (
    <>
      <Navbar />

      <main className="flex min-h-screen items-center px-6 py-16">
        <div className="mx-auto w-full max-w-md">

          {/* Moon icon */}
          <div
            className="
              mb-8 flex h-20 w-20 items-center justify-center
              rounded-3xl bg-[var(--grey-50)]
              border border-[var(--line)]
              text-4xl
            "
          >
            🌙
          </div>

          {/* Copy */}
          <h1
            className="mb-3 text-4xl leading-tight tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            We&apos;re between{" "}
            <em className="italic text-[var(--blue)]">rounds.</em>
          </h1>

          <p className="mb-10 text-base leading-relaxed text-[var(--ink-soft)]">
            All of today&apos;s vouchers have been claimed.
            Come back tomorrow — the next draw opens at 09:00 WAT.
          </p>

          {/* Info card */}
          <div
            className="
              mb-8 rounded-2xl border border-[var(--line)]
              bg-white p-6
            "
          >
            <div className="mb-5 border-b border-[var(--line)] pb-5">
              <p
                className="
                  mb-1.5 text-xs font-semibold uppercase
                  tracking-widest text-[var(--mute)]
                "
              >
                Next window opens
              </p>
              <p className="font-mono text-lg font-semibold text-[var(--ink)]">
                Tomorrow · 09:00 WAT
              </p>
            </div>

            <div>
              <p
                className="
                  mb-1.5 text-xs font-semibold uppercase
                  tracking-widest text-[var(--mute)]
                "
              >
                Expected vouchers
              </p>
              <p className="font-mono text-lg font-semibold text-[var(--ink)]">
                ≈ 150
              </p>
              <p className="mt-1 text-sm text-[var(--ink-soft)]">
                Based on current vendor opt-ins for cycle #215
              </p>
            </div>
          </div>

          {/* CTA */}
          {notified ? (
            <div
              className="
                flex items-center gap-3 rounded-2xl
                border border-[var(--forest)]/20
                bg-[var(--forest)]/5 px-5 py-4
              "
            >
              <span className="text-xl">✓</span>
              <div>
                <p className="text-sm font-semibold text-[var(--forest)]">
                  You&apos;re on the list.
                </p>
                <p className="text-xs text-[var(--ink-soft)]">
                  We&apos;ll notify you the moment the window opens.
                </p>
              </div>
            </div>
          ) : (
            <Button fullWidth onClick={() => setNotified(true)}>
              Notify me when it opens
            </Button>
          )}

          <p className="mt-4 text-center text-xs text-[var(--mute)]">
            Push & SMS — you can unsubscribe any time in settings.
          </p>

        </div>
      </main>
    </>
  );
}
