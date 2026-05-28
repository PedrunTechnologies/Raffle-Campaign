"use client";

import Button from "@/components/ui/Button";
import { Panel, Badge, PageHeader } from "@/components/admin/AdminUI";
import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { CycleRecord, TaskRecord } from "@/lib/types";
import { adminGet, adminPost, adminPatch, AdminFetchError } from "@/lib/admin-fetch";
import { toInputValue, toDisplayTime } from "@/lib/helpers";
import { Suspense } from "react";


const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Ig", facebook: "Fb", x: "X", tiktok: "Tt",
};

const TYPE_LABELS: Record<string, string> = {
  follow: "Follow", share: "Share", like: "Like", comment: "Comment",
  like_and_comment: "Like & Comment", repost: "Repost",
  tag_friends: "Tag Friends", story_share: "Story Share",
};

/* ── row sub-components ───────────────────────────────────────────── */

function FieldRow({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>;
}

function FieldWrap({
  label, locked, hint, children,
}: {
  label: string; locked?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-semibold uppercase tracking-widest text-[var(--mute)]">
          {label}
        </label>
        {locked && (
          <span className="rounded-md bg-[var(--grey-100)] px-2 py-0.5 text-[10px] font-semibold text-[var(--mute)]">
            Locked
          </span>
        )}
      </div>
      {children}
      {hint && <p className="text-xs text-[var(--ink-soft)]">{hint}</p>}
    </div>
  );
}

function TextInput({
  value, onChange, type = "text", locked, placeholder,
}: {
  value: string; onChange: (v: string) => void;
  type?: string; locked?: boolean; placeholder?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      disabled={locked}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`
        w-full rounded-xl border px-3.5 py-3 text-sm outline-none transition-all
        ${locked
          ? "cursor-not-allowed border-[var(--line)] bg-[var(--grey-100)] text-[var(--mute)]"
          : "border-[var(--line)] bg-[var(--grey-50)] text-[var(--ink)] focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/10"
        }
      `}
    />
  );
}

type ModalAction = "start" | "close" | null;

/* ── page ─────────────────────────────────────────────────────────── */

