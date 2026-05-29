"use client";

import Link from "next/link";
import Button from "@/components/ui/Button";
// import { Panel, Badge, PageHeader, Meter } from "@/components/vendor/VendorUI";
import {
  KpiTile,
  Panel,
  Badge,
  Table,
  Tr,
  Td,
  PageHeader,
  Meter,
} from "@/components/vendor/VendorUI";
import { useVendorAuth } from "@/context/VendorAuthContext";
import { useEffect, useState } from "react";
import { vendorGet, VendorFetchError } from "@/lib/vendor-fetch";
import type { RedemptionRecord } from "@/lib/types";

interface OptInStatus {
  active: boolean;
  cycleId?: string;
  cycleNumber?: number;
  optedIn: boolean;
  estimatedPool: number,
  totalPool: number,
  vendorCount: number,
  optIn?: { freeVouchers: number; discountTiers: { quantity: number; percentage: number }[] };
}

function fmtTs(ts: { _seconds: number } | null | undefined): string {
  if (!ts) return "—";
  return new Date(ts._seconds * 1000).toLocaleString("en-GB", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
}







const VOUCHERS = [
  { code: "PR-9X4K-A28T", type: "Free meal", status: "ok" as const, time: "11:24" },
  { code: "PR-7L2M-B91Q", type: "30% discount", status: "ok" as const, time: "11:09" },
  { code: "PR-3K8P-C47Y", type: "30% discount", status: "pending" as const, time: "10:51" },
  { code: "PR-1H6V-D02R", type: "Free meal", status: "danger" as const, time: "09:00" },
];

const STATUS_LABEL: Record<string, string> = {
  ok: "Redeemed",
  pending: "Pending",
  danger: "Expired",
};






export default function DashboardPage() {
  const { vendor } = useVendorAuth();

  const [optInStatus, setOptInStatus] = useState<OptInStatus | null>(null);
  const [redemptions, setRedemptions] = useState<RedemptionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      vendorGet<OptInStatus>("/api/vendor/opt-in"),
      vendorGet<RedemptionRecord[]>("/api/vendor/redemptions"),
    ])
      .then(([opt, reds]) => {
        setOptInStatus(opt);
        setRedemptions(reds);
      })
      .catch((err) => console.error("[dashboard]", err))
      .finally(() => setLoading(false));
  }, []);

  const initial = vendor?.name?.[0]?.toUpperCase() ?? "V";
  const recentReds = redemptions.slice(0, 5);

  const freeTotal = optInStatus?.optIn?.freeVouchers ?? 0;
  const discTotal = optInStatus?.optIn?.discountTiers
    ?.reduce((s, t) => s + t.quantity, 0) ?? 0;
  const totalPool = freeTotal + discTotal;

  return (
    <>
      <PageHeader
        title={
          <>
            Good morning,{" "}
            <em className="italic text-[var(--blue)]">
              {vendor?.name?.split(" ")[0] ?? "Vendor"}
            </em>.
          </>
        }
        sub={
          optInStatus?.active
            ? `Cycle #${optInStatus.cycleNumber} is live.${optInStatus.optedIn ? ` You've contributed ${totalPool} vouchers.` : " You haven't opted in yet."}`
            : "No active cycle right now."
        }
        // sub="Cycle #214 closes in 3h 41m. You're opted in for 20 meals."
      >
        <Button variant="ghost">Today's report</Button>
        <Link href="/vendor/verify">
          <Button>Open verifier</Button>
        </Link>
      </PageHeader>

      {/* KPI strip */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            label: "Free vouchers declared",
            value: loading ? "—" : String(freeTotal),
            sub: "This cycle",
          },
          {
            label: "Discount vouchers",
            value: loading ? "—" : String(discTotal),
            sub: "Across all tiers",
          },
          {
            label: "Redeemed today",
            value: loading ? "—" : String(
              redemptions.filter((r) => {
                const d = new Date((r.redeemedAt as unknown as { _seconds: number })._seconds * 1000);
                return d.toDateString() === new Date().toDateString();
              }).length
            ),
            sub: "Vouchers verified",
          },
          {
            label: "Total redemptions",
            value: loading ? "—" : String(redemptions.length),
            sub: "All time",
          },
        ].map((k) => (
          <KpiTile
            label={k.label}
            value={k.value}
            detail={k.sub}
            key={k.label}
          />
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">

        {/* Opt-in status */}
        <Panel title="Current cycle">
          {!optInStatus?.active ? (
            <p className="text-sm text-[var(--ink-soft)]">
              No active cycle. Check back when the next window opens.
            </p>
          ) : optInStatus.optedIn ? (
            <>
              <div className="mb-4 flex items-center gap-2">
                <Badge variant="ok">Opted in</Badge>
                <span className="text-sm text-[var(--ink-soft)]">
                  Cycle #{optInStatus.cycleNumber}
                </span>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between rounded-xl bg-[var(--grey-50)] px-4 py-3 text-sm">
                  <span className="text-[var(--ink-soft)]">Free vouchers</span>
                  <span className="font-semibold">{freeTotal}</span>
                </div>
                {optInStatus.optIn?.discountTiers.map((t, i) => (
                  <div key={i} className="flex justify-between rounded-xl bg-[var(--grey-50)] px-4 py-3 text-sm">
                    <span className="text-[var(--ink-soft)]">Discount tier · {t.percentage}% off</span>
                    <span className="font-semibold">{t.quantity}</span>
                  </div>
                ))}
              </div>
              <Meter
                label="Citywide pool forecast"
                value={optInStatus.totalPool}
                max={optInStatus.estimatedPool}
                subleft={`Confirmed by ${optInStatus.vendorCount} vendors`}
                subright={`Need: ${optInStatus.estimatedPool - optInStatus.vendorCount} more`}
              />
              <Link href="/vendor/opt-in" className="mt-4 block">
                <Button variant="ghost" fullWidth>Update declaration</Button>
              </Link>
            </>
          ) : (
            <>
              <p className="mb-4 text-sm text-[var(--ink-soft)]">
                Cycle #{optInStatus.cycleNumber} is live. You haven't opted in yet.
              </p>
              <Meter
                label="Citywide pool forecast"
                value={optInStatus.totalPool}
                max={optInStatus.estimatedPool}
                subleft={`Confirmed by ${optInStatus.vendorCount} vendors`}
                subright={`Need: ${optInStatus.estimatedPool - optInStatus.vendorCount} more`}
              />
              <div className="mt-4">
                <Link href="/vendor/opt-in">
                  <Button fullWidth>Opt in now</Button>
                </Link>
              </div>
            </>
          )}
        </Panel>

        {/* Recent redemptions */}
        <Panel title="Recent redemptions" right={`${redemptions.length} total`}>
          {loading ? (
            <p className="text-sm text-[var(--ink-soft)]">Loading…</p>
          ) : recentReds.length === 0 ? (
            <p className="text-sm text-[var(--ink-soft)]">
              No redemptions yet. They'll appear here as participants redeem vouchers.
            </p>
          ) : (
            <div className="space-y-2.5">
              {recentReds.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-xl border border-[var(--line)] px-4 py-3">
                  <div>
                    <p className="font-mono text-sm font-semibold text-[var(--ink)]">{r.voucherCode}</p>
                    <p className="text-xs text-[var(--ink-soft)]">{fmtTs(r.redeemedAt as unknown as { _seconds: number })}</p>
                  </div>
                  <Badge variant={r.type === "free" ? "ok" : "info"}>
                    {r.type === "free" ? "Free" : `${r.discountPct}% off`}
                  </Badge>
                </div>
              ))}
              <Link href="/vendor/redemptions">
                <Button variant="ghost" fullWidth>View all</Button>
              </Link>
            </div>
          )}
        </Panel>

      </div>







      {/* KPI row */}
      {/* <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiTile
          label="Meals committed today"
          value="20"
          detail="12 free · 8 discounted"
        />
        <KpiTile
          label="Vouchers redeemed"
          value="7"
          detail="↑ ahead of yesterday"
          detailVariant="up"
        />
        <KpiTile
          label="Avg. redemption time"
          value={<>42<span className="text-xl text-[var(--ink-soft)]">m</span></>}
          detail="from win → claim"
        />
        <KpiTile
          label="Cycle pool share"
          value={<>16<span className="text-xl">%</span></>}
          detail="20 of 124 vouchers"
          accent
        />
      </div> */}

      {/* Two-col panels */}
      {/* Voucher activity */}
      {/* <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Today's voucher activity" right="Cycle #214 · live" noPadding>
          <Table headers={["Code", "Type", "Status", "Time"]}>
            {VOUCHERS.map((v) => (
              <Tr key={v.code}>
                <Td mono>{v.code}</Td>
                <Td>{v.type}</Td>
                <Td>
                  <Badge variant={v.status}>{STATUS_LABEL[v.status]}</Badge>
                </Td>
                <Td className="text-[var(--ink-soft)]">{v.time}</Td>
              </Tr>
            ))}
          </Table>
        </Panel>
      </div> */}

    </>
  );
}



