import Navbar from "@/components/participant/Navbar";
import Button from "@/components/ui/Button";
import Link from "next/link";

const steps = [
  {
    n: 1,
    title: "Create your account",
    desc: "Phone number, name, basic details.",
  },
  {
    n: 2,
    title: "Link your socials",
    desc: "Instagram, X. We verify automatically.",
  },
  {
    n: 3,
    title: "Complete daily tasks",
    desc: "Follow, share, tag. One-time only.",
  },
  {
    n: 4,
    title: "Claim your voucher",
    desc: "Issued instantly, expires in 24 hrs.",
  },
  {
    n: 5,
    title: "Win or save",
    desc: "Winners eat free. Others get a discount.",
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen px-6 py-16 md:py-24">
        <div className="mx-auto max-w-2xl">

          {/* Header */}
          <div className="mb-12">
            <span
              className="
                mb-5 inline-flex rounded-full
                bg-[var(--blue-soft)]
                px-4 py-2
                text-sm font-medium text-[var(--blue)]
              "
            >
              02 · Information
            </span>

            <h1
              className="mb-4 text-4xl leading-tight tracking-tight md:text-5xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Five steps to a{" "}
              <em className="italic text-[var(--blue)]">free delivery.</em>
            </h1>

            <p className="text-lg leading-relaxed text-[var(--ink-soft)]">
              The whole flow takes about three minutes.
              Complete it once — then show up daily to enter.
            </p>
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

            {steps.map((step, i) => (
              <li key={step.n} className="relative flex gap-5 pb-8 last:pb-0">
                {/* Step number bubble */}
                <div
                  className="
                    relative z-10 flex h-10 w-10 shrink-0
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
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/signup">
              <Button fullWidth>Get started</Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost" fullWidth>
                I already have an account
              </Button>
            </Link>
          </div>

        </div>
      </main>
    </>
  );
}