function CycleControlContent() {
  const sp = useSearchParams();
  const qid = sp.get("id"); // optional ?id= from cycles list

  /* ── remote state ── */
  const [cycle, setCycle] = useState<CycleRecord | null>(null);
  const [allTasks, setAllTasks] = useState<TaskRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingModal, setLoadingModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState<ModalAction>(null);
  const [actionErr, setActionErr] = useState("");
  const [saveErr, setSaveErr] = useState("");
  const [saved, setSaved] = useState(false);

  /* ── editable form state ── */
  const [windowClose, setWindowClose] = useState("");
  const [cooldownHours, setCooldownHours] = useState("20");
  const [winnersCount, setWinnersCount] = useState("1");
  const [minTasksToQualify, setMinTasksToQualify] = useState("1");
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  const [estimatedPool, setEstimatedPool] = useState("");
  const [windowOpen, setWindowOpen] = useState("");


  /* ── loaders ── */
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [allTasksData, startedCycles] = await Promise.all([
        adminGet<TaskRecord[]>("/api/admin/tasks"),
        adminGet<CycleRecord[]>("/api/admin/cycles?status=started"),
      ]);

      setAllTasks(allTasksData);

      // Priority: ?id= param → any started cycle → latest draft → null
      let target: CycleRecord | null = null;
      if (qid) {
        target = await adminGet<CycleRecord>(`/api/admin/cycles/${qid}`);
      } else if (startedCycles.length > 0) {
        target = startedCycles[0];
      } else {
        const drafts = await adminGet<CycleRecord[]>("/api/admin/cycles?status=draft");
        if (drafts.length > 0) target = drafts[0];
      }

      setCycle(target);
      if (target) {
        setWindowOpen(toInputValue(target.windowOpen as unknown as { _seconds: number }));
        setWindowClose(toInputValue(target.windowClose as unknown as { _seconds: number }));
        setCooldownHours(String(target.cooldownHours));
        setEstimatedPool(String(target.estimatedPool));
        setMinTasksToQualify(String(target.minTasksToQualify));
        setSelectedTaskIds(target.taskIds);
      }
    } catch (err) {
      console.error("[cycle-control] loadData:", err);
    } finally {
      setLoading(false);
    }
  }, [qid]);

  useEffect(() => { loadData(); }, [loadData]);

  const isStarted = cycle?.status === "started";
  const isCompleted = cycle?.status === "completed";
  const isReadOnly = isCompleted;

  /* ── task toggle ── */
  function toggleTask(id: string) {
    setSelectedTaskIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
    setSaved(false);
  }

  /* ── save (create or update) ── */
  async function handleSave() {
    setSaveErr(""); setSaving(true); setSaved(false);

    const payload = {
      windowOpen: windowOpen ? new Date(windowOpen).toISOString() : undefined,
      windowClose: windowClose ? new Date(windowClose).toISOString() : undefined,
      cooldownHours: Number(cooldownHours),
      taskIds: selectedTaskIds,
      minTasksToQualify: Number(minTasksToQualify),
      estimatedPool: Number(estimatedPool),
    };

    console.log(payload);
    console.log(cycle)

    try {
      if (!cycle) {
        await adminPost("/api/admin/cycles", payload);
      } else {
        await adminPatch(`/api/admin/cycles/${cycle.id}`, payload);
      }
      setSaved(true);
      await loadData();
    } catch (err) {
      console.log(err)
      setSaveErr(err instanceof AdminFetchError ? err.message : "Network error. Try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAction(action: ModalAction) {
    if (!cycle || !action) return;
    setActionErr("");

    try {
      setLoadingModal(true);
      await adminPost(`/api/admin/cycles/${cycle.id}/${action}`, {});
      setModal(null);
      await loadData();
    } catch (err) {
      setActionErr(err instanceof AdminFetchError ? err.message : "Network error. Try again.");
    } finally {
      setLoadingModal(false);
    }
  }

  /* ── render ───────────────────────────────────────────────────────── */

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-[var(--ink-soft)]">Loading cycle data…</p>
      </div>
    );
  }

  const cycleLabel = cycle ? ` Cycle #${cycle.cycleNumber}` : " New Cycle";

  const statusBadge = cycle
    ? {
      started: { variant: "ok" as const, label: "Live" },
      draft: { variant: "info" as const, label: "Draft" },
      completed: { variant: "pending" as const, label: "Completed" },
    }[cycle.status]
    : null;

  return (
    <>
      <PageHeader
        title={
          <>
            {/* {cycle ? "Cycle " : "New "} */}
            Configure
            <em className="italic text-[var(--blue)]">{cycleLabel}</em>
          </>
        }
        sub={
          isCompleted
            ? "This cycle has completed. View-only."
            : isStarted
              ? "Live — window open, close time and tasks editable."
              : cycle
                ? "Draft — all fields editable until started."
                : "No active or draft cycle found. Fill in the form to create one."
        }
      >
        {/* Status badge */}
        {statusBadge && (
          <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
        )}
        <Link href="/admin/cycles">
          <Button variant="ghost">All cycles</Button>
        </Link>
        {/* Start / Close buttons */}
        {cycle?.status === "draft" && (
          <Button onClick={() => { setActionErr(""); setModal("start"); }}>
            Start cycle
          </Button>
        )}
        {cycle?.status === "started" && (
          <Button variant="ghost" onClick={() => { setActionErr(""); setModal("close"); }}>
            Close cycle
          </Button>
        )}
      </PageHeader>


      <div className="max-w-3xl space-y-5">

        {/* ── Timing ── */}
        <Panel title="Window timing">
          <div className="space-y-4">
            <FieldRow>
              <FieldWrap
                label="Window opens"
                locked={isStarted || isCompleted}
                // locked={isCompleted}
                hint="Participants can begin completing tasks from this time"
              >
                <TextInput
                  type="datetime-local"
                  value={windowOpen}
                  onChange={setWindowOpen}
                  locked={isStarted || isCompleted}
                // locked={isCompleted}
                />
              </FieldWrap>

              <FieldWrap
                label="Window closes / draw time"
                locked={isCompleted}
                hint="Participants can complete tasks until this time"
              >
                <TextInput
                  type="datetime-local"
                  value={windowClose}
                  onChange={setWindowClose}
                  locked={isCompleted}
                />
              </FieldWrap>
            </FieldRow>

            <FieldRow>
              <FieldWrap
                label="Cooldown (hours)"
                locked={isStarted || isCompleted}
                hint="Gap before next cycle can start"
              >
                <TextInput
                  type="number"
                  value={cooldownHours}
                  onChange={setCooldownHours}
                  locked={isStarted || isCompleted}
                  placeholder="20"
                />
              </FieldWrap>
              <FieldWrap
                label="Estimated reward pool"
                locked={isCompleted}
                hint="Used internally for budgeting and projections"
              >
                <TextInput
                  type="number"
                  value={estimatedPool}
                  onChange={setEstimatedPool}
                  locked={isCompleted}
                  placeholder="50000"
                />
              </FieldWrap>
            </FieldRow>
          </div>
        </Panel>

        {/* ── Tasks ── */}
        <Panel title="Task selection">
          <p className="mb-4 text-sm text-[var(--ink-soft)]">
            {isCompleted
              ? "Tasks used in this cycle."
              : "Select tasks participants must complete to receive a voucher."
            }
          </p>

          {allTasks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--grey-200)] px-5 py-6 text-center">
              <p className="mb-2 text-sm font-medium text-[var(--ink)]">No tasks created yet</p>
              <Link href="/admin/tasks/new">
                <Button variant="ghost">Create a task first</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {/* {console.log(allTasks)} */}
              {allTasks.map((task) => {
                const selected = selectedTaskIds.includes(task.id);
                return (
                  <button
                    key={task.id}
                    type="button"
                    disabled={isReadOnly}
                    onClick={() => !isReadOnly && toggleTask(task.id)}
                    className={`
                      flex w-full items-center gap-4 rounded-2xl border px-4 py-3.5
                      text-left transition-all
                      ${selected
                        ? "border-[var(--ink)] bg-[var(--ink)] text-white"
                        : "border-[var(--line)] bg-white hover:border-[var(--grey-200)]"
                      }
                      ${isReadOnly ? "cursor-default" : ""}
                    `}
                  >
                    {/* Checkbox indicator */}
                    <div
                      className={`
                        flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2
                        ${selected
                          ? "border-white bg-white"
                          : "border-[var(--grey-200)] bg-transparent"
                        }
                      `}
                    >
                      {selected && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4l3 3 5-6" stroke="var(--ink)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>

                    {/* Platform chip */}
                    <span
                      className={`
                        shrink-0 rounded-lg px-2 py-0.5 text-[11px] font-bold
                        ${selected ? "bg-white/15 text-white" : "bg-[var(--grey-100)] text-[var(--ink-soft)]"}
                      `}
                    >
                      {PLATFORM_LABELS[task.platform] ?? task.platform}
                    </span>

                    {/* Labels */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${selected ? "text-white" : "text-[var(--ink)]"}`}>
                        {task.description}
                      </p>
                      <p className={`text-xs ${selected ? "text-white/60" : "text-[var(--ink-soft)]"}`}>
                        {TYPE_LABELS[task.taskType] ?? task.taskType} ·{" "}
                        <a
                          href={task.targetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className={selected ? "text-white/60 hover:text-white" : "text-[var(--blue)] hover:underline"}
                        >
                          {new URL(task.targetUrl).hostname}
                        </a>
                      </p>
                    </div>

                    {/* Used in N cycles */}
                    <span className={`text-xs ${selected ? "text-white/50" : "text-[var(--mute)]"}`}>
                      {task.cycleCount} cycle{task.cycleCount !== 1 ? "s" : ""}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Min tasks qualifier */}
          {!isCompleted && selectedTaskIds.length > 0 && (
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--grey-50)] px-4 py-3">
              <span className="text-sm text-[var(--ink-soft)]">
                Participants must complete
              </span>
              <input
                type="number"
                min={1}
                max={selectedTaskIds.length}
                value={minTasksToQualify}
                onChange={(e) => setMinTasksToQualify(e.target.value)}
                className="w-16 rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-center text-sm font-semibold outline-none focus:border-[var(--blue)]"
              />
              <span className="text-sm text-[var(--ink-soft)]">
                of {selectedTaskIds.length} task{selectedTaskIds.length !== 1 ? "s" : ""} to qualify
              </span>
            </div>
          )}
        </Panel>

        {/* ── Save / error ── */}
        {!isCompleted && (
          <>
            {saveErr && (
              <div className="rounded-2xl border border-[var(--blue)]/20 bg-[var(--blue)]/5 px-5 py-4 text-sm text-[var(--blue)]">
                {saveErr}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-white px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-[var(--ink)]">
                  {cycle
                    ? `Cycle #${cycle.cycleNumber} · ${selectedTaskIds.length} task${selectedTaskIds.length !== 1 ? "s" : ""} selected`
                    : `New cycle · ${selectedTaskIds.length} task${selectedTaskIds.length !== 1 ? "s" : ""} selected`
                  }
                </p>
                <p className="text-xs text-[var(--ink-soft)]">
                  {cycle ? "Changes will apply immediately." : "Saving will create a new draft cycle."}
                </p>
              </div>
              <div className="flex gap-2">
                {cycle && (
                  <Button variant="ghost" onClick={loadData}>
                    Discard
                  </Button>
                )}
                <Button
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? "Saving…" : saved ? "✓ Saved" : cycle ? "Save changes" : "Create cycle"}
                </Button>
              </div>
            </div>
          </>
        )}

        {/* ── Lock notice ── */}
        {!isCompleted && (
          <div className="rounded-2xl border border-[var(--line)] bg-white px-5 py-4">
            <p className="text-xs text-[var(--ink-soft)]">
              <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--blue)] text-[10px] font-bold text-white">
                i
              </span>
              <strong className="text-[var(--ink)]">
                {isStarted ? "Running:" : "Once started:"}
              </strong>{" "}
              {isStarted
                ? "Window open time is locked. You can update the close time, tasks, min tasks, and winner count."
                : "The window open time is set to the exact moment you click Start — the draft value is ignored. Close time, tasks, and winners remain editable throughout."}
            </p>
          </div>
        )}
      </div>

      {/* ── Start / Close confirmation modal ── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setModal(null)}
          />
          <div className="relative w-full max-w-sm rounded-2xl border border-[var(--line)] bg-white p-6 shadow-xl">
            <h3
              className="mb-2 text-lg font-medium"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {modal === "start" ? "Start cycle now?" : "Close this cycle?"}
            </h3>
            <p className="mb-5 text-sm text-[var(--ink-soft)]">
              {modal === "start"
                ? `Cycle #${cycle?.cycleNumber} will go live immediately. The window open time will be set to right now and cannot be changed.`
                : `Cycle #${cycle?.cycleNumber} will be marked as completed. This is permanent — all fields will become read-only.`
              }
            </p>

            {actionErr && (
              <p className="mb-4 rounded-xl border border-[var(--blue)]/20 bg-[var(--blue)]/5 px-4 py-3 text-sm text-[var(--blue)]">
                {actionErr}
              </p>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setModal(null)}
                className="flex-1 rounded-xl border border-[var(--line)] bg-[var(--grey-50)] py-2.5 text-sm font-medium hover:bg-[var(--grey-100)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction(modal)}
                disabled={loadingModal}
                className={`
                  flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-colors
                  ${modal === "start"
                    ? "bg-[var(--blue)] hover:bg-[var(--blue-dark)]"
                    : "bg-[var(--ink)] hover:bg-[var(--ink-soft)]"
                  }
                `}
              >
                {loadingModal ? "Loading..." : (modal === "start" ? "Start cycle" : "Close cycle")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function CycleControlPage() {
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
      <CycleControlContent />
    </Suspense>
  );
}