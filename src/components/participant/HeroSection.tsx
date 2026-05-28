
import Button from "../ui/Button";
import Link from "next/link";

const HOW_STEPS = [
  { n: 1, title: "Create your account",   desc: "Phone number, name, basic details." },
  { n: 2, title: "Link your socials",      desc: "Instagram, Facebook, X — verified automatically." },
  { n: 3, title: "Complete daily tasks",   desc: "Follow, share, tag. One-time per cycle." },
  { n: 4, title: "Claim your voucher",     desc: "Issued instantly, valid 24hrs after draw." },
  { n: 5, title: "Win or save",            desc: "Winners eat free. Everyone else gets a discount." },
];

export default function HeroSection() {
  return (
    <section className="px-6 py-24">
      <div
        className="
          mx-auto grid max-w-7xl
          gap-16
          lg:grid-cols-2 lg:items-start
        "
      >
        {/* ── Left: hero copy ── */}
        <div className="lg:pt-16">
          <span
            className="
              mb-6 inline-flex
              rounded-full
              bg-[var(--blue-soft)]
              px-4 py-2
              text-sm font-medium
              text-[var(--blue)]
            "
          >
            Daily Raffle Campaign
          </span>

          <h1
            className="
              mb-6
              max-w-3xl
              text-5xl leading-tight tracking-tight
              md:text-7xl
            "
            style={{ fontFamily: "var(--font-display)" }}
          >
            Win dinner today.
            <span className="italic text-[var(--blue)]">
              {" "}We&apos;ll deliver.
            </span>
          </h1>

          <p
            className="
              mb-8
              max-w-xl
              text-lg leading-8
              text-[var(--ink-soft)]
            "
          >
            Follow, share, win.
            A free meal delivered directly
            to your door every single day.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
          </div>
        </div>

        {/* ── Right: How it works card ── */}
        <div>
          <div
            className="
              rounded-[32px]
              border border-[var(--line)]
              bg-white
              p-8 md:p-10
              shadow-xl
            "
          >
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3
                  className="text-xl font-medium"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  How it works
                </h3>
                <p className="mt-1 text-sm text-[var(--ink-soft)]">
                  Five steps, three minutes.
                </p>
              </div>
            </div>

             {/* Steps */}
          <ol className="relative mb-12 flex flex-col gap-0">
            {/* Vertical connector line */}
            <div
              className="
                absolute left-[19px] top-10 -bottom-0
                w-px bg-[var(--line)]
              "
              aria-hidden
            />

            {HOW_STEPS.map((step, i) => (
              <li key={step.n} className="relative flex gap-5 pb-8 last:pb-0">
                {/* Step number bubble */}
                <div
                  className="
                    relative z-10 flex h-10 w-10 shrink-0 mt-2
                    items-center justify-center
                    rounded-full bg-[var(--blue)]
                    text-sm font-bold text-white
                    shadow-sm
                  "
                >
                  {step.n}
                </div>

                {/* Content */}
                <div className="pt-1.5">
                  <h3 className="mb-1 text-base font-semibold text-[var(--ink)]">
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-[var(--ink-soft)]">
                    {step.desc}
                  </p>
                </div>
              </li>
            ))}
          </ol>

            {/* CTA */}
            <div className="mt-7 border-t border-[var(--line)] pt-6">
              <Link href="/signup">
                <Button fullWidth>Start today →</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
