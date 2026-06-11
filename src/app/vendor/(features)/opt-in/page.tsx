"use client";

import Button from "@/components/ui/Button";
import SelectField from "@/components/ui/SelectField";
import { Panel, FormField, PageHeader, Meter } from "@/components/vendor/VendorUI";

import { useEffect, useState, useCallback } from "react";
import { vendorGet, vendorPost, VendorFetchError } from "@/lib/vendor-fetch";
import { HiOutlinePlus, HiOutlineTrash } from "react-icons/hi";
import type { DiscountTier } from "@/lib/types";


interface OptInStatus {
  active: boolean;
  cycleId?: string;
  cycleNumber?: number;
  optedIn: boolean;
  estimatedPool: number,
  totalPool: number,
  vendorCount: number,
  optIn?: { freeVouchers: number; discountTiers: DiscountTier[] };
}

function uid() { return Math.random().toString(36).slice(2, 8); }

interface TierState extends DiscountTier { _id: string; }

const DINE_OPTIONS = [
  { value: "yes", label: "Yes — dine-in available" },
  { value: "no", label: "No — takeaway / delivery only" },
];

const DISCOUNT_OPTIONS = ["10", "15", "20", "25", "30", "40", "50"].map((v) => ({
  value: v, label: `${v}% off`,
}));

const TIME_OPTIONS = Array.from({ length: 16 }, (_, i) => {
  const h = i + 8;
  const label = `${String(h).padStart(2, "0")}:00`;
  return { value: label, label };
});

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-[var(--mute)]">
      {children}
    </p>
  );
}

function AmountInput({ value, onChange, placeholder = "e.g. 5000" }: {
  value: number;
  onChange: (n: number) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-2xl border border-[var(--line)] bg-white px-4 py-3.5">
      <span className="text-sm font-medium text-[var(--mute)]">₦</span>
      <input
        type="number"
        min={0}
        value={value || ""}
        placeholder={placeholder}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value)))}
        className="w-full bg-transparent text-sm font-semibold text-[var(--ink)] outline-none placeholder:font-normal placeholder:text-[var(--mute)]"
      />
    </div>
  );
}

function Stepper({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-[var(--line)] bg-white px-4 py-3.5">
      <button type="button" onClick={() => onChange(Math.max(1, value - 1))}
        className="flex h-7 w-7 items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--grey-50)] text-sm font-bold transition-colors hover:bg-[var(--grey-100)]"
      >
        −
      </button>
      <span className="flex-1 text-center text-sm font-semibold text-[var(--ink)]">
        {value}
      </span>
      <button type="button" onClick={() => onChange(value + 1)}
        className="flex h-7 w-7 items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--grey-50)] text-sm font-bold transition-colors hover:bg-[var(--grey-100)]"
      >
        +
      </button>
    </div>
  );
}

/* ── types ─────────────────────────────────────────────────────────────── */
interface FreeVoucher {
  quantity: number;
  maxMealAmount: number;
  dineInAvailable: "yes" | "no";
  dineInUntil: string; // "21:00"
}



