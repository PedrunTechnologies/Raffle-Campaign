"use client";

import { useState } from "react";
import type { VoucherRecord } from "@/lib/types";

function fmtTs(ts: { _seconds: number } | null | undefined): string {
  if (!ts) return "—";
  return new Date(ts._seconds * 1000).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

/* ── Copy button ─────────────────────────────────────────────────────── */

function CopyButton({ text, light = false }: { text: string; light?: boolean }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      title={copied ? "Copied!" : "Copy code"}
      className={`
        flex items-center gap-1.5 rounded-lg px-2.5 py-1.5
        text-[11px] font-semibold transition-all active:scale-95
        ${light
          ? "bg-[var(--lime-d)]/20 text-[var(--lime-ink)] hover:bg-[var(--lime-d)]/30"
          : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
        }
      `}
    >
      {copied ? (
        <>
          <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
            <path d="M1 5l3.5 3.5L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Copied
        </>
      ) : (
        <>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <rect x="4" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M2.5 8H2a1 1 0 01-1-1V2a1 1 0 011-1h5a1 1 0 011 1v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          Copy
        </>
      )}
    </button>
  );
}

/* ── Raffle voucher card (dark) ──────────────────────────────────────── */

export interface RaffleVoucherCardProps {
  voucher:         VoucherRecord;
  /** Live countdown string e.g. "03:42:10" shown while draw hasn't run */
  countdown?:      string;
  countdownLabel?: string;
  compact?:        boolean;
}

export function RaffleVoucherCard({
  voucher,
  countdown,
  countdownLabel = "Draw closes in",
  compact = false,
}: RaffleVoucherCardProps) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl bg-[var(--ink)] text-white"
      style={{ padding: compact ? "1.25rem" : "1.5rem" }}
    >
      {/* Cutout circles */}
      <div className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-[var(--bg)]" />
      <div className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-[var(--bg)]" />

      {/* Top */}
      <div className="mb-4">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-[var(--lime)]">
          {compact ? "Raffle" : "Free Meal"} voucher {voucher.status === "eligible" ? " · active" : (" · " + voucher.status)}
        </p>

        {/* Code + copy */}
        <div className="flex items-center gap-3">
          <p className="font-mono text-xl font-semibold tracking-wider">{voucher.code}</p>
          <CopyButton text={voucher.code} />
        </div>

        {!compact && (
          <p className="mt-1 text-sm text-white/60">
            Issued {fmtTs(voucher.issuedAt as unknown as { _seconds: number })}
            {" · "}
            Expires {fmtTs(voucher.expiresAt as unknown as { _seconds: number })}
          </p>
        )}
      </div>

      {/* Bottom */}
      <div className="flex items-center justify-between border-t border-dashed border-white/20 pt-4">
        {countdown ? (
          <>
            <p className="text-sm text-white/70">{countdownLabel}</p>
            <span className="font-mono text-xl font-semibold text-[var(--lime)]">{countdown}</span>
          </>
        ) : (
          <>
            <p className="text-sm text-white/70">Status</p>
            <span
              className="rounded-lg px-3 py-1 text-xs font-semibold"
              style={{
                background: voucher.type === "free" ? "var(--lime)" : "rgba(255,255,255,0.15)",
                color:      voucher.type === "free" ? "var(--lime-ink)" : "#fff",
              }}
            >
              {voucher.type === "free" ? "Free meal" : `${voucher.discountPct}% off`}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Discount voucher card (lime) ────────────────────────────────────── */

export interface DiscountVoucherCardProps {
  voucher:  VoucherRecord;
  compact?: boolean;
}

export function DiscountVoucherCard({ voucher, compact = false }: DiscountVoucherCardProps) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      style={{ background: "var(--lime)", padding: compact ? "1.25rem" : "1.75rem" }}
    >
      <div className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-[var(--bg)]" />
      <div className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-[var(--bg)]" />

      <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-[var(--lime-ink)]">
        Your discount
      </p>

      <p
        className="mb-1 font-light leading-none text-[var(--ink)]"
        style={{
          fontFamily: "var(--font-display)",
          fontSize:   compact ? "2rem" : "clamp(48px, 10vw, 72px)",
          fontWeight: 300,
        }}
      >
        {voucher.discountPct}%<em className="italic"> off</em>
      </p>

      {/* Code + copy */}
      <div className="mb-3 flex items-center gap-3">
        <p className="font-mono text-sm font-semibold tracking-wider text-[var(--ink)]">
          USE: {voucher.code}
        </p>
        <CopyButton text={voucher.code} light />
      </div>

      <div className="border-t border-dashed border-[var(--lime-d)]/40 pt-3">
        <p className="text-xs font-medium text-[var(--lime-ink)]/70">
          Valid at {voucher.vendorName} until {fmtTs(voucher.expiresAt as unknown as { _seconds: number })}
        </p>
      </div>
    </div>
  );
}
