// import Button from "@/components/ui/Button";

// export default function VoucherPage() {
//   return (
//     <main
//       className="
//         flex min-h-screen
//         items-center justify-center
//         px-6 py-10
//       "
//     >
//       <div
//         className="
//           w-full max-w-lg
//           rounded-[40px]
//           border border-[var(--line)]
//           bg-white
//           p-10
//           text-center
//           shadow-xl
//         "
//       >
//         <div
//           className="
//             mx-auto mb-6
//             flex h-20 w-20
//             items-center justify-center
//             rounded-full
//             bg-[var(--lime)]
//             text-3xl
//           "
//         >
//           🎉
//         </div>

//         <h1
//           className="mb-4 text-5xl"
//           style={{
//             fontFamily: "var(--font-display)",
//           }}
//         >
//           You won!
//         </h1>

//         <p
//           className="
//             mb-8
//             text-lg leading-8
//             text-[var(--ink-soft)]
//           "
//         >
//           Congratulations! You’ve been selected
//           as one of today’s lucky winners.
//         </p>

//         <div
//           className="
//             mb-8
//             rounded-[32px]
//             bg-[var(--grey-50)]
//             p-8
//           "
//         >
//           <p className="mb-2 text-sm text-[var(--ink-soft)]">
//             Voucher Amount
//           </p>

//           <h2
//             className="text-6xl"
//             style={{
//               fontFamily: "var(--font-display)",
//             }}
//           >
//             ₦25k
//           </h2>
//         </div>

//         <Button fullWidth>
//           Claim Voucher
//         </Button>
//       </div>
//     </main>
//   );
// }

"use client";

import Navbar from "@/components/participant/Navbar";
import { useEffect, useState } from "react";

function useCountdown(targetSeconds: number) {
  const [remaining, setRemaining] = useState(targetSeconds);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining((r) => (r > 0 ? r - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const h = String(Math.floor(remaining / 3600)).padStart(2, "0");
  const m = String(Math.floor((remaining % 3600) / 60)).padStart(2, "0");
  const s = String(remaining % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

export default function VoucherIssuedPage() {
  const countdown = useCountdown(3 * 3600 + 41 * 60 + 52);

  return (
    <>
      <Navbar />

      <main className="min-h-screen px-6 py-16 md:py-24">
        <div className="mx-auto max-w-lg">

          {/* Header */}
          <div className="mb-10 text-center">
            <span
              className="
                mb-5 inline-flex rounded-full
                bg-[var(--blue-soft)]
                px-4 py-2
                text-sm font-medium text-[var(--blue)]
              "
            >
              08 · Reward
            </span>

            <h1
              className="mb-2 text-4xl leading-tight tracking-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              You&apos;re{" "}
              <em className="italic text-[var(--blue)]">in.</em>
            </h1>

            <p className="text-base text-[var(--ink-soft)]">
              Voucher locked in for today&apos;s draw.
            </p>
          </div>

          {/* Voucher card */}
          <div
            className="
              relative mb-8 overflow-hidden rounded-2xl
              bg-[var(--ink)] p-6 text-white
            "
          >
            {/* Cutout circles */}
            <div
              className="
                absolute -left-3 top-1/2 h-6 w-6
                -translate-y-1/2 rounded-full
                bg-[var(--bg)]
              "
            />
            <div
              className="
                absolute -right-3 top-1/2 h-6 w-6
                -translate-y-1/2 rounded-full
                bg-[var(--bg)]
              "
            />

            {/* Dashed divider (visual) */}
            <div
              className="absolute left-4 right-4 top-1/2 border-t border-dashed border-white/10"
              aria-hidden
            />

            {/* Top half */}
            <div className="mb-5">
              <p
                className="
                  mb-3 text-xs font-semibold uppercase
                  tracking-widest text-[var(--lime)]
                "
              >
                Raffle voucher
              </p>
              <p
                className="
                  mb-1 font-mono text-3xl font-semibold
                  tracking-wider
                "
              >
                PR-9X4K-A28T
              </p>
              <p className="text-sm text-white/60">
                Cycle #214 · 11 May 2026
              </p>
            </div>

            {/* Bottom half — countdown */}
            <div
              className="
                mt-5 flex items-center justify-between
                border-t border-dashed border-white/20 pt-5
              "
            >
              <p className="text-sm text-white/70">Draw begins in</p>
              <span
                className="font-mono text-2xl font-semibold text-[var(--lime)]"
              >
                {countdown}
              </span>
            </div>
          </div>

          {/* Info note */}
          <div
            className="
              rounded-2xl border border-[var(--line)]
              bg-white p-5
            "
          >
            <p className="text-sm leading-relaxed text-[var(--ink-soft)]">
              You&apos;ll be notified the moment the draw runs. If you win,
              you&apos;ll have{" "}
              <strong className="text-[var(--ink)]">2 hours</strong> to claim
              your meal — via delivery or dine-in.
            </p>
          </div>

          {/* Voucher lifecycle states hint */}
          <div className="mt-6 flex flex-wrap gap-2">
            {["Issued", "Eligible", "Draw running…", "Result"].map(
              (label, i) => (
                <span
                  key={label}
                  className="
                    rounded-full px-3 py-1 text-xs font-medium
                  "
                  style={{
                    background:
                      i === 1
                        ? "var(--blue)"
                        : "var(--grey-100)",
                    color:
                      i === 1
                        ? "#fff"
                        : "var(--ink-soft)",
                  }}
                >
                  {label}
                </span>
              )
            )}
          </div>

        </div>
      </main>
    </>
  );
}