export default function OptInPage() {
  const [status, setStatus] = useState<OptInStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const [includeFree, setIncludeFree] = useState(true);
  const [freeQty, setFreeQty] = useState(5);
  const [freeDineIn, setFreeDineIn] = useState("yes");
  const [freeDineUntil, setFreeDineUntil] = useState("21:00");

  const [tiers, setTiers] = useState<TierState[]>([
    { _id: uid(), quantity: 5, percentage: 30, maxMealAmount: 0, dineInAvailable: "yes", dineInUntil: "21:00" },
  ]);

  /* free voucher section */
  const [freeVoucher, setFreeVoucher] = useState<FreeVoucher>({
    quantity: 10,
    maxMealAmount: 0,
    dineInAvailable: "yes",
    dineInUntil: "21:00",
  });

  /* discount tiers */
  const [discountTiers, setDiscountTiers] = useState<DiscountTier[]>([
    { quantity: 10, percentage: 30, maxMealAmount: 0, dineInAvailable: "yes", dineInUntil: "21:00" },
  ]);


  /* derived totals */
  const freeTotalQty = includeFree ? freeVoucher.quantity : 0;
  const discountTotalQty = discountTiers.reduce((s, t) => s + t.quantity, 0);
  const grandTotal = freeTotalQty + discountTotalQty;






  const loadStatus = useCallback(async () => {
    try {
      const s = await vendorGet<OptInStatus>("/api/vendor/opt-in");
      setStatus(s);
      // Pre-fill if already opted in
      if (s.optedIn && s.optIn) {
        setFreeQty(s.optIn.freeVouchers || 10);
        setIncludeFree(s.optIn.freeVouchers > 0);
        if (s.optIn.discountTiers?.length) {
          setTiers(s.optIn.discountTiers.map((t) => ({ ...t, _id: uid() })));
        }
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  function addTier() {
    setTiers((prev) => [...prev, { _id: uid(), quantity: 5, percentage: 30, maxMealAmount: 0, dineInAvailable: "yes", dineInUntil: "21:00" }]);
  }

  function removeTier(id: string) {
    setTiers((prev) => prev.filter((t) => t._id !== id));
  }

  function updateTier<K extends keyof TierState>(id: string, key: K, value: TierState[K]) {
    setTiers((prev) => prev.map((t) => t._id === id ? { ...t, [key]: value } : t));
  }

  const freeTotal = includeFree ? freeQty : 0;
  const discTotal = tiers.reduce((s, t) => s + t.quantity, 0);
  const grand = freeTotal + discTotal;

  async function handleSubmit() {
    if (grand === 0) { setError("Add at least one voucher."); return; }
    setError(""); setSubmitting(true);
    try {
      await vendorPost("/api/vendor/opt-in", {
        freeVouchers: freeTotal,
        freeMealAmount: freeVoucher.maxMealAmount,
        freeDineIn: freeVoucher.dineInAvailable,
        freeDineUntil: freeVoucher.dineInUntil,
        discountTiers: tiers.map(({ _id, ...t }) => t),
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof VendorFetchError ? err.message : "Failed to submit.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-[var(--ink-soft)]">Loading cycle status…</p>
      </div>
    );
  }

  if (!status?.active) {
    return (
      <>
        <PageHeader
          title={<>Opt <em className="italic text-[var(--blue)]">in</em></>}
          sub="No active cycle right now. Check back when the window opens."
        />
        <Panel title="No active cycle">
          <p className="text-sm text-[var(--ink-soft)]">
            Opt-in opens when an admin starts a new cycle. You'll be able to declare your vouchers here.
          </p>
        </Panel>
      </>
    );
  }

  if (submitted) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-6">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-[var(--forest)]/10 text-3xl">✓</div>
        <h2 className="mb-2 text-3xl font-medium" style={{ fontFamily: "var(--font-display)" }}>
          You're in for cycle #{status.cycleNumber}.
        </h2>
        <p className="max-w-sm text-[var(--ink-soft)]">
          <strong className="text-[var(--ink)]">{grand} voucher{grand !== 1 ? "s" : ""}</strong> added to the pool —{" "}
          {freeTotal > 0 && `${freeTotal} free`}
          {freeTotal > 0 && discTotal > 0 && ", "}
          {discTotal > 0 && `${discTotal} discounted`}.
        </p>



        {/* <p className="max-w-sm text-[var(--ink-soft)]">
          <strong className="text-[var(--ink)]">{grandTotal} vouchers</strong> added
          to the pool
          {includeFree && (
            <> — {freeTotalQty} free</>
          )}
          {discountTiers.length > 0 && (
            <>, {discountTotalQty} discounted across {discountTiers.length} tier{discountTiers.length > 1 ? "s" : ""}</>
          )}
          . Window opens at 09:00 WAT tomorrow.
        </p> */}
      </div>
    );
  }


  return (
    <>
      <PageHeader
        title={<>Opt in ·  <em className="italic text-[var(--blue)]">cycle #{status.cycleNumber}</em></>}
        sub="Declare how many vouchers you're contributing. You can add free vouchers, discount tiers, or both — each with its own quantity, discount rate, and dine-in settings."
      />

      <div className="max-w-3xl space-y-5">
        {/* ── Citywide pool ── */}
        <Meter
          label={`Citywide pool — cycle #${status.cycleNumber} forecast`}
          value={status.totalPool}
          max={status.estimatedPool}
          subleft={`Confirmed by ${status.vendorCount} vendors`}
          subright={`Need: ${status.estimatedPool - status.vendorCount} more`}
        />

        {/* Free vouchers */}
        <Panel title="Free vouchers">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--ink)]">Include free meal vouchers</p>
              <p className="text-xs text-[var(--ink-soft)]">Recipients get a fully free meal — no charge to them.</p>
            </div>
            <button type="button" onClick={() => setIncludeFree((v) => !v)}
              className={`relative h-6 w-11 flex-none rounded-full transition-colors duration-200 ${includeFree ? "bg-[var(--blue)]" : "bg-[var(--grey-200)]"}`}>
              <span className={`absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white shadow transition-all duration-200 ${includeFree ? "left-[22px]" : "left-[3px]"}`} />
            </button>
          </div>

          {includeFree && (
            <div className="space-y-4 rounded-2xl border border-[var(--line)] bg-[var(--grey-50)] p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <FieldLabel>Number of vouchers</FieldLabel>
                  <Stepper value={freeQty} onChange={setFreeQty} />
                </div>
                <div>
                  <FieldLabel>Max meal amount</FieldLabel>
                  <AmountInput
                    value={freeVoucher.maxMealAmount}
                    onChange={(n) => setFreeVoucher((v) => ({ ...v, maxMealAmount: n }))}
                  />
                </div>
                <div>
                  <FieldLabel>Dine-in available?</FieldLabel>
                  <SelectField label="" options={DINE_OPTIONS} value={freeDineIn} onChange={setFreeDineIn} />
                </div>
                {freeDineIn === "yes" && (
                  <div>
                    <FieldLabel>Dine-in until</FieldLabel>
                    <SelectField label="" options={TIME_OPTIONS} value={freeDineUntil} onChange={setFreeDineUntil} />
                  </div>
                )}
              </div>
              {freeVoucher.maxMealAmount > 0 && (
                <p className="text-xs text-[var(--ink-soft)]">
                  Each free voucher covers meals up to <strong className="text-[var(--ink)]">₦{freeVoucher.maxMealAmount.toLocaleString()}</strong>.
                </p>
              )}
            </div>
          )}
        </Panel>

        {/* Discount tiers */}
        <Panel title="Discount vouchers">
          <p className="mb-5 text-sm text-[var(--ink-soft)]">
            Add one or more discount tiers — each independently configured.
            E.g. <strong>10 × 30% off</strong> and <strong>5 × 15% off</strong> in the same cycle.
            Participants pay the discounted price directly.
          </p>

          <div className="space-y-4">
            {tiers.map((tier, idx) => (
              <div key={tier._id} className="rounded-2xl border border-[var(--line)] bg-[var(--grey-50)] p-5">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--mute)]">
                    Tier {idx + 1}
                  </p>
                  {tiers.length > 1 && (
                    <button type="button" onClick={() => removeTier(tier._id)}
                      className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium text-[var(--blue)] hover:bg-[var(--blue)]/5">
                      <HiOutlineTrash size={13} /> Remove
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <FieldLabel>Discount</FieldLabel>
                    <SelectField label="" options={DISCOUNT_OPTIONS} value={String(tier.percentage)}
                      onChange={(v) => updateTier(tier._id, "percentage", Number(v))} />
                  </div>
                  <div>
                    <FieldLabel>Quantity</FieldLabel>
                    <Stepper value={tier.quantity} onChange={(n) => updateTier(tier._id, "quantity", n)} />
                  </div>
                  <div>
                    <FieldLabel>Max meal amount</FieldLabel>
                    <AmountInput
                      value={tier.maxMealAmount}
                      onChange={(n) => updateTier(tier._id, "maxMealAmount", n)}
                    />
                  </div>
                  <div>
                    <FieldLabel>Dine-in?</FieldLabel>
                    <SelectField label="" options={DINE_OPTIONS} value={tier.dineInAvailable}
                      onChange={(v) => updateTier(tier._id, "dineInAvailable", v as "yes" | "no")} />
                  </div>
                  {tier.dineInAvailable === "yes" && (
                    <div>
                      <FieldLabel>Until</FieldLabel>
                      <SelectField label="" options={TIME_OPTIONS} value={tier.dineInUntil}
                        onChange={(v) => updateTier(tier._id, "dineInUntil", v)} />
                    </div>
                  )}
                </div>
                <div className="mt-4 rounded-xl bg-white px-4 py-2.5 text-sm text-[var(--ink-soft)]">
                  <span className="font-semibold text-[var(--ink)]">{tier.quantity} voucher{tier.quantity > 1 ? "s" : ""}</span>
                  {" "}at <span className="font-semibold text-[var(--ink)]">{tier.percentage}% off</span>
                  {tier.maxMealAmount > 0 && (
                    <> · up to <span className="font-semibold text-[var(--ink)]">₦{tier.maxMealAmount.toLocaleString()}</span></>
                  )}
                  {tier.dineInAvailable === "yes" ? ` · dine-in until ${tier.dineInUntil}` : " · no dine-in"}
                </div>
              </div>
            ))}
          </div>

          <button type="button" onClick={addTier}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[var(--grey-200)] py-3.5 text-sm font-medium text-[var(--ink-soft)] hover:border-[var(--blue)] hover:text-[var(--blue)] transition-colors">
            <HiOutlinePlus size={16} /> Add another discount tier
          </button>
        </Panel>

        {/* Declaration */}
        <div className="rounded-2xl border border-[var(--line)] bg-white p-6">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-[var(--mute)]">Your declaration</p>
          <div className="mb-5 space-y-2">
            {includeFree && freeTotal > 0 && (
              <div className="flex items-center justify-between rounded-xl bg-[var(--grey-50)] px-4 py-3">
                <span className="text-sm text-[var(--ink-soft)]">
                  Free meal vouchers
                  {freeVoucher.maxMealAmount > 0 && (
                    <span className="ml-1.5 text-xs">· up to ₦{freeVoucher.maxMealAmount.toLocaleString()}</span>
                  )}
                </span>
                <span className="font-mono text-sm font-semibold">{freeTotal}</span>
              </div>
            )}
            {tiers.map((t, i) => (
              <div key={t._id} className="flex items-center justify-between rounded-xl bg-[var(--grey-50)] px-4 py-3">
                <span className="text-sm text-[var(--ink-soft)]">
                  Discount tier {i + 1} · {t.percentage}% off
                  {t.maxMealAmount > 0 && (
                    <span className="ml-1.5 text-xs">· up to ₦{t.maxMealAmount.toLocaleString()}</span>
                  )}
                </span>
                <span className="font-mono text-sm font-semibold">{t.quantity}</span>
              </div>
            ))}
            <div className="flex items-center justify-between rounded-xl bg-[var(--ink)] px-4 py-3">
              <span className="text-sm font-semibold text-white/70">Total vouchers</span>
              <span className="font-mono text-xl font-semibold text-[var(--lime)]" style={{ fontFamily: "var(--font-display)" }}>
                {grand}
              </span>
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-[var(--blue)]/20 bg-[var(--blue)]/5 px-4 py-3 text-sm text-[var(--blue)]">
              {error}
            </div>
          )}

          <Button fullWidth onClick={handleSubmit} disabled={submitting || grand === 0}>
            {submitting ? "Submitting…" : status?.optedIn ? "Update declaration" : `Confirm opt-in for cycle #${status.cycleNumber}`}
          </Button>
        </div>
      </div>

    </>
  );
}


