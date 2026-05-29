"use client";

import Link from "next/link";
import Button from "@/components/ui/Button";
import {
  KpiTile, Panel, Badge, Table, Tr, Td, PageHeader, Meter, Timeline, TimelineItem,
} from "@/components/admin/AdminUI";
import { useEffect, useState } from "react";
import { adminGet, AdminFetchError } from "@/lib/admin-fetch";
import { useToast } from "@/components/ui/Toast";
import type { CycleRecord, VendorOptIn } from "@/lib/types";



interface OverviewData {
  cycle: CycleRecord | null;
  participants: number;
  vouchers: number;
  pool: number;
}

function fmtTs(ts: { _seconds: number } | null | undefined): string {
  if (!ts) return "—";
  return new Date(ts._seconds * 1000).toLocaleString("en-GB", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

export default function OverviewPage() {
  const { toast } = useToast();
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      console.log('loading');
      try {
        const [cycles, vouchers] = await Promise.all([
          adminGet<CycleRecord[]>("/api/admin/cycles?status=started"),
          adminGet<{ count: number }>("/api/admin/stats/vouchers").catch(() => ({ count: 0 })),
        ]);

        const cycle = cycles[0] ?? null;
        setData({
          cycle,
          participants: 0,    // fetched below
          vouchers: 0,
          pool: cycle?.totalPool ?? 0,
        });

        // Enrich with voucher count if cycle active
        if (cycle) {
          // if (cycle.participantIds.length < 1) {

          //   const participants = await adminGet<{ participantCount: number }>(
          //     `/api/admin/stats/participants?cycleId=${cycle.id}`
          //   ).catch(() => ({ participantCount: 0 }));
            
          // }
          
          const voucherCount = await adminGet<[]>(
            `/api/admin/stats/vouchers?cycleId=${cycle.id}`
          ).catch(() => ([]));
          console.log(voucherCount);

          setData((prev) => prev
            // ? { ...prev, participants: participants?.participantCount, vouchers: voucherCount.length }
            ? { ...prev, participants: cycle.participantIds.length, vouchers: voucherCount.length }
            : prev
          );
        }
      } catch (err) {
        toast(
          err instanceof AdminFetchError ? err.message : "Failed to load overview.",
          "error"
        );
        // console.log(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const cycle = data?.cycle ?? null;

  const isStarted = cycle?.status === "started";
  const vendorOptIns: VendorOptIn[] = cycle?.vendorOptIns ?? [];

  return (
    <>
      <PageHeader
        title={
          cycle
            ? <>Cycle <em className="italic text-[var(--blue)]">#{cycle.cycleNumber}</em> · live</>
            : <>No <em className="italic text-[var(--blue)]">active cycle</em></>
        }
        sub={
          cycle
            ? `Window closes ${fmtTs(cycle.windowClose as unknown as { _seconds: number })}.${cycle.drawLogId ? " Draw complete." : " Draw pending."}`
            : "Start a cycle from the cycle control page."
        }
      >
        <Link href="/admin/cycle-control">
          <Button variant="ghost">{cycle ? "Manage cycle" : "New cycle"}</Button>
        </Link>
        {cycle && !cycle.drawLogId && isStarted && (
          <Link href="/admin/draw">
            <Button>Trigger draw</Button>
          </Link>
        )}
      </PageHeader>

      {/* KPIs */}
      {/* <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiTile
          label="Participants entered"
          value="84"
          detail="↑ 32% vs yesterday"
          detailVariant="up"
        />
        <KpiTile
          label="Vouchers issued"
          value={<>84<span className="text-xl text-[var(--ink-soft)]"> / 124</span></>}
          detail="68% of pool"
        />
        <KpiTile
          label="Vendors opted in"
          value="9"
          detail="of 14 active"
        />
        <KpiTile
          label="Tasks auto-verified"
          value="252"
          detail="100% automated"
          accent
        />
      </div> */}

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiTile
          label="Participants entered"
          value={loading ? "—" : String(data?.participants ?? 0)}
          detail="This cycle"
        />
        <KpiTile
          label="Vouchers issued"
          value={loading ? "—" : String(data?.vouchers ?? 0)}
          detail={`of ${data?.pool ?? 0} pool`}
        />
        <KpiTile
          label="Vendors opted in"
          value={loading ? "—" : String(vendorOptIns.length)}
          detail="This cycle"
        />
        <KpiTile
          label="Total pool"
          value={loading ? "—" : String(data?.pool ?? 0)}
          detail="Vouchers declared"
          accent
        />
      </div>


      {!cycle ? (
        <Panel title="No active cycle">
          <p className="text-sm text-[var(--ink-soft)]">
            Create and start a cycle to see live stats here.
          </p>
          <div className="mt-4">
            <Link href="/admin/cycle-control">
              <Button>Create cycle</Button>
            </Link>
          </div>
        </Panel>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          <Panel title="Cycle timeline">
            <Meter
              value={cycle.totalPool}
              max={cycle.estimatedPool}
              label="Pool utilisation"
              subleft={`Window opened ${fmtTs(cycle.windowOpen as unknown as { _seconds: number })}`}
              subright={`Closes ${fmtTs(cycle.windowClose as unknown as { _seconds: number })}`}
            />

            <div className="mt-6">
              <Timeline>
                <TimelineItem
                  status="done"
                  title={`Window opened · ${fmtTs(cycle.windowOpen as unknown as { _seconds: number })}`}
                  meta={`Cycle #${cycle.cycleNumber} started`}
                />
                <TimelineItem
                  status="active"
                  title="Vouchers being issued"
                  meta={`${data?.vouchers ?? 0} issued so far`}
                />
                <TimelineItem
                  status={cycle.drawLogId ? "done" : "upcoming"}
                  title={`Draw · ${fmtTs(cycle.windowClose as unknown as { _seconds: number })}`}
                  meta={cycle.drawLogId ? "Draw complete" : "Pending"}
                />
                <TimelineItem
                  status="upcoming"
                  title="Cooldown"
                  meta={`${cycle.cooldownHours}h before next cycle`}
                />
              </Timeline>
            </div>
          </Panel>

          <Panel
            title="Vendor opt-ins"
            right={`${vendorOptIns.length} vendor${vendorOptIns.length !== 1 ? "s" : ""}`}
            noPadding
          >
            {vendorOptIns.length === 0 ? (
              <div className="px-5 py-6 text-sm text-[var(--ink-soft)]">
                No vendors have opted in yet.
              </div>
            ) : (
              <Table headers={["Vendor", "Free", "Discount tiers", "Total"]}>
                {vendorOptIns.map((v) => {
                  const discTotal = v.discountTiers?.reduce((s, t) => s + t.quantity, 0) ?? 0;
                  return (
                    <Tr key={v.vendorId}>
                      <Td className="font-medium">{v.vendorName}</Td>
                      <Td mono>{v.freeVouchers}</Td>
                      <Td className="text-[var(--ink-soft)] text-xs">
                        {v.discountTiers?.map((t) => `${t.quantity}×${t.percentage}%`).join(", ") || "—"}
                      </Td>
                      <Td mono>{v.freeVouchers + discTotal}</Td>
                    </Tr>
                  );
                })}
              </Table>
            )}
          </Panel>

        </div>
      )}

      {/* Spec note */}
      {/* <div className="mt-5 rounded-2xl border border-[var(--line)] bg-white px-5 py-4">
          <p className="text-xs text-[var(--ink-soft)]">
            <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--blue)] text-[10px] font-bold text-white">i</span>
            <strong className="text-[var(--ink)]">Auto-close trigger:</strong>{" "}
            Window closes on whichever fires first:{" "}
            <code className="rounded bg-[var(--grey-100)] px-1 py-0.5 font-mono text-[11px]">supply_remaining == 0</code>{" "}
            OR{" "}
            <code className="rounded bg-[var(--grey-100)] px-1 py-0.5 font-mono text-[11px]">window_end_at &lt;= now</code>.
            Admin can also force-close.
          </p>
        </div> */}
    </>
  );
}
