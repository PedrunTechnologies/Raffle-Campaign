import AuthNavbar from "@/components/participant/AuthNavbar";
import Link from "next/link";
import Button from "@/components/ui/Button";

/* ── Steps ────────────────────────────────────────────────────────────── */
const STEPS = [
  {
    n:     1,
    emoji: "👤",
    title: "Create your account",
    body:  "Visit the website and sign up for a free account. Once registered you get instant access to your personal dashboard.",
    cta:   null,
  },
  {
    n:     2,
    emoji: "📱",
    title: "Complete your social media tasks",
    body:  "Head to your Tasks page and complete all assigned social media tasks — following accounts, liking posts, reposting content, dropping comments. All tasks must be completed before the cycle ends to qualify.",
    cta:   null,
  },
  {
    n:     3,
    emoji: "🎟️",
    title: "Receive your raffle voucher",
    body:  "Vouchers are assigned at the end of each cycle. Complete all your tasks and you'll automatically be entered — your raffle voucher is issued once the cycle closes.",
    cta:   null,
  },
  {
    n:     4,
    emoji: "🏆",
    title: "Claim your reward",
    body:  "When winners are selected you'll have 24 hours to claim and redeem your voucher. After that window closes unclaimed vouchers expire — keep an eye on your notifications.",
    cta:   null,
  },
];

/* ── FAQ ──────────────────────────────────────────────────────────────── */
const FAQ = [
  {
    q: "When does a cycle start and end?",
    a: "Cycles run weekly. Each cycle has an open window during which you can complete tasks and qualify. The draw happens automatically when the window closes.",
  },
  {
    q: "Do I need to complete every task to qualify?",
    a: "You need to complete the minimum number of tasks shown on your dashboard. Completing more tasks doesn't change whether you qualify, but it improves your chances of getting a better voucher. Check daily as more tasks will be added.",
  },
  {
    q: "What's the difference between a free voucher and a discount voucher?",
    a: "Free vouchers cover your entire meal at the participating vendor. Discount vouchers give you a percentage off — the exact amount depends on that cycle's vendor opt-ins. Every qualifying participant is guaranteed at least a discount voucher if prizes are available.",
  },
  {
    q: "What happens if I miss a cycle?",
    a: "Nothing — each cycle is independent. You can jump back in on the next one. There's no penalty for missing a cycle.",
  },
  {
    q: "How will I know when the draw result is out?",
    a: "You'll receive a push notification the moment the draw completes. Make sure you've allowed notifications in your browser or device settings.",
  },
  {
    q: "Can I use my voucher at any restaurant?",
    a: "Vouchers are vendor-specific — your voucher details will show exactly which vendor it's valid at, along with their address and operating hours.",
  },
  {
    q: "What if my voucher expires before I redeem it?",
    a: "Expired vouchers cannot be reinstated. Vouchers are valid for 24 hours after the draw closes, so act quickly once you receive your notification.",
  },
];

/* ── FAQ item (client accordion) ─────────────────────────────────────── */
// Using a plain <details> element — no JS needed, accessible, no client boundary
function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group border-b border-[var(--line)] last:border-0">
      <summary
        className="
          flex cursor-pointer select-none items-center justify-between
          gap-4 py-5 text-sm font-semibold text-[var(--ink)]
          marker:content-none
        "
      >
        {q}
        {/* Chevron rotates on open */}
        <span
          className="
            flex h-7 w-7 shrink-0 items-center justify-center
            rounded-full bg-[var(--grey-50)] text-[var(--ink-soft)]
            transition-transform duration-200
            group-open:rotate-180
          "
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2.5 5l4.5 4.5L11.5 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </summary>
      <p className="pb-5 text-sm leading-relaxed text-[var(--ink-soft)]">{a}</p>
    </details>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────── */
