// "use client";

// import Navbar from "@/components/participant/Navbar";
// import Button from "@/components/ui/Button";
// import { useState } from "react";

// type FulfillOption = "delivery" | "dine-in";

// const FULFILLMENT: {
//   id: FulfillOption;
//   emoji: string;
//   title: string;
//   desc: string;
//   price: string;
// }[] = [
//   {
//     id: "delivery",
//     emoji: "🛵",
//     title: "Deliver via Pedrun",
//     desc: "25–35 min · to saved address",
//     price: "₦800",
//   },
//   {
//     id: "dine-in",
//     emoji: "🍽️",
//     title: "Dine in at vendor",
//     desc: "Until 9:00 PM today",
//     price: "Free",
//   },
// ];

// export default function YouWonPage() {
//   const [selected, setSelected] = useState<FulfillOption>("delivery");
//   const [confirmed, setConfirmed] = useState(false);

//   const choice = FULFILLMENT.find((f) => f.id === selected)!;

//   if (confirmed) {
//     return (
//       <>
//         <Navbar />
//         <main className="flex min-h-screen items-center px-6 py-16">
//           <div className="mx-auto max-w-md text-center">
//             <div className="mb-6 text-6xl">🎉</div>
//             <h1
//               className="mb-3 text-4xl leading-tight tracking-tight"
//               style={{ fontFamily: "var(--font-display)" }}
//             >
//               Order confirmed.
//             </h1>
//             <p className="text-base text-[var(--ink-soft)]">
//               Your meal is on its way. Track it in the Pedrun app.
//             </p>
//           </div>
//         </main>
//       </>
//     );
//   }

//   return (
//     <>
//       <Navbar />

//       <main className="min-h-screen px-6 py-16 md:py-24">
//         <div className="mx-auto max-w-lg">

//           {/* Winner headline */}
//           <div className="mb-8">
//             <span
//               className="
//                 mb-5 inline-flex rounded-full
//                 bg-[var(--lime)]/40
//                 px-4 py-2
//                 text-sm font-semibold text-[var(--lime-ink)]
//               "
//             >
//               10 · Result
//             </span>

//             <h1
//               className="mb-2 text-5xl leading-tight tracking-tight"
//               style={{ fontFamily: "var(--font-display)" }}
//             >
//               You{" "}
//               <em className="italic text-[var(--blue)]">won</em>{" "}
//               today&apos;s draw.
//             </h1>

//             <p className="text-sm text-[var(--ink-soft)]">
//               Voucher PR-9X4K-A28T · Cycle #214
//             </p>
//           </div>

//           {/* Meal card */}
//           <div
//             className="
//               mb-8 flex items-center gap-4
//               rounded-2xl border border-[var(--line)]
//               bg-white p-5
//             "
//           >
//             {/* Meal thumbnail placeholder */}
//             <div
//               className="
//                 relative flex h-16 w-16 shrink-0 items-center
//                 justify-center rounded-xl text-3xl
//               "
//               style={{
//                 background:
//                   "radial-gradient(at 25% 25%, var(--lime), transparent 55%), radial-gradient(at 80% 75%, var(--blue), transparent 60%), #1A1F35",
//               }}
//             >
//               🛵
//             </div>

//             <div>
//               <p className="font-semibold text-[var(--ink)]">
//                 Jollof &amp; grilled chicken
//               </p>
//               <p className="text-sm text-[var(--ink-soft)]">
//                 Mama Cass · 4.7 ★ · 1.2 km
//               </p>
//             </div>
//           </div>

//           {/* Fulfilment options */}
//           <p className="mb-3 text-sm text-[var(--ink-soft)]">
//             How would you like it?
//           </p>

//           <div className="mb-6 flex flex-col gap-2.5">
//             {FULFILLMENT.map((opt) => {
//               const active = selected === opt.id;
//               return (
//                 <button
//                   key={opt.id}
//                   onClick={() => setSelected(opt.id)}
//                   className="
//                     flex w-full items-center gap-4
//                     rounded-2xl border-[1.5px] px-5 py-4
//                     text-left transition-all
//                   "
//                   style={{
//                     borderColor: active ? "var(--ink)" : "var(--line)",
//                     background: active ? "var(--ink)" : "white",
//                     color: active ? "var(--bg)" : "var(--ink)",
//                   }}
//                 >
//                   {/* Icon */}
//                   <div
//                     className="
//                       flex h-10 w-10 shrink-0 items-center
//                       justify-center rounded-xl text-xl
//                     "
//                     style={{
//                       background: active
//                         ? "rgba(217,242,60,0.15)"
//                         : "var(--grey-50)",
//                     }}
//                   >
//                     {opt.emoji}
//                   </div>

