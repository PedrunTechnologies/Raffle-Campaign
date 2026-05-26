"use client";

import Link from "next/link";
import Button from "@/components/ui/Button";
import { Panel, Badge, Table, Tr, Td, PageHeader, FormField } from "@/components/admin/AdminUI";
import { useEffect, useState } from "react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { useParams } from "next/navigation";
import { HiOutlineArrowLeft } from "react-icons/hi";
import type { CycleRecord, TaskRecord, CycleStatus } from "@/lib/types";

const STATUS_BADGE: Record<CycleStatus, { variant: "ok" | "pending" | "info"; label: string }> = {
  draft:     { variant: "info",    label: "Draft"     },
  started:   { variant: "ok",      label: "Live"      },
  completed: { variant: "pending", label: "Completed" },
};

function fmtTs(ts: { _seconds: number } | null | undefined): string {
  if (!ts) return "—";
  return new Date(ts._seconds * 1000).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function CycleDetailPage() {
  const { user }  = useAdminAuth();
  const params    = useParams();
  const id        = params.id as string;

  const [cycle,   setCycle]   = useState<CycleRecord | null>(null);
  const [tasks,   setTasks]   = useState<TaskRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    if (!user) return;
    user.getIdToken().then(async (token) => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [cycleRes, tasksRes] = await Promise.all([
          fetch(`/api/admin/cycles/${id}`, { headers }),
          fetch("/api/admin/tasks", { headers }),
        ]);
        const cycleData = await cycleRes.json() as CycleRecord;
        const allTasks  = await tasksRes.json() as TaskRecord[];
        setCycle(cycleData);
        setTasks(allTasks.filter((t) => cycleData.taskIds.includes(t.id)));
      } catch {
        setError("Failed to load cycle.");
      } finally {
        setLoading(false);
      }
    });
  }, [user, id]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-[var(--ink-soft)]">Loading cycle…</p>
      </div>
    );
  }

  if (!cycle || error) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-[var(--blue)]">{error || "Cycle not found."}</p>
      </div>
    );
  }

  const sb       = STATUS_BADGE[cycle.status];
  const isLive   = cycle.status === "started";
  const isDone   = cycle.status === "completed";
  const canEdit  = !isDone;

  const totalFree     = cycle.vendorOptIns.reduce((s, v) => s + v.freeVouchers, 0);
  const totalDiscount = cycle.vendorOptIns.reduce(
    (s, v) => s + v.discountTiers.reduce((ss, t) => ss + t.quantity, 0), 0
  );

  return (
    <>
      <Link
        href="/admin/cycles"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[var(--ink-soft)] hover:text-[var(--ink)]"
      >
        <HiOutlineArrowLeft size={15} />
        All cycles
      </Link>

      <PageHeader
        title={<>Cycle <em className="italic text-[var(--blue)]">#{cycle.cycleNumber}</em></>}
        sub={isDone ? "Completed — read only." : isLive ? "Live now — limited fields editable." : "Draft — all fields editable."}
      >
        {canEdit && (
          <Link href={`/admin/cycle-control?id=${cycle.id}`}>
            <Button>{isLive ? "Manage live cycle" : "Edit draft"}</Button>
          </Link>
        )}
      </PageHeader>

      {/* Status badges */}
      <div className="mb-6 flex flex-wrap gap-3">
        <div className="inline-flex items-center gap-2 rounded-2xl border border-[var(--line)] bg-white px-4 py-2.5">
          <span className="text-sm font-medium text-[var(--ink)]">Status</span>
          <Badge variant={sb.variant}>{sb.label}</Badge>
        </div>
        <div className="inline-flex items-center gap-2 rounded-2xl border border-[var(--line)] bg-white px-4 py-2.5">
          <span className="text-sm font-medium text-[var(--ink)]">Tasks</span>
          <span className="font-mono text-sm font-semibold">{cycle.taskIds.length}</span>
        </div>
        <div className="inline-flex items-center gap-2 rounded-2xl border border-[var(--line)] bg-white px-4 py-2.5">
          <span className="text-sm font-medium text-[var(--ink)]">Voucher pool</span>
          <span className="font-mono text-sm font-semibold">{totalFree + totalDiscount}</span>
        </div>
        <div className="inline-flex items-center gap-2 rounded-2xl border border-[var(--line)] bg-white px-4 py-2.5">
          <span className="text-sm font-medium text-[var(--ink)]">Winners</span>
          <span className="font-mono text-sm font-semibold">{cycle.winnersCount}</span>
        </div>
      </div>

      <div className="max-w-3xl space-y-5">

        {/* Timing */}
        <Panel title="Timing">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="Window opened"
              value={isLive || isDone ? fmtTs(cycle.windowOpen as unknown as { _seconds: number } | null) : "Not started yet"}
              hint={isLive || isDone ? "Set to server time at start — immutable" : undefined}
            />
            <FormField
              label="Window closes"
              value={fmtTs(cycle.windowClose as unknown as { _seconds: number })}
            />
            <FormField label="Cooldown"   value={`${cycle.cooldownHours} hours`} />
            <FormField label="Created"    value={fmtTs(cycle.createdAt as unknown as { _seconds: number })} />
          </div>
        </Panel>

        {/* Draw */}
        <Panel title="Draw parameters">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Winners"              value={String(cycle.winnersCount)} />
            <FormField label="Min tasks to qualify" value={String(cycle.minTasksToQualify)} />
          </div>
          {isDone && cycle.drawLogId && (
            <div className="mt-4 rounded-xl border border-[var(--line)] bg-[var(--grey-50)] px-4 py-3 text-sm">
              Draw completed ·{" "}
              <Link
                href={`/admin/draw-logs`}
                className="font-medium text-[var(--blue)] underline underline-offset-2"
              >
                View draw log
              </Link>
            </div>
          )}
        </Panel>

        {/* Tasks */}
        <Panel title={`Tasks assigned (${tasks.length})`} noPadding>
          {tasks.length === 0 ? (
            <p className="px-5 py-4 text-sm text-[var(--ink-soft)]">No tasks assigned.</p>
          ) : (
            <Table headers={["Platform", "Type", "Description", "Target"]}>
              {tasks.map((t) => (
                <Tr key={t.id}>
                  <Td className="capitalize">{t.platform}</Td>
                  <Td className="capitalize">{t.taskType.replace(/_/g, " ")}</Td>
                  <Td className="text-[var(--ink-soft)]">{t.description}</Td>
                  <Td>
                    <a
                      href={t.targetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-[var(--blue)] hover:underline"
                    >
                      {new URL(t.targetUrl).hostname}
                    </a>
                  </Td>
                </Tr>
              ))}
            </Table>
          )}
        </Panel>

        {/* Vendor opt-ins */}
        <Panel
          title={`Vendor opt-ins (${cycle.vendorOptIns.length})`}
          right={`${totalFree} free · ${totalDiscount} discounted`}
          noPadding
        >
          {cycle.vendorOptIns.length === 0 ? (
            <p className="px-5 py-4 text-sm text-[var(--ink-soft)]">
              No vendor opt-ins yet.
            </p>
          ) : (
            <Table headers={["Vendor", "Free vouchers", "Discount tiers", "Total"]}>
              {cycle.vendorOptIns.map((v) => {
                const discTotal = v.discountTiers.reduce((s, t) => s + t.quantity, 0);
                return (
                  <Tr key={v.vendorId}>
                    <Td>{v.vendorName}</Td>
                    <Td mono>{v.freeVouchers}</Td>
                    <Td>
                      {v.discountTiers.length === 0
                        ? <span className="text-[var(--mute)]">—</span>
                        : v.discountTiers.map((t, i) => (
                          <span key={i} className="mr-2 rounded-md bg-[var(--grey-100)] px-2 py-0.5 font-mono text-[11px]">
                            {t.quantity}×{t.percentage}%
                          </span>
                        ))
                      }
                    </Td>
                    <Td mono>{v.freeVouchers + discTotal}</Td>
                  </Tr>
                );
              })}
            </Table>
          )}
        </Panel>

        {/* Immutability notice for completed */}
        {isDone && (
          <div className="rounded-2xl border border-[var(--line)] bg-white px-5 py-4">
            <p className="text-xs text-[var(--ink-soft)]">
              <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--grey-200)] text-[10px] font-bold text-[var(--ink)]">
                ✓
              </span>
              <strong className="text-[var(--ink)]">Completed and sealed.</strong>{" "}
              This cycle is fully immutable. All fields are read-only.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
