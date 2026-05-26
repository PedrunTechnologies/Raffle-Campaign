// "use client";

// import AuthNavbar from "@/components/participant/AuthNavbar";
// import Button from "@/components/ui/Button";
// import Link from "next/link";
// import { useState } from "react";

// type VoucherType = "won" | "discount";

// // In production this would come from the router/API.
// // Here we let the user toggle for demo purposes.

// export default function VoucherDetailPage() {
//   const [type, setType] = useState<VoucherType>("discount");

//   return (
//     <>
//       <AuthNavbar />

//       <main className="min-h-screen px-6 py-12 md:py-16">
//         <div className="mx-auto max-w-lg">

//           {/* Demo toggle — remove in production */}
//           <div className="mb-8 flex items-center gap-2">
//             <span className="text-[11px] font-semibold uppercase tracking-widest text-[var(--mute)]">
//               Demo:
//             </span>
//             {(["won", "discount"] as VoucherType[]).map((t) => (
//               <button
//                 key={t}
//                 onClick={() => setType(t)}
//                 className={`
//                   rounded-xl px-3 py-1.5 text-xs font-medium transition-all
//                   ${type === t
//                     ? "bg-[var(--ink)] text-white"
//                     : "border border-[var(--line)] bg-white text-[var(--ink-soft)]"
//                   }
//                 `}
//               >
//                 {t === "won" ? "🏆 Won" : "30% Discount"}
//               </button>
//             ))}
//           </div>

//           {type === "won" ? <WonDetail /> : <DiscountDetail />}

//         </div>
//       </main>
//     </>
//   );
// }

// function WonDetail() {
//   return (
//     <>
//       {/* Header */}
//       <div className="mb-6">
//         <span className="mb-4 inline-flex rounded-full bg-[var(--lime)]/40 px-4 py-2 text-sm font-semibold text-[var(--lime-ink)]">
//           🏆 Winner · Cycle #214
//         </span>
//         <h1
//           className="mb-1 text-3xl leading-tight tracking-tight md:text-4xl"
//           style={{ fontFamily: "var(--font-display)" }}
//         >
//           You won a{" "}
//           <em className="italic text-[var(--blue)]">free meal.</em>
//         </h1>
//         <p className="text-sm text-[var(--ink-soft)]">11 May 2026 · Delivered at 14:22</p>
//       </div>

//       {/* Voucher card */}
//       <div className="relative mb-6 overflow-hidden rounded-2xl bg-[var(--ink)] p-7 text-white">
//         <div className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-[var(--bg)]" />
//         <div className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-[var(--bg)]" />
//         <div className="absolute left-5 right-5 top-[58%] border-t border-dashed border-white/15" />

//         <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--lime)]">
//           Winner voucher — redeemed
//         </p>
//         <p className="mb-1 font-mono text-2xl font-semibold tracking-wider">PR-9X4K-A28T</p>
//         <p className="mb-6 text-sm text-white/60">Cycle #214 · 11 May 2026</p>

//         <div className="flex items-center gap-4 border-t border-dashed border-white/20 pt-5">
//           <div
//             className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl"
//             style={{ background: "rgba(217,242,60,.15)" }}
//           >
//             🛵
//           </div>
//           <div>
//             <p className="font-semibold">Jollof &amp; grilled chicken</p>
//             <p className="text-sm text-white/60">Mama Cass · delivered · 14:22</p>
//           </div>
//           <span className="ml-auto rounded-lg bg-[var(--lime)]/20 px-2.5 py-1 text-xs font-semibold text-[var(--lime)]">
//             ✓ Used
//           </span>
//         </div>
//       </div>

//       {/* Meta */}
//       <div className="mb-6 grid grid-cols-2 gap-3">
//         {[
//           { l: "Fulfilment",   v: "Delivery · Pedrun" },
//           { l: "Delivery fee", v: "₦800" },
//           { l: "Issued",       v: "11 May · 09:24" },
//           { l: "Redeemed",     v: "11 May · 13:04" },
//         ].map((row) => (
//           <div key={row.l} className="rounded-xl border border-[var(--line)] bg-white p-4">
//             <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-[var(--mute)]">{row.l}</p>
//             <p className="text-sm font-semibold text-[var(--ink)]">{row.v}</p>
//           </div>
//         ))}
//       </div>

//       <Link href="/">
//         <Button variant="ghost" fullWidth>← Back to home</Button>
//       </Link>
//     </>
//   );
// }

