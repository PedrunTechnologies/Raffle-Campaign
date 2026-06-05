"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DiscountVoucherCard, RaffleVoucherCard } from "@/components/participant/VoucherCard";
import AuthNavbar from "@/components/participant/AuthNavbar";
import Button from "@/components/ui/Button";
import { PageLoader } from "@/components/ui/Loader";
import { participantGet, ParticipantFetchError } from "@/lib/participant-fetch";
import type { VoucherRecord, VendorRecord } from "@/lib/types";



/* Vendor subset stitched on by the API */
type VoucherWithVendor = VoucherRecord & {
  vendor: Pick<VendorRecord, "name" | "address" | "operatingHours" | "dineIn" | "phone" | "cuisine"> | null;
};

function fmtTs(ts: { _seconds: number } | null | undefined): string {
  if (!ts) return "—";
  return new Date(ts._seconds * 1000).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

/* ── Vendor info block ─────────────────────────────────────────────── */
function VendorInfo({ vendor }: { vendor: VoucherWithVendor["vendor"] }) {
  if (!vendor) return null;
  return (
    <div className="mb-6 rounded-2xl border border-[var(--line)] bg-white p-5">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-[var(--mute)]">
        Vendor
      </p>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--grey-50)] text-xl">
          🍽️
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[var(--ink)]">{vendor.name}</p>
          {vendor.cuisine && (
            <p className="text-xs text-[var(--ink-soft)]">{vendor.cuisine}</p>
          )}
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {vendor.address && (
          <div className="flex items-start gap-2.5 text-sm text-[var(--ink-soft)]">
            <span className="mt-0.5 shrink-0">📍</span>
            <span>{vendor.address}</span>
          </div>
        )}
        {vendor.operatingHours && (
          <div className="flex items-start gap-2.5 text-sm text-[var(--ink-soft)]">
            <span className="mt-0.5 shrink-0">🕐</span>
            <span>{vendor.operatingHours}</span>
          </div>
        )}
        {vendor.phone && (
          <div className="flex items-start gap-2.5 text-sm text-[var(--ink-soft)]">
            <span className="mt-0.5 shrink-0">📞</span>
            <a href={`tel:${vendor.phone}`} className="text-[var(--blue)] hover:underline">
              {vendor.phone}
            </a>
          </div>
        )}
        {vendor.dineIn && (
          <div className="flex items-center gap-2.5 text-sm text-[var(--ink-soft)]">
            <span className="shrink-0">🪑</span>
            <span>Dine-in {vendor.dineIn === "yes" ? "available" : "not available"}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Free voucher ──────────────────────────────────────────────────── */
function FreeVoucherCard({ voucher }: { voucher: VoucherWithVendor }) {
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
      <div className="mb-4">
        <RaffleVoucherCard voucher={voucher} />
      </div>

      {/* Vendor details */}
      <VendorInfo vendor={voucher.vendor} />

      {/* Meta grid */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        {[
          { l: "Type", v: "Free meal" },
          { l: "Status", v: voucher.status.charAt(0).toUpperCase() + voucher.status.slice(1) },
          { l: "Issued", v: fmtTs(voucher.issuedAt as unknown as { _seconds: number }) },
          { l: "Expires", v: fmtTs(voucher.expiresAt as unknown as { _seconds: number }) },
        ].map((row) => (
          <div key={row.l} className="rounded-xl border border-[var(--line)] bg-white p-4">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-[var(--mute)]">{row.l}</p>
            <p className="text-sm font-semibold text-[var(--ink)]">{row.v}</p>
          </div>
        ))}
      </div>

      <Link href="/dashboard">
        <Button variant="ghost" fullWidth>← Back to home</Button>
      </Link>
    </>
  );
}

/* ── Discount voucher ──────────────────────────────────────────────── */
function DiscountVoucherView({ voucher }: { voucher: VoucherWithVendor }) {
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
          {voucher.vendor
            ? `Valid at ${voucher.vendor.name}`
            : "Valid at participating vendors"
          }{" "}
          · expires {fmtTs(voucher.expiresAt as unknown as { _seconds: number })}
        </p>
      </div>

      {/* Discount card */}
      <div className="mb-4">
        <DiscountVoucherCard voucher={voucher} />
      </div>

      {/* Vendor details */}
      <VendorInfo vendor={voucher.vendor} />

      {/* Meta grid */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        {[
          { l: "Discount", v: `${voucher.discountPct}% off` },
          { l: "Status", v: voucher.status.charAt(0).toUpperCase() + voucher.status.slice(1) },
          { l: "Issued", v: fmtTs(voucher.issuedAt as unknown as { _seconds: number }) },
          { l: "Expires", v: fmtTs(voucher.expiresAt as unknown as { _seconds: number }) },
        ].map((row) => (
          <div key={row.l} className="rounded-xl border border-[var(--line)] bg-white p-4">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-[var(--mute)]">{row.l}</p>
            <p className="text-sm font-semibold text-[var(--ink)]">{row.v}</p>
          </div>
        ))}
      </div>

      <Link href="/dashboard">
        <Button variant="ghost" fullWidth>← Back to home</Button>
      </Link>
    </>
  );
}


/* ── Page ──────────────────────────────────────────────────────────── */
function VoucherDetailControl() {
  const sp = useSearchParams();
  const qid = sp.get("code"); // optional ?code= from vouchers list

  const [voucher, setVoucher] = useState<VoucherWithVendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    participantGet<VoucherWithVendor[]>("/api/participant/voucher")
      .then((vouchers) => {
        if (qid) {
          const current = vouchers.find((c) => c.code === qid);
          setVoucher(current ?? vouchers[0] ?? null);
        } else {
          setVoucher(vouchers[0] ?? null);
        }

        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof ParticipantFetchError ? err.message : "Failed to load voucher.");
        setLoading(false);
      });
  }, [qid]);

  return (
    <>
      <AuthNavbar />
      <main className="min-h-screen px-6 py-12 md:py-16">
        <div className="mx-auto max-w-lg">
          {loading ? (
            <PageLoader fullPage={false} />
          ) : error ? (
            <div>
              <p className="mb-4 text-sm text-[var(--blue)]">{error}</p>
              <Link href="/dashboard"><Button variant="ghost">← Back</Button></Link>
            </div>
          ) : !voucher ? (
            <div>
              <p className="mb-4 text-sm text-[var(--ink-soft)]">No voucher found.</p>
              <Link href="/dashboard"><Button variant="ghost">← Back</Button></Link>
            </div>
          ) : voucher.type === "free" ? (
            <>
              <FreeVoucherCard voucher={voucher} />
              <div className="mt-6 rounded-2xl border border-[var(--line)] bg-[var(--grey-50)] px-5 py-4">
                <p className="mb-1 text-sm font-semibold text-[var(--ink)]">
                  Need help?
                </p>
                <p className="mb-3 text-xs leading-relaxed text-[var(--ink-soft)]">
                  Having trouble completing a task or redeeming a voucher? Reach out to
                  our customer support and we&apos;ll sort it out for you. You can take
                  a screenshot of this page to share with us for faster assistance.
                </p>
                <a
                  href="tel:+2347049906561"
                  className="inline-flex items-center gap-2 rounded-xl bg-white border border-[var(--line)] px-4 py-2.5 text-sm font-semibold text-[var(--ink)] transition-all hover:border-[var(--grey-200)] hover:shadow-sm active:scale-95"
                >
                  <span className="text-base">📞</span>
                  +234 704 990 6561
                </a>
              </div>
            </>
            // <RaffleVoucherCard voucher={voucher} compact />
          ) : (
            <>
              <DiscountVoucherView voucher={voucher} />
              <div className="mt-6 rounded-2xl border border-[var(--line)] bg-[var(--grey-50)] px-5 py-4">
                <p className="mb-1 text-sm font-semibold text-[var(--ink)]">
                  Need help?
                </p>
                <p className="mb-3 text-xs leading-relaxed text-[var(--ink-soft)]">
                  Having trouble completing a task or redeeming a voucher? Reach out to
                  our customer support and we&apos;ll sort it out for you. You can take
                  a screenshot of this page to share with us for faster assistance.
                </p>
                <a
                  href="tel:+2347049906561"
                  className="inline-flex items-center gap-2 rounded-xl bg-white border border-[var(--line)] px-4 py-2.5 text-sm font-semibold text-[var(--ink)] transition-all hover:border-[var(--grey-200)] hover:shadow-sm active:scale-95"
                >
                  <span className="text-base">📞</span>
                  +234 704 990 6561
                </a>
              </div>
            </>
            // <DiscountVoucherCard voucher={voucher} />
          )}
        </div>
      </main>
    </>
  );
}


export default function VoucherDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-sm text-[var(--ink-soft)]">
            Loading cycle data…
          </p>
        </div>
      }
    >
      <VoucherDetailControl />
    </Suspense>
  );
}