export default function HowItWorksPage() {
  return (
    <>
      <AuthNavbar />

      <main className="min-h-screen px-6 py-16 md:py-24">
        <div className="mx-auto max-w-2xl">

          {/* ── Header ── */}
          <div className="mb-14">
            <span className="mb-5 inline-flex rounded-full bg-[var(--blue-soft)] px-4 py-2 text-sm font-medium text-[var(--blue)]">
              How it works
            </span>
            <h1
              className="mb-4 text-4xl leading-tight tracking-tight md:text-5xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Four steps.{" "}
              <em className="italic text-[var(--blue)]">Zero complications.</em>
            </h1>
            <p className="text-lg leading-relaxed text-[var(--ink-soft)]">
              No complicated process — just show up, complete your tasks, and earn your shot at winning.
            </p>
          </div>

          {/* ── Steps ── */}
          <ol className="relative mb-16 flex flex-col gap-0">
            {/* Vertical connector */}
            <div
              className="absolute left-[19px] top-10 -bottom-0 w-px bg-[var(--line)]"
              aria-hidden
            />

            {STEPS.map((step) => (
              <li key={step.n} className="relative flex gap-5 pb-10 last:pb-0">
                {/* Bubble */}
                <div
                  className="
                    relative z-10 flex h-10 w-10 shrink-0
                    items-center justify-center
                    rounded-full bg-[var(--blue)]
                    text-sm font-bold text-white shadow-sm
                  "
                >
                  {step.n}
                </div>

                {/* Content */}
                <div className="flex-1 pt-1.5">
                  <div className="mb-1 flex items-center gap-2">
                    {/* <span className="text-base">{step.emoji}</span> */}
                    <h2 className="text-base font-semibold text-[var(--ink)]">
                      {step.title}
                    </h2>
                  </div>
                  <p className="mb-3 text-sm leading-relaxed text-[var(--ink-soft)]">
                    {step.body}
                  </p>
                  {/* {step.cta && (
                    <Link
                      href={step.cta.href}
                      className="text-xs font-semibold text-[var(--blue)] hover:underline"
                    >
                      {step.cta.label}
                    </Link>
                  )} */}
                </div>
              </li>
            ))}
          </ol>

          {/* ── Invite friends banner ── */}
          <div
            className="relative mb-16 overflow-hidden rounded-2xl p-7"
            style={{ background: "var(--lime)" }}
          >
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/20" />
            <div className="absolute -bottom-4 right-12 h-16 w-16 rounded-full bg-white/15" />
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-[var(--lime-ink)]/70">
              Spread the word
            </p>
            <h2
              className="mb-2 text-2xl font-medium leading-snug text-[var(--lime-ink)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Invite friends,{" "}
              <em className="italic">grow the circle.</em>
            </h2>
            <p className="mb-5 text-sm leading-relaxed text-[var(--lime-ink)]/80">
              Love what we're doing? Invite your friends to sign up and join the raffle.
              Every new member makes the community stronger — and every cycle is a fresh
              chance to win.
            </p>
            {/* <Link href="/profile">
              <button className="
                rounded-xl bg-[var(--lime-ink)] px-5 py-2.5
                text-sm font-semibold text-white
                transition-all hover:opacity-90 active:scale-[.98]
              ">
                Invite a friend →
              </button>
            </Link> */}
          </div>

          {/* ── FAQ ── */}
          <div className="mb-16">
            <div className="mb-8">
              <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-[var(--mute)]">
                FAQ
              </p>
              <h2
                className="text-2xl font-medium tracking-tight text-[var(--ink)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Common questions
              </h2>
            </div>

            <div className="rounded-2xl border border-[var(--line)] bg-white px-6">
              {FAQ.map((item) => (
                <FaqItem key={item.q} q={item.q} a={item.a} />
              ))}
            </div>
          </div>

          {/* ── Bottom CTA ── */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/dashboard">
              <Button fullWidth>Back to dashboard →</Button>
            </Link>
            {/* <Link href="/">
              <Button variant="ghost" fullWidth>Back to dashboard</Button>
            </Link> */}
          </div>

        </div>
      </main>
    </>
  );
}