// function DiscountDetail() {
//   return (
//     <>
//       {/* Header */}
//       <div className="mb-6">
//         <span className="mb-4 inline-flex rounded-full bg-[var(--grey-100)] px-4 py-2 text-sm font-medium text-[var(--ink-soft)]">
//           Cycle #214 · Draw complete
//         </span>
//         <h1
//           className="mb-1 text-3xl leading-tight tracking-tight md:text-4xl"
//           style={{ fontFamily: "var(--font-display)" }}
//         >
//           Your 30%{" "}
//           <em className="italic text-[var(--blue)]">discount.</em>
//         </h1>
//         <p className="text-sm text-[var(--ink-soft)]">
//           Valid at participating vendors · expires Sun 17 May 2026
//         </p>
//       </div>

//       {/* Discount card */}
//       <div
//         className="relative mb-6 overflow-hidden rounded-2xl p-8"
//         style={{ background: "var(--lime)" }}
//       >
//         <div className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-[var(--bg)]" />
//         <div className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-[var(--bg)]" />
//         <div className="absolute left-5 right-5 top-[62%] border-t border-dashed border-[var(--lime-dark)]/40" />

//         <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--lime-ink)]">
//           Your discount
//         </p>
//         <p
//           className="mb-1 font-light leading-none text-[var(--ink)]"
//           style={{ fontFamily: "var(--font-display)", fontSize: "clamp(52px,12vw,80px)", fontWeight: 300 }}
//         >
//           30%<em className="italic"> off</em>
//         </p>
//         <p className="mb-6 font-mono text-base font-semibold tracking-widest text-[var(--ink)]">
//           USE: PR-9X4K-A28T
//         </p>

//         <div className="border-t border-dashed border-[var(--lime-dark)]/40 pt-5">
//           <p className="text-sm font-medium text-[var(--lime-ink)]/80">
//             Valid at Mama Cass · Lekki Phase 1
//           </p>
//           <p className="mt-0.5 text-xs text-[var(--lime-ink)]/60">
//             Present code at checkout or apply in the app.
//           </p>
//         </div>
//       </div>

//       {/* Meta */}
//       <div className="mb-6 grid grid-cols-2 gap-3">
//         {[
//           { l: "Issued",        v: "11 May · 13:02" },
//           { l: "Expires",       v: "Sun 17 May 2026" },
//           { l: "Discount",      v: "30% off" },
//           { l: "Status",        v: "Active" },
//         ].map((row) => (
//           <div key={row.l} className="rounded-xl border border-[var(--line)] bg-white p-4">
//             <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-[var(--mute)]">{row.l}</p>
//             <p className="text-sm font-semibold text-[var(--ink)]">{row.v}</p>
//           </div>
//         ))}
//       </div>

//       <div className="flex flex-col gap-3">
//         <Link href="/vendors">
//           <Button fullWidth>View participating vendors</Button>
//         </Link>
//         <Link href="/">
//           <Button variant="ghost" fullWidth>← Back to home</Button>
//         </Link>
//       </div>
//     </>
//   );
// }


"use client";

import AuthNavbar from "@/components/participant/AuthNavbar";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { useEffect, useState } from "react";
import { participantGet, ParticipantFetchError } from "@/lib/participant-fetch";
import type { VoucherRecord } from "@/lib/types";

function fmtTs(ts: { _seconds: number } | null | undefined): string {
  if (!ts) return "—";
  return new Date(ts._seconds * 1000).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function FreeVoucherCard({ voucher }: { voucher: VoucherRecord }) {
  return (
    <>
      <div className="mb-6">
        <span className="mb-4 inline-flex rounded-full bg-[var(--lime)]/40 px-4 py-2 text-sm font-semibold text-[var(--lime-ink)]">
          🎉 Free meal voucher
        </span>
        <h1
          className="mb-1 text-3xl leading-tight tracking-tight md:text-4xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          You got a{" "}
          <em className="italic text-[var(--blue)]">free meal.</em>
        </h1>
        <p className="text-sm text-[var(--ink-soft)]">
          {fmtTs(voucher.issuedAt as unknown as { _seconds: number })}
        </p>
      </div>

      {/* Voucher card */}
      <div className="relative mb-6 overflow-hidden rounded-2xl bg-[var(--ink)] p-7 text-white">
        <div className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-[var(--bg)]" />
        <div className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-[var(--bg)]" />
        <div className="absolute left-5 right-5 top-[58%] border-t border-dashed border-white/15" />

        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--lime)]">
          Free meal voucher ·{" "}
          {voucher.status === "redeemed" ? "Redeemed" : "Active"}
        </p>
        <p className="mb-1 font-mono text-2xl font-semibold tracking-wider">{voucher.code}</p>
        <p className="mb-6 text-sm text-white/60">
          Issued {fmtTs(voucher.issuedAt as unknown as { _seconds: number })}
        </p>

        <div className="flex items-center justify-between border-t border-dashed border-white/20 pt-5">
          <p className="text-sm text-white/70">Expires</p>
          <p className="font-mono text-sm font-semibold text-white">
            {fmtTs(voucher.expiresAt as unknown as { _seconds: number })}
          </p>
        </div>
      </div>

      {/* Meta grid */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        {[
          { l: "Type",    v: "Free meal"                                         },
          { l: "Status",  v: voucher.status.charAt(0).toUpperCase() + voucher.status.slice(1) },
          { l: "Issued",  v: fmtTs(voucher.issuedAt as unknown as { _seconds: number })       },
          { l: "Expires", v: fmtTs(voucher.expiresAt as unknown as { _seconds: number })      },
        ].map((row) => (
          <div key={row.l} className="rounded-xl border border-[var(--line)] bg-white p-4">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-[var(--mute)]">{row.l}</p>
            <p className="text-sm font-semibold text-[var(--ink)]">{row.v}</p>
          </div>
        ))}
      </div>

      <Link href="/">
        <Button variant="ghost" fullWidth>← Back to home</Button>
      </Link>
    </>
  );
}

