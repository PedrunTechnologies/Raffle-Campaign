"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Panel, Badge, Table, Tr, Td, PageHeader, KpiTile } from "@/components/admin/AdminUI";
import { useToast } from "@/components/ui/Toast";
import { adminGet, adminPost, AdminFetchError } from "@/lib/admin-fetch";
import { VoucherRecord } from "@/lib/types";
import type { LeftoverResponse, VendorLeftover } from "@/app/api/admin/vouchers/leftover/route";

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

/* ── Upgrade modal ───────────────────────────────────────────────── */
interface UpgradeModalProps {
  voucher: VoucherRow;
  leftover: LeftoverResponse | null;
  onClose: () => void;
  onUpgraded: (code: string, vendorId: string, vendorName: string) => void;
}

function UpgradeModal({ voucher, leftover, onClose, onUpgraded }: UpgradeModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");

  const vendorsWithSlots = leftover?.vendors.filter((v) => v.remaining > 0) ?? [];
  const totalRemaining = leftover?.totalRemaining ?? 0;

  const canUpgrade = totalRemaining > 0 && voucher.type === "discount" &&
    ["won", "issued", "eligible"].includes(voucher.status);

  async function handleUpgrade() {
    setLoading(true);
    try {
      const res = await adminPost<{ code: string; vendorId: string; vendorName: string }>(
        `/api/admin/vouchers/${encodeURIComponent(voucher.code)}/upgrade`,
        { vendorId: selectedVendorId || undefined }
      );
      toast(`Voucher upgraded to free (${res.vendorName}).`, "success");
      onUpgraded(voucher.code, res.vendorId, res.vendorName);
    } catch (err) {
      toast(err instanceof AdminFetchError ? err.message : "Upgrade failed.", "error");
    } finally {
      setLoading(false);
    }
  }



  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--line)] px-6 py-4">
          <h3 className="font-semibold text-[var(--ink)]" style={{ fontFamily: "var(--font-display)" }}>
            Voucher details
          </h3>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--mute)] hover:bg-[var(--grey-100)] hover:text-[var(--ink)] transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Voucher info */}
        <div className="px-6 py-5 space-y-4">

          <div className="flex items-center justify-between">
            <span className="font-mono text-lg font-bold tracking-widest text-[var(--ink)]">
              {voucher.codeMasked}
            </span>
            {(() => {
              const b = STATUS_BADGE[voucher.status] ?? { variant: "info" as const, label: voucher.status };
              return <Badge variant={b.variant}>{b.label}</Badge>;
            })()}
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl bg-[var(--grey-50)] p-4 text-sm">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--mute)]">Participant</p>
              <p className="mt-0.5 font-medium text-[var(--ink)]">{voucher.participantName}</p>
              <p className="text-xs text-[var(--mute)]">{voucher.participantEmail}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--mute)]">Phone</p>
              <p className="mt-0.5 text-[var(--ink)]">{voucher.participantPhone ?? "—"}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--mute)]">Vendor</p>
              <p className="mt-0.5 text-[var(--ink)]">{voucher.vendorName ?? "—"}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--mute)]">Type</p>
              <p className="mt-0.5">
                {voucher.type === "free"
                  ? <Badge variant="ok">Free</Badge>
                  : voucher.type === "discount"
                    ? <Badge variant="info">{voucher.discountPct}% off</Badge>
                    : <span className="text-[var(--mute)]">—</span>
                }
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--mute)]">Issued</p>
              <p className="mt-0.5 text-xs text-[var(--ink)]">{fmtTs(voucher.issuedAt)}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--mute)]">Redeemed</p>
              <p className="mt-0.5 text-xs text-[var(--ink)]">{fmtTs(voucher.redeemedAt)}</p>
            </div>
          </div>

          {/* Upgrade section */}
          {voucher.type === "discount" && (
            <div className={`rounded-xl border p-4 ${canUpgrade ? "border-[var(--forest)]/30 bg-[var(--forest)]/5" : "border-[var(--line)] bg-[var(--grey-50)]"}`}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--ink)]">
                    Upgrade to free voucher
                  </p>
                  {canUpgrade ? (
                    <p className="mt-0.5 text-xs text-[var(--ink-soft)]">
                      {totalRemaining} free {totalRemaining === 1 ? "slot" : "slots"} available across {vendorsWithSlots.length} {vendorsWithSlots.length === 1 ? "vendor" : "vendors"}.
                    </p>
                  ) : (
                    <p className="mt-0.5 text-xs text-[var(--mute)]">
                      {totalRemaining <= 0
                        ? "No free slots remaining in this cycle."
                        : `Cannot upgrade a voucher with status "${voucher.status}".`
                      }
                    </p>
                  )}
                </div>
                <span className="text-2xl shrink-0">🎁</span>
              </div>

              {canUpgrade && (
                <>
                  {/* Per-vendor slot breakdown */}
                  <div className="mb-3 space-y-1.5">
                    {vendorsWithSlots.map((v: VendorLeftover) => (
                      <label
                        key={v.vendorId}
                        className={`
                        flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 transition-all
                        ${selectedVendorId === v.vendorId
                            ? "border-[var(--forest)] bg-white"
                            : "border-[var(--line)] bg-white hover:border-[var(--grey-200)]"
                          }
                      `}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="vendorSelect"
                            value={v.vendorId}
                            checked={selectedVendorId === v.vendorId}
                            onChange={() => setSelectedVendorId(v.vendorId)}
                            className="accent-[var(--forest)]"
                          />
                          <span className="text-sm font-medium text-[var(--ink)]">{v.vendorName}</span>
                        </div>
                        <span className="text-xs text-[var(--ink-soft)]">
                          {v.remaining} / {v.allocated} slots left
                        </span>
                      </label>
                    ))}
                    {vendorsWithSlots.length > 1 && (
                      <label
                        className={`
                        flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 transition-all
                        ${selectedVendorId === ""
                            ? "border-[var(--forest)] bg-white"
                            : "border-[var(--line)] bg-white hover:border-[var(--grey-200)]"
                          }
                      `}
                      >
                        <input
                          type="radio"
                          name="vendorSelect"
                          value=""
                          checked={selectedVendorId === ""}
                          onChange={() => setSelectedVendorId("")}
                          className="accent-[var(--forest)]"
                        />
                        <span className="text-sm text-[var(--ink-soft)]">Auto-assign vendor</span>
                      </label>
                    )}
                  </div>

                  <button
                    onClick={handleUpgrade}
                    disabled={loading}
                    className="
                    w-full rounded-xl bg-[var(--forest)] px-4 py-2.5
                    text-sm font-semibold text-white transition-all
                    hover:opacity-90 active:scale-[0.98] disabled:opacity-50
                  "
                  >
                    {loading ? "Upgrading…" : "Upgrade to free"}
                  </button>
                </>
              )}
            </div>
          )}

          {/* Already free */}
          {voucher.type === "free" && (
            <div className="rounded-xl border border-[var(--forest)]/30 bg-[var(--forest)]/5 px-4 py-3 text-sm text-[var(--forest)]">
              ✓ This is already a free voucher.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


export default function VouchersPage() {
  const { toast } = useToast();
  const [rows, setRows] = useState<VoucherRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<VoucherRow | null>(null);
  const [freeLeftover, setFreeLeftover] = useState<Record<string, LeftoverResponse>>({});



  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminGet<VoucherRow[]>("/api/admin/vouchers");
      setRows(data);

      // Compute free-slot headroom per cycle client-side from the loaded rows.
      // We don't have vendorOptIn totals here, so fetch them from a separate
      // endpoint. For now we store the count of existing free vouchers per cycle
      // and let the server validate headroom on upgrade.
      const leftovers: Record<string, LeftoverResponse> = {};
      const cyclesWithDiscount = [...new Set(
        data.filter((r) => r.type === "discount").map((r) => r.cycleId)
      )];

      await Promise.all(cyclesWithDiscount.map(async (cycleId) => {
        try {
          const res = await adminGet<LeftoverResponse>(
            `/api/admin/vouchers/leftover?cycleId=${encodeURIComponent(cycleId)}`
          );
          leftovers[cycleId] = res;
        } catch {
          leftovers[cycleId] = { cycleId, totalAllocated: 0, totalIssued: 0, totalRemaining: 0, vendors: [] };
        }
      }));

      setFreeLeftover(leftovers);
    } catch (err) {
      toast(err instanceof AdminFetchError ? err.message : "Failed to load vouchers.", "error");
    } finally {
      setLoading(false);
    }
  }, []);


  useEffect(() => { loadData(); }, [loadData]);


  function handleUpgraded(code: string, vendorId: string, vendorName: string) {
    setRows((prev) =>
      prev.map((r) =>
        r.code === code
          ? { ...r, type: "free", discountPct: null, vendorId, vendorName }
          : r
      )
    );
    setSelected((prev) =>
      prev?.code === code
        ? { ...prev, type: "free", discountPct: null, vendorId, vendorName }
        : prev
    );
    if (selected) {
      setFreeLeftover((prev) => {
        const cycleLeftover = prev[selected.cycleId];
        if (!cycleLeftover) return prev;
        return {
          ...prev,
          [selected.cycleId]: {
            ...cycleLeftover,
            totalIssued: cycleLeftover.totalIssued + 1,
            totalRemaining: Math.max(0, cycleLeftover.totalRemaining - 1),
            vendors: cycleLeftover.vendors.map((v) => v),
          },
        };
      });
    }
  }

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
          headers={["Code", "Participant", "Phone", "Vendor", "Type", "Status", "Issued", "Redeemed", ""]}
          loading={loading}
          empty={!loading && filtered.length === 0}
          emptyMessage="No vouchers found."
          emptyIcon="🎟️"
        >
          {filtered.map((row) => {
            const badge = STATUS_BADGE[row.status] ?? { variant: "info" as const, label: row.status };
            const upgradeable = row.type === "discount" &&
              ["won", "issued", "eligible"].includes(row.status) &&
              (freeLeftover[row.cycleId]?.totalRemaining ?? 0) > 0;

            return (
              <Tr
                key={row.code}
              // onClick={() => setSelected(row)}
              // className="cursor-pointer hover:bg-[var(--grey-50)] transition-colors"
              >
                <Td>
                  <span className="font-mono text-sm font-semibold text-[var(--blue)]">
                    {row.codeMasked}
                  </span>
                </Td>
                <Td>
                  <p className="font-medium text-[var(--ink)]">{row.participantName}</p>
                  <p className="text-xs text-[var(--mute)]">{row.participantEmail}</p>
                </Td>
                <Td>{row.participantPhone ?? "—"}</Td>
                <Td>{row.vendorName ?? <span className="text-[var(--mute)]">—</span>}</Td>
                <Td>
                  <div className="flex items-center gap-1.5">
                    {row.type === "free"
                      ? <Badge variant="ok">Free</Badge>
                      : row.type === "discount"
                        ? <Badge variant="info">{row.discountPct}% off</Badge>
                        : <span className="text-[var(--mute)]">—</span>
                    }
                    {upgradeable && (
                      <span title="Free upgrade available" className="text-sm">⬆️</span>
                    )}
                  </div>
                </Td>
                <Td><Badge variant={badge.variant}>{badge.label}</Badge></Td>
                <Td className="text-xs text-[var(--ink-soft)]">{fmtTs(row.issuedAt)}</Td>
                <Td className="text-xs text-[var(--ink-soft)]">{fmtTs(row.redeemedAt)}</Td>
                <Td className="text-xs text-[var(--ink-soft)]">
                  <button className="text-[var(--blue)]" onClick={() => setSelected(row)}>View</button>
                </Td>
              </Tr>
            );
          })}
        </Table>
      </Panel>

      {/* Modal */}
      {selected && (
        <UpgradeModal
          voucher={selected}
          leftover={freeLeftover[selected.cycleId] ?? null}
          onClose={() => setSelected(null)}
          onUpgraded={handleUpgraded}
        />
      )}
    </>
  );
}