//                   {/* Labels */}
//                   <div className="flex-1 min-w-0">
//                     <p className="text-sm font-semibold">{opt.title}</p>
//                     <p
//                       className="text-xs"
//                       style={{
//                         color: active
//                           ? "rgba(255,255,255,0.65)"
//                           : "var(--ink-soft)",
//                       }}
//                     >
//                       {opt.desc}
//                     </p>
//                   </div>

//                   {/* Price */}
//                   <span
//                     className="font-mono text-sm font-semibold"
//                     style={{
//                       color: active ? "var(--lime)" : "var(--ink)",
//                     }}
//                   >
//                     {opt.price}
//                   </span>
//                 </button>
//               );
//             })}
//           </div>

//           {/* Confirm CTA */}
//           <Button fullWidth onClick={() => setConfirmed(true)}>
//             Confirm —{" "}
//             {selected === "delivery"
//               ? `deliver for ${choice.price}`
//               : "dine in for free"}
//           </Button>

//           <p className="mt-3 text-center text-xs text-[var(--mute)]">
//             You have 2 hours to claim. Delivery fee is locked at confirmation.
//           </p>

//         </div>
//       </main>
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

export default function ResultWonPage() {
  const [voucher,   setVoucher]   = useState<VoucherRecord | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    participantGet<VoucherRecord[]>("/api/participant/voucher")
      .then((list) => {
        const free = list.find((v) => v.type === "free");
        setVoucher(free ?? list[0] ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

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

  if (confirmed) {
    return (
      <>
        <AuthNavbar />
        <main className="flex min-h-screen items-center px-6 py-16">
          <div className="mx-auto max-w-md text-center">
            <div className="mb-6 text-6xl">🎉</div>
            <h1
              className="mb-3 text-4xl leading-tight tracking-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Voucher confirmed.
            </h1>
            <p className="mb-6 text-base text-[var(--ink-soft)]">
              Show your voucher code{" "}
              <span className="font-mono font-semibold text-[var(--ink)]">
                {voucher?.code}
              </span>{" "}
              to the vendor to redeem your meal.
            </p>
            <Link href="/voucher-detail">
              <Button variant="ghost">View voucher details</Button>
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <AuthNavbar />

      <main className="min-h-screen px-6 py-16 md:py-24">
        <div className="mx-auto max-w-lg">

          <div className="mb-8">
            <span className="mb-4 inline-flex rounded-full bg-[var(--lime)]/40 px-4 py-2 text-sm font-semibold text-[var(--lime-ink)]">
              🎉 You got a free meal!
            </span>
            <h1
              className="mb-2 text-4xl leading-tight tracking-tight md:text-5xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Your meal is{" "}
              <em className="italic text-[var(--blue)]">100% free.</em>
            </h1>
            {voucher && (
              <p className="text-sm text-[var(--ink-soft)]">
                Voucher {voucher.code}
              </p>
            )}
          </div>

          {/* Voucher display */}
          {voucher && (
            <div className="relative mb-8 overflow-hidden rounded-2xl bg-[var(--ink)] p-6 text-white">
              <div className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-[var(--bg)]" />
              <div className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-[var(--bg)]" />
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--lime)]">
                Free meal voucher
              </p>
              <p className="mb-1 font-mono text-2xl font-semibold tracking-wider">
                {voucher.code}
              </p>
              <p className="text-sm text-white/60">
                Show this to the vendor to redeem your free meal.
              </p>
            </div>
          )}

          <Button fullWidth onClick={() => setConfirmed(true)}>
            I&apos;ve noted my voucher code →
          </Button>

          <p className="mt-3 text-center text-xs text-[var(--mute)]">
            Your code is also saved in your profile and voucher details page.
          </p>

        </div>
      </main>
    </>
  );
}
