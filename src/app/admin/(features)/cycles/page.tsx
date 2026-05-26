"use client";

import Link from "next/link";
import Button from "@/components/ui/Button";
import { Panel, Badge, Table, Tr, Td, PageHeader } from "@/components/admin/AdminUI";
import { useCallback, useEffect, useState } from "react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import type { CycleRecord, CycleStatus } from "@/lib/types";
import { adminGet } from "@/lib/admin-fetch";

/* ── helpers ──────────────────────────────────────────────────────── */

const STATUS_BADGE: Record<CycleStatus, { variant: "ok" | "pending" | "info"; label: string }> = {
  draft: { variant: "info", label: "Draft" },
  started: { variant: "ok", label: "Live" },
  completed: { variant: "pending", label: "Completed" },
};

function fmtTs(ts: { _seconds: number } | null): string {
  if (!ts) return "—";
  return new Date(ts._seconds * 1000).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

/* ── page ─────────────────────────────────────────────────────────── */

export default function CyclesPage() {
  const { user } = useAdminAuth();
  const [cycles, setCycles] = useState<CycleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [startedCycles] = await Promise.all([
        adminGet<CycleRecord[]>("/api/admin/cycles"),
      ]);

      setCycles(startedCycles);

    } catch (err) {
      console.error("[cycle-control] loadData:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const live = cycles.find((c) => c.status === "started");
  const drafts = cycles.filter((c) => c.status === "draft");
  const completed = cycles.filter((c) => c.status === "completed");

  return (
    <>
      <PageHeader
        title={<>All <em className="italic text-[var(--blue)]">cycles</em></>}
        sub="Full history of every cycle. Click a row to view details or edit a draft."
      >
        <Link href="/admin/cycle-control">
          <Button>
            {live ? `Manage live #${live.cycleNumber}` : "New cycle"}
          </Button>
        </Link>
      </PageHeader>

      {/* Summary strip */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total cycles", value: String(cycles.length) },
          { label: "Live now", value: live ? "1" : "0" },
          { label: "Drafts", value: String(drafts.length) },
          { label: "Completed", value: String(completed.length) },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-[var(--line)] bg-white p-4">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-[var(--mute)]">
              {s.label}
            </p>
            <p
              className="text-3xl font-light tracking-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {loading ? "—" : s.value}
            </p>
          </div>
        ))}
      </div>

      <Panel title="Cycle history" noPadding>
        {loading ? (
          <div className="px-5 py-10 text-center text-sm text-[var(--ink-soft)]">
            Loading cycles…
          </div>
        ) : error ? (
          <div className="px-5 py-10 text-center text-sm text-[var(--blue)]">{error}</div>
        ) : cycles.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="mb-2 text-sm font-semibold text-[var(--ink)]">No cycles yet</p>
            <p className="mb-4 text-sm text-[var(--ink-soft)]">
              Create your first cycle from the cycle control page.
            </p>
            <Link href="/admin/cycle-control">
              <Button>New cycle</Button>
            </Link>
          </div>
        ) : (
          <Table headers={["Cycle", "Status", "Window opened", "Window closes", "Tasks", "Estimated pool", ""]}>
            {cycles.map((c) => {
              const sb = STATUS_BADGE[c.status];
              return (
                <Tr key={c.id}>
                  <Td>
                    <Link
                      href={`/admin/cycles/${c.id}`}
                      className="font-mono font-semibold text-[var(--ink)] hover:text-[var(--blue)] transition-colors"
                    >
                      #{c.cycleNumber}
                    </Link>
                  </Td>
                  <Td>
                    <Badge variant={sb.variant}>{sb.label}</Badge>
                  </Td>
                  <Td className="whitespace-nowrap text-[var(--ink-soft)]">
                    {fmtTs(c.windowOpen as unknown as { _seconds: number } | null)}
                  </Td>
                  <Td className="whitespace-nowrap text-[var(--ink-soft)]">
                    {fmtTs(c.windowClose as unknown as { _seconds: number })}
                  </Td>
                  <Td mono>{c.taskIds.length}</Td>
                  <Td mono>{c.estimatedPool}</Td>
                  <Td>
                    <Link
                      href={
                        c.status === "completed"
                          ? `/admin/cycles/${c.id}`
                          : `/admin/cycle-control?id=${c.id}`
                      }
                      className="text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors"
                    >
                      {c.status === "completed" ? "View" : "Edit"}
                    </Link>
                  </Td>
                </Tr>
              );
            })}
          </Table>
        )}
      </Panel>
    </>
  );
}
