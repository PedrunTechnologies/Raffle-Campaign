"use client";

import Button from "@/components/ui/Button";
import Link from "next/link";
import { Panel, Badge, Table, Tr, Td, PageHeader, KpiTile } from "@/components/admin/AdminUI";
import { useEffect, useState } from "react";
import { adminGet, AdminFetchError } from "@/lib/admin-fetch";



const STATUS_LABEL: Record<string, string> = {
  ok: "Completed", danger: "Error",
};






interface DrawLogRecord {
  id: string;
  cycleId: string;
  cycleNumber: number;
  executedAt: { _seconds: number };
  triggeredByName: string;
  eligiblePool: number;
  winnersCount: number;
  winnerCodes: string[];
  status: "completed" | "error";
  errorMessage?: string;
}

function fmtTs(ts: { _seconds: number } | null | undefined): string {
  if (!ts) return "—";
  return new Date(ts._seconds * 1000).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}







export default function DrawLogsPage() {
  const [logs, setLogs] = useState<DrawLogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    adminGet<DrawLogRecord[]>("/api/admin/draw-logs")
      .then((data) => { setLogs(data); setLoading(false); })
      .catch((err) => {
        setError(err instanceof AdminFetchError ? err.message : "Failed to load draw logs.");
        setLoading(false);
      });
  }, []);

  /* ── summary stats ─────────────────────────────────────────────── */
  const completed = logs.filter((l) => l.status === "completed");
  const errors = logs.filter((l) => l.status === "error");
  const avgPool = completed.length
    ? Math.round(completed.reduce((s, l) => s + l.eligiblePool, 0) / completed.length)
    : 0;

  return (
    <>
      <PageHeader
        title={<>Draw <em className="italic text-[var(--blue)]">logs</em></>}
        sub="Immutable record of every draw. Each result is cryptographically sealed."
      >
      </PageHeader>

      {/* Summary strip */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total draws", value: String(logs.length) },
          { label: "Completed", value: String(completed.length) },
          { label: "Errors", value: String(errors.length) },
          { label: "Avg pool size", value: avgPool ? String(avgPool) : "—" },
        ].map((s) => (
          <KpiTile
            key={s.label}
            label={s.label}
            value={loading ? "—" : s.value}
            detail=""
          />
        ))}
      </div>

      <Panel title="All draw logs" noPadding>
        {error ? (
          <div className="px-5 py-10 text-center text-sm text-[var(--blue)]">{error}</div>
        ) : (!loading && logs.length === 0) ? (
          <div className="px-5 py-14 text-center">
            <p className="mb-1 text-sm font-semibold text-[var(--ink)]">No draws yet</p>
            <p className="mb-4 text-sm text-[var(--ink-soft)]">
              Draw logs appear here after the first draw is triggered.
            </p>
            <Link href="/admin/draw"><Button>Trigger draw</Button></Link>
          </div>
        ) : (
          <div>
            <Table loading={loading} headers={["Draw ID", "Cycle", "Executed at", "Pool", "Winners", "Triggered by", "Status", ""]}>
              {logs.map((log) => (
                <>
                  <Tr key={log.id}>
                    <Td mono className="text-[var(--ink-soft)] text-[11px]">
                      {log.id.slice(0, 16)}…
                    </Td>
                    <Td>
                      <Link
                        href={`/admin/cycles/${log.cycleId}`}
                        className="font-mono font-semibold text-[var(--ink)] hover:text-[var(--blue)] transition-colors"
                      >
                        #{log.cycleNumber}
                      </Link>
                    </Td>
                    <Td className="whitespace-nowrap text-[var(--ink-soft)]">
                      {fmtTs(log.executedAt)}
                    </Td>
                    <Td mono>{log.eligiblePool}</Td>
                    <Td mono>{log.winnersCount}</Td>
                    <Td className="text-[var(--ink-soft)]">{log.triggeredByName}</Td>
                    <Td>
                      <Badge variant={log.status === "completed" ? "ok" : "danger"}>
                        {log.status === "completed" ? "Completed" : "Error"}
                      </Badge>
                    </Td>
                    <Td>
                      <button
                        onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                        className="text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors text-xs font-medium"
                      >
                        {expanded === log.id ? "Hide ↑" : "Details ↓"}
                      </button>
                    </Td>
                  </Tr>

                  {/* Expanded row — winner codes + error if any */}
                  {expanded === log.id && (
                    <tr key={`${log.id}-expanded`} className="bg-[var(--grey-50)]">
                      <td colSpan={8} className="px-5 py-4">
                        {log.status === "error" ? (
                          <p className="text-sm text-[var(--blue)]">
                            <strong>Error:</strong> {log.errorMessage ?? "Unknown error"}
                          </p>
                        ) : (
                          <div>
                            {/* <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-[var(--mute)]">
                              Winner voucher{log.winnerCodes.length > 1 ? "s" : ""}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {log.winnerCodes.map((code) => (
                                <span
                                  key={code}
                                  className="rounded-lg bg-[var(--lime)] px-3 py-1.5 font-mono text-xs font-semibold text-[var(--lime-ink)]"
                                >
                                  {code}
                                </span>
                              ))}
                            </div> */}
                            <p className="mt-2 text-xs text-[var(--ink-soft)]">
                              Full Draw ID: <span className="font-mono">{log.id}</span>
                            </p>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </Table>
          </div>
        )}
      </Panel>

      {/* Integrity note */}
      <div className="mt-5 rounded-2xl border border-[var(--line)] bg-white px-5 py-4">
        <p className="text-xs text-[var(--ink-soft)]">
          <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--blue)] text-[10px] font-bold text-white">
            i
          </span>
          <strong className="text-[var(--ink)]">Integrity guarantee:</strong>{" "}
          Each draw uses a cryptographic Fisher-Yates shuffle seeded from{" "}
          <code className="rounded bg-[var(--grey-100)] px-1.5 py-0.5 font-mono text-[11px]">crypto.getRandomValues</code>.
          Records cannot be edited after commit — only queried.
        </p>
      </div>
    </>
  );
}
