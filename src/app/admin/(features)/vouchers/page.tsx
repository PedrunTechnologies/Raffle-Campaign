"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Panel, Badge, Table, Tr, Td, PageHeader, KpiTile } from "@/components/admin/AdminUI";
import { useToast } from "@/components/ui/Toast";
import { adminGet, AdminFetchError } from "@/lib/admin-fetch";
import { VoucherRecord } from "@/lib/types";

type StatusFilter = "all" | "issued" | "won" | "redeemed" | "expired" | "no_prize";

interface VoucherRow {
  code: string;
  codeMasked: string;
  cycleId: string;
  type: "free" | "discount" | null;
  discountPct: number | null;
  status: VoucherRecord["status"];
  issuedAt: { _seconds: number } | null;
  expiresAt: { _seconds: number } | null;
  redeemedAt: { _seconds: number } | null;
  participantId: string;
  participantName: string;
  participantEmail: string;
  participantPhone: string | null;
  vendorId: string | null;
  vendorName: string | null;
}

const STATUS_BADGE: Record<string, { variant: "ok" | "pending" | "danger" | "info" | "lime"; label: string }> = {
  issued: { variant: "info", label: "Issued" },
  eligible: { variant: "pending", label: "Eligible" },
  won: { variant: "lime", label: "Won" },
  redeemed: { variant: "ok", label: "Redeemed" },
  expired: { variant: "danger", label: "Expired" },
  no_prize: { variant: "danger", label: "No prize" },
};

function fmtTs(ts: { _seconds: number } | null | undefined) {
  if (!ts) return "—";
  return new Date(ts._seconds * 1000).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function VouchersPage() {
  const { toast } = useToast();
  const [rows, setRows] = useState<VoucherRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminGet<VoucherRow[]>("/api/admin/vouchers");
      setRows(data);
    } catch (err) {
      toast(err instanceof AdminFetchError ? err.message : "Failed to load vouchers.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = rows.filter((r) => {
    const matchStatus = filter === "all" || r.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q || [
      r.codeMasked, r.participantName, r.participantPhone ?? "",
      r.participantEmail, r.vendorName ?? "",
    ].some((s) => s.toLowerCase().includes(q));
    return matchStatus && matchSearch;
  });

  const counts = {
    total: rows.length,
    redeemed: rows.filter((r) => r.status === "redeemed").length,
    won: rows.filter((r) => r.status === "won").length,
    expired: rows.filter((r) => r.status === "expired").length,
  };

  const FILTERS: { label: string; value: StatusFilter }[] = [
    { label: "All", value: "all" },
    { label: "Issued", value: "issued" },
    { label: "Won", value: "won" },
    { label: "Redeemed", value: "redeemed" },
    { label: "Expired", value: "expired" },
    { label: "No prize", value: "no_prize" },
  ];

  return (
    <>
      <PageHeader title="Vouchers" sub="All vouchers issued across cycles." />

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiTile label="Total issued" value={counts.total} detail="all time" />
        <KpiTile label="Won" value={counts.won} detail="awaiting redemption" />
        <KpiTile label="Redeemed" value={counts.redeemed} detail="completed" detailVariant="up" />
        <KpiTile label="Expired" value={counts.expired} detail="lapsed" detailVariant="down" />
      </div>

      <Panel title="All vouchers" noPadding>
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 border-b border-[var(--line)] px-5 py-4">
          <input
            type="search"
            placeholder="Search name, phone, vendor…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="
              h-9 w-56 rounded-xl border border-[var(--line)] bg-[var(--grey-50)]
              px-3 text-sm outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/10
            "
          />
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`
                  rounded-xl border px-3 py-1.5 text-xs font-medium transition-all
                  ${filter === f.value
                    ? "border-[var(--ink)] bg-[var(--ink)] text-white"
                    : "border-[var(--line)] bg-white text-[var(--ink-soft)] hover:border-[var(--grey-200)] hover:text-[var(--ink)]"
                  }
                `}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <Table
          headers={["Code", "Participant", "Phone", "Vendor", "Type", "Status", "Issued", "Redeemed"]}
          loading={loading}
          empty={!loading && filtered.length === 0}
          emptyMessage="No vouchers found."
          emptyIcon="🎟️"
        >
          {filtered.map((row) => {
            const badge = STATUS_BADGE[row.status] ?? { variant: "info" as const, label: row.status };
            return (
              <Tr key={row.code}>
                <Td>
                  {/* <Link
                    href={`/admin/vouchers/${row.id}`}
                    className="font-mono text-sm font-semibold text-[var(--blue)] hover:underline"
                  > */}
                  {row.codeMasked}
                  {/* </Link> */}
                </Td>
                <Td>
                  <p className="font-medium text-[var(--ink)]">{row.participantName}</p>
                  <p className="text-xs text-[var(--mute)]">{row.participantEmail}</p>
                </Td>
                <Td>{row.participantPhone ?? "—"}</Td>
                <Td>{row.vendorName ?? <span className="text-[var(--mute)]">—</span>}</Td>
                <Td>
                  {row.type === "free"
                    ? <Badge variant="ok">Free</Badge>
                    : row.type === "discount"
                      ? <Badge variant="info">{row.discountPct}% off</Badge>
                      : <span className="text-[var(--mute)]">—</span>
                  }
                </Td>
                <Td><Badge variant={badge.variant}>{badge.label}</Badge></Td>
                <Td className="text-xs text-[var(--ink-soft)]">{fmtTs(row.issuedAt)}</Td>
                <Td className="text-xs text-[var(--ink-soft)]">{fmtTs(row.redeemedAt)}</Td>
              </Tr>
            );
          })}
        </Table>
      </Panel>
    </>
  );
}