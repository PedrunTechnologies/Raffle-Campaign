import Navbar from "@/components/participant/Navbar";
import Button from "@/components/ui/Button";
import Link from "next/link";

export default function DiscountPage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen px-6 py-16 md:py-24">
        <div className="mx-auto max-w-lg">

          {/* Header */}
          <div className="mb-10">
            <span className="mb-5 inline-flex rounded-full bg-[var(--grey-100)] px-4 py-2 text-sm font-medium text-[var(--ink-soft)]">
              Cycle #214 · Draw complete
            </span>

            <h1
              className="mb-3 text-4xl leading-tight tracking-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Not this time —
              <br />
              <em className="italic text-[var(--blue)]">but</em> here&apos;s
              something.
            </h1>

            <p className="text-base leading-relaxed text-[var(--ink-soft)]">
              Today&apos;s winner has been picked. Use your voucher as a
              discount instead — valid at participating vendors this week.
            </p>
          </div>

          {/* Discount card */}
          <div
            className="
              relative mb-8 overflow-hidden rounded-2xl
              bg-[var(--lime)] p-7
            "
          >
            {/* Cutout circles */}
            <div
              className="
                absolute -left-3 top-1/2 h-6 w-6
                -translate-y-1/2 rounded-full bg-[var(--bg)]
              "
            />
            <div
              className="
                absolute -right-3 top-1/2 h-6 w-6
                -translate-y-1/2 rounded-full bg-[var(--bg)]
              "
            />

            {/* Dashed divider */}
            <div
              className="
                absolute left-4 right-4
                border-t border-dashed border-[var(--lime-d)]/50
              "
              style={{ top: "72%" }}
              aria-hidden
            />

            {/* Content */}
            <p
              className="
                mb-2 text-xs font-semibold uppercase
                tracking-widest text-[var(--lime-ink)]
              "
            >
              Your discount
            </p>

            <p
              className="mb-1 leading-none text-[var(--ink)]"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(56px, 12vw, 80px)",
                fontWeight: 300,
                letterSpacing: "-0.03em",
              }}
            >
              30%
              <em className="italic" style={{ fontWeight: 300 }}>
                {" "}
                off
              </em>
            </p>

            <p className="mb-6 font-mono text-base font-semibold tracking-wider text-[var(--ink)]">
              USE: PR-9X4K-A28T
            </p>

            <p className="text-sm font-medium text-[var(--lime-ink)]/70">
              Valid at Mama Cass · until Sun 17 May
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-col gap-3">
            <Link href="/vendors">
              <Button fullWidth>View participating vendors</Button>
            </Link>

            <Button variant="ghost" fullWidth>
              Share &amp; come back tomorrow
            </Button>
          </div>

          {/* Footer note */}
          <p className="mt-6 text-center text-xs text-[var(--mute)]">
            Every participant leaves with something. Good luck tomorrow.
          </p>

        </div>
      </main>
    </>
  );
}