function DiscountVoucherCard({ voucher }: { voucher: VoucherRecord }) {
  return (
    <>
      <div className="mb-6">
        <span className="mb-4 inline-flex rounded-full bg-[var(--grey-100)] px-4 py-2 text-sm font-medium text-[var(--ink-soft)]">
          Discount voucher
        </span>
        <h1
          className="mb-1 text-3xl leading-tight tracking-tight md:text-4xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Your{" "}
          <em className="italic text-[var(--blue)]">{voucher.discountPct}% discount.</em>
        </h1>
        <p className="text-sm text-[var(--ink-soft)]">
          Valid at participating vendors until{" "}
          {fmtTs(voucher.expiresAt as unknown as { _seconds: number })}
        </p>
      </div>

      {/* Discount card */}
      <div className="relative mb-6 overflow-hidden rounded-2xl p-8" style={{ background: "var(--lime)" }}>
        <div className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-[var(--bg)]" />
        <div className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-[var(--bg)]" />
        <div className="absolute left-5 right-5 top-[62%] border-t border-dashed border-[var(--lime-d)]/40" />

        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--lime-ink)]">
          Your discount
        </p>
        <p
          className="mb-1 font-light leading-none text-[var(--ink)]"
          style={{ fontFamily: "var(--font-display)", fontSize: "clamp(52px,12vw,80px)", fontWeight: 300 }}
        >
          {voucher.discountPct}%<em className="italic"> off</em>
        </p>
        <p className="mb-6 font-mono text-base font-semibold tracking-widest text-[var(--ink)]">
          USE: {voucher.code}
        </p>
        <div className="border-t border-dashed border-[var(--lime-d)]/40 pt-5">
          <p className="text-sm font-medium text-[var(--lime-ink)]/80">
            Present this code at checkout or apply in the app.
          </p>
        </div>
      </div>

      {/* Meta grid */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        {[
          { l: "Discount", v: `${voucher.discountPct}% off`                          },
          { l: "Status",   v: voucher.status.charAt(0).toUpperCase() + voucher.status.slice(1) },
          { l: "Issued",   v: fmtTs(voucher.issuedAt  as unknown as { _seconds: number })      },
          { l: "Expires",  v: fmtTs(voucher.expiresAt as unknown as { _seconds: number })      },
        ].map((row) => (
          <div key={row.l} className="rounded-xl border border-[var(--line)] bg-white p-4">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-[var(--mute)]">{row.l}</p>
            <p className="text-sm font-semibold text-[var(--ink)]">{row.v}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <Link href="/">
          <Button variant="ghost" fullWidth>← Back to home</Button>
        </Link>
      </div>
    </>
  );
}

export default function VoucherDetailPage() {
  const [voucher, setVoucher] = useState<VoucherRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    participantGet<VoucherRecord[]>("/api/participant/voucher")
      .then((vouchers) => {
        setVoucher(vouchers[0] ?? null);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof ParticipantFetchError ? err.message : "Failed to load voucher.");
        setLoading(false);
      });
  }, []);

  return (
    <>
      <AuthNavbar />
      <main className="min-h-screen px-6 py-12 md:py-16">
        <div className="mx-auto max-w-lg">
          {loading ? (
            <p className="text-sm text-[var(--ink-soft)]">Loading…</p>
          ) : error ? (
            <div>
              <p className="mb-4 text-sm text-[var(--blue)]">{error}</p>
              <Link href="/"><Button variant="ghost">← Back</Button></Link>
            </div>
          ) : !voucher ? (
            <div>
              <p className="mb-4 text-sm text-[var(--ink-soft)]">No voucher found.</p>
              <Link href="/"><Button variant="ghost">← Back</Button></Link>
            </div>
          ) : voucher.type === "free" ? (
            <FreeVoucherCard voucher={voucher} />
          ) : (
            <DiscountVoucherCard voucher={voucher} />
          )}
        </div>
      </main>
    </>
  );
}
