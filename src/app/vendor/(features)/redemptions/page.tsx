"use client";

import Button from "@/components/ui/Button";
import { Panel, Badge, Table, Tr, Td, PageHeader } from "@/components/vendor/VendorUI";
import { useEffect, useState } from "react";
import { vendorGet, VendorFetchError } from "@/lib/vendor-fetch";
import type { RedemptionRecord } from "@/lib/types";


function fmtTs(ts: { _seconds: number } | null | undefined): string {
  if (!ts) return "—";
  return new Date(ts._seconds * 1000).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}





const ROWS = [
  { date: "11 May 11:24", cycle: "#214", code: "PR-9X4K-A28T", type: "Free meal", reimb: "₦2,500", status: "ok" as const },
  { date: "11 May 11:09", cycle: "#214", code: "PR-7L2M-B91Q", type: "Discount 30%", reimb: "—", status: "ok" as const },
  { date: "10 May 14:02", cycle: "#213", code: "PR-2K8N-X14V", type: "Free meal", reimb: "₦2,500", status: "pending" as const },
  { date: "10 May 12:35", cycle: "#213", code: "PR-8H3W-Y22P", type: "Discount 30%", reimb: "—", status: "ok" as const },
  { date: "09 May 19:48", cycle: "#212", code: "PR-4J7C-T55K", type: "Free meal", reimb: "₦2,500", status: "ok" as const },
];

const STATUS_LABEL = { ok: "Cleared", pending: "Pending", danger: "Failed" };


export default function RedemptionsPage() {
  const [redemptions, setRedemptions] = useState<RedemptionRecord[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");

  useEffect(() => {
    vendorGet<RedemptionRecord[]>("/api/vendor/redemptions")
      .then((data) => { setRedemptions(data); setLoading(false); })
      .catch((err) => {
        setError(err instanceof VendorFetchError ? err.message : "Failed to load redemptions.");
        setLoading(false);
      });
  }, []);

  const freeCount     = redemptions.filter((r) => r.type === "free").length;
  const discountCount = redemptions.filter((r) => r.type === "discount").length;

  function exportCSV() {
    const rows = [
      ["Code", "Type", "Discount %", "Cycle", "Redeemed at"].join(","),
      ...redemptions.map((r) => [
        r.voucherCode,
        r.type,
        r.discountPct ?? "—",
        r.cycleId,
        fmtTs(r.redeemedAt as unknown as { _seconds: number }),
      ].join(",")),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([rows], { type: "text/csv" }));
    Object.assign(document.createElement("a"), { href: url, download: "redemptions.csv" }).click();
  }

  return (
    <>
      <PageHeader
        title={<>Redemption <em className="italic text-[var(--blue)]">history</em></>}
        sub="Every voucher you've validated."
      >
        <Button variant="ghost" onClick={exportCSV} disabled={loading || redemptions.length === 0}>
          Export CSV
        </Button>
      </PageHeader>

      {/* Summary strip */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          { label: "Total redeemed",    value: String(redemptions.length) },
          { label: "Free meals",        value: String(freeCount)           },
          { label: "Discounts used",    value: String(discountCount)       },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-[var(--line)] bg-white p-4">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-[var(--mute)]">
              {s.label}
            </p>
            <p className="text-3xl font-light tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
              {loading ? "—" : s.value}
            </p>
          </div>
        ))}
      </div>

      <Panel title="All redemptions" noPadding>
        {error ? (
          <div className="px-5 py-10 text-center text-sm text-[var(--blue)]">{error}</div>
        ) : (!loading && redemptions.length === 0) ? (
          <div className="px-5 py-14 text-center">
            <p className="mb-1 text-sm font-semibold text-[var(--ink)]">No redemptions yet</p>
            <p className="text-sm text-[var(--ink-soft)]">
              Verified vouchers will appear here as participants redeem them.
            </p>
          </div>
        ) : (
          <Table loading={loading} headers={["Code", "Type", "Redeemed at"]}>
            {redemptions.map((r) => (
              <Tr key={r.id}>
                <Td mono>{r.voucherCode}</Td>
                <Td>
                  <Badge variant={r.type === "free" ? "ok" : "info"}>
                    {r.type === "free" ? "Free meal" : `${r.discountPct}% off`}
                  </Badge>
                </Td>
                <Td className="whitespace-nowrap text-[var(--ink-soft)]">
                  {fmtTs(r.redeemedAt as unknown as { _seconds: number })}
                </Td>
              </Tr>
            ))}
          </Table>
        )}
      </Panel>
    </>
  );
}

