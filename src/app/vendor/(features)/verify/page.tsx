"use client";

import Button from "@/components/ui/Button";
import { Badge, PageHeader } from "@/components/vendor/VendorUI";
import { useState } from "react";
import { vendorGet, vendorPost, VendorFetchError } from "@/lib/vendor-fetch";
import type { VoucherRecord } from "@/lib/types";

type VerifyState = "idle" | "checking" | "valid" | "redeemed" | "expired" | "unknown";

interface LookupResult { state: VerifyState; voucher?: VoucherRecord; }

function fmtTs(ts: { _seconds: number } | null | undefined): string {
  if (!ts) return "—";
  return new Date(ts._seconds * 1000).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}










const MOCK_CODES: Record<string, VerifyState> = {
  "PR-9X4K-A28T": "valid",
  "PR-USED-0000": "redeemed",
  "PR-EXPR-0000": "expired",
};

export default function VerifyPage() {
  const [code, setCode] = useState("");
  const [state, setState] = useState<VerifyState>("idle");
  const [voucher, setVoucher] = useState<VoucherRecord | null>(null);
  const [marking, setMarking] = useState(false);
  const [markedDone, setMarkedDone] = useState(false);
  const [error, setError] = useState("");


  async function handleVerify() {
    if (!code.trim()) return;
    setState("checking"); setError(""); setVoucher(null); setMarkedDone(false);
    try {
      const res = await vendorGet<LookupResult>(`/api/vendor/verify?code=${encodeURIComponent(code.trim())}`);
      setState(res.state);
      setVoucher(res.voucher ?? null);
    } catch (err) {
      setError(err instanceof VendorFetchError ? err.message : "Network error.");
      setState("unknown");
    }
  }

  async function handleRedeem() {
    setMarking(true); setError("");
    try {
      await vendorPost("/api/vendor/verify", { code: code.trim() });
      setMarkedDone(true);
      setState("redeemed");
    } catch (err) {
      setError(err instanceof VendorFetchError ? err.message : "Failed to redeem.");
    } finally {
      setMarking(false);
    }
  }

  function handleReset() {
    setCode(""); setState("idle"); setVoucher(null); setMarkedDone(false); setError("");
  }

  const isValid = state === "valid" && !markedDone;

  return (
    <>
      <PageHeader
        title={<>Verify a <em className="italic text-[var(--blue)]">voucher code</em></>}
        sub="Customer-facing screen. Use this at the counter when a voucher is presented."
      />

      <div className="max-w-lg">
        {/* Input card */}
        <div className="mb-5 rounded-2xl border border-[var(--line)] bg-white p-6 text-center">
          <p className="mb-4 text-sm text-[var(--ink-soft)]">Enter the voucher code</p>
          <input
            value={code}
            onChange={(e) => { setCode(e.target.value.toUpperCase()); setState("idle"); setMarkedDone(false); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleVerify()}
            placeholder="PR-XXXX-XXXX"
            className="
              mb-4 w-full rounded-xl border-2 border-[var(--ink)]
              bg-white px-4 py-4 text-center font-mono text-xl
              font-semibold tracking-widest text-[var(--ink)] outline-none
              placeholder:text-[var(--grey-300)]
              focus:border-[var(--blue)] transition-colors
            "
          />
          <Button fullWidth onClick={handleVerify} disabled={!code.trim() || state === "checking"}>
            {state === "checking" ? "Checking…" : "Verify code"}
          </Button>
        </div>

        {/* Result card */}
        {state !== "idle" && state !== "checking" && (
          <div className={`rounded-2xl border p-5 transition-all ${isValid ? "border-[var(--forest)]/30 bg-[var(--forest)]/5"
              : markedDone ? "border-[var(--grey-200)] bg-[var(--grey-50)]"
                : state === "redeemed" ? "border-[var(--grey-200)] bg-[var(--grey-50)]"
                  : "border-[var(--blue)]/20 bg-[var(--blue)]/5"
            }`}>

            {/* Top row */}
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-[var(--mute)]">Result</p>
                {isValid && <p className="font-semibold text-[var(--forest)]">✓ Valid — {voucher?.type === "free" ? "free meal" : `${voucher?.discountPct}% discount`}</p>}
                {markedDone && <p className="font-semibold text-[var(--ink-soft)]">✓ Marked as redeemed</p>}
                {state === "redeemed" && !markedDone && <p className="font-semibold text-[var(--ink-soft)]">Already redeemed at {fmtTs(voucher?.redeemedAt as unknown as { _seconds: number } | null)}</p>}
                {state === "expired" && <p className="font-semibold text-[var(--blue)]">Voucher expired</p>}
                {state === "unknown" && <p className="font-semibold text-[var(--blue)]">Code not found</p>}
              </div>
              {isValid && <Badge variant="ok">VALID</Badge>}
              {markedDone && <Badge variant="info">REDEEMED</Badge>}
              {state === "redeemed" && !markedDone && <Badge variant="info">USED</Badge>}
              {state === "expired" && <Badge variant="danger">EXPIRED</Badge>}
              {state === "unknown" && <Badge variant="danger">INVALID</Badge>}
            </div>

            {/* Details */}
            {voucher && (isValid || markedDone) && (
              <div className="mb-4 space-y-2 border-t border-[var(--line)] pt-4">
                {[
                  { label: "Code", value: voucher.code, mono: true },
                  { label: "Type", value: voucher.type === "free" ? "Free meal" : `${voucher.discountPct}% discount` },
                  { label: "Expires", value: fmtTs(voucher.expiresAt as unknown as { _seconds: number }) },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-[var(--mute)]">{row.label}</span>
                    <span className={`text-sm font-medium text-[var(--ink)] ${row.mono ? "font-mono" : ""}`}>{row.value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Error */}
            {error && <p className="mb-4 text-sm text-[var(--blue)]">{error}</p>}

            {/* Actions */}
            <div className="flex gap-2">
              {isValid && (
                <Button fullWidth onClick={handleRedeem} disabled={marking}>
                  {marking ? "Marking…" : "Mark redeemed"}
                </Button>
              )}
              <Button variant="ghost" fullWidth onClick={handleReset}>
                {isValid || markedDone ? "Verify another" : "Try again"}
              </Button>
            </div>
          </div>
        )}
      </div>


      <div className="max-w-lg">
        {/* Result card */}
        {/* {state !== "idle" && state !== "checking" && (
          <div
            className={`rounded-2xl border p-5 transition-all ${isValid
                ? "border-[var(--forest)]/30 bg-[var(--forest)]/5"
                : state === "redeemed"
                  ? "border-[var(--grey-200)] bg-[var(--grey-50)]"
                  : "border-[var(--blue)]/20 bg-[var(--blue)]/5"
              }`}
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-[var(--mute)]">
                  Result
                </p>
                {isValid && (
                  <p className="text-base font-semibold text-[var(--forest)]">
                    ✓ Valid — free meal
                  </p>
                )}
                {markedDone && (
                  <p className="text-base font-semibold text-[var(--ink-soft)]">
                    ✓ Marked as redeemed
                  </p>
                )}
                {state === "redeemed" && (
                  <p className="text-base font-semibold text-[var(--ink-soft)]">
                    Already redeemed at 11:24
                  </p>
                )}
                {state === "expired" && (
                  <p className="text-base font-semibold text-[var(--blue)]">
                    Voucher expired
                  </p>
                )}
                {state === "unknown" && (
                  <p className="text-base font-semibold text-[var(--blue)]">
                    Code not found
                  </p>
                )}
              </div>
              {isValid && <Badge variant="ok">VALID</Badge>}
              {markedDone && <Badge variant="info">REDEEMED</Badge>}
              {state === "redeemed" && <Badge variant="info">USED</Badge>}
              {state === "expired" && <Badge variant="danger">EXPIRED</Badge>}
              {state === "unknown" && <Badge variant="danger">INVALID</Badge>}
            </div>

            {(isValid || markedDone) && (
              <div className="mb-4 space-y-2 border-t border-[var(--line)] pt-4">
                {[
                  { label: "Code", value: code, mono: true },
                  { label: "Holder", value: "Adaeze O." },
                  { label: "Type", value: "Free meal (winner)" },
                  { label: "Issued", value: "11 May · 09:24" },
                  { label: "Expires", value: "11 May · 21:00" },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between"
                  >
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-[var(--mute)]">
                      {row.label}
                    </span>
                    <span
                      className={`text-sm font-medium text-[var(--ink)] ${row.mono ? "font-mono" : ""
                        }`}
                    >
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )} */}

        {/* Helper note */}
        {/* <p className="mt-4 text-xs text-[var(--mute)]">
          3 states: valid → mark redeemed · already redeemed → blocked · expired → no action.
        </p> */}
      </div>
    </>
  );
}


