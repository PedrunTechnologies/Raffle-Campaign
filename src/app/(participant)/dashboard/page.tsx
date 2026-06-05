"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import AuthNavbar from "@/components/participant/AuthNavbar";
import Button from "@/components/ui/Button";
import { RaffleVoucherCard, DiscountVoucherCard } from "@/components/participant/VoucherCard";
import type { ParticipantDashboardData, CycleState } from "@/app/api/participant/me/route";
import { participantGet, ParticipantFetchError, participantPost } from "@/lib/participant-fetch";
import type { CycleRecord, VoucherRecord } from "@/lib/types";
import type { TaskRecord } from "@/lib/types";
import { PageLoader } from "@/components/ui/Loader";


/* ── helpers ─────────────────────────────────────────────────────────── */

function useCountdown(targetTs: { _seconds: number } | null | undefined) {
  const [display, setDisplay] = useState("--:--:--");
  useEffect(() => {
    if (!targetTs) return;
    const target = targetTs._seconds * 1000;
    const tick = () => {
      const diff = Math.max(0, target - Date.now());
      const h = String(Math.floor(diff / 3600000)).padStart(2, "0");
      const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
      const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
      setDisplay(`${h}:${m}:${s}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetTs]);
  return display;
}

const WARN_KEY = "pedrun_task_warn_seen";


/* ── Confirmation modal (first-time only) ────────────────────────────── */
function ConfirmModal({
  taskTitle,
  onConfirm,
  onCancel,
}: {
  taskTitle: string;
  onConfirm: () => void;
  onCancel:  () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center px-4 pb-6 sm:pb-0">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />
      {/* Sheet */}
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--blue-soft)] text-2xl">
          ✋
        </div>
        <h3
          className="mb-2 text-lg font-semibold text-[var(--ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Have you actually done this?
        </h3>
        <p className="mb-1 text-sm font-medium text-[var(--ink)]">
          "{taskTitle}"
        </p>
        <p className="mb-6 text-sm leading-relaxed text-[var(--ink-soft)]">
          Tasks are self-reported but our team spot-checks every cycle.
          Only mark a task as done if you've genuinely completed it —
          false reports may get you disqualified.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-[var(--line)] bg-[var(--grey-50)] py-2.5 text-sm font-medium text-[var(--ink)] hover:bg-[var(--grey-100)] transition-colors"
          >
            Not yet
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-[var(--blue)] py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          >
            Yes, mark done
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Network hint toast ──────────────────────────────────────────────── */
function NetworkToast({ onDismiss }: { onDismiss: () => void }) {
  useEffect(() => {
    const id = setTimeout(onDismiss, 5000);
    return () => clearTimeout(id);
  }, [onDismiss]);

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 px-4 w-full max-w-sm">
      <div className="flex items-start gap-3 rounded-2xl border border-[var(--line)] bg-white px-4 py-3.5 shadow-lg">
        <span className="mt-0.5 shrink-0 text-base">🔄</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--ink)]">Still showing as incomplete?</p>
          <p className="text-xs text-[var(--ink-soft)]">
            Could be a network delay — wait a moment and try marking it again.
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="shrink-0 text-[var(--mute)] hover:text-[var(--ink)] transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

/* ── task list ────────────────────────────────────────────────────────── */

function TaskList({
  cycle,
  tasks,
  onTaskDone,
}: {
  cycle: CycleRecord;
  tasks: (TaskRecord & { completed: boolean })[];
  onTaskDone: (taskId: string) => Promise<void>;
}) {
  const [marking,     setMarking]     = useState<string | null>(null);
  const [pendingTask, setPendingTask] = useState<(TaskRecord & { completed: boolean }) | null>(null);
  const [showToast,   setShowToast]   = useState(false);
  // Track which task links the user has opened — check button stays disabled until they have
  const [clickedLinks, setClickedLinks] = useState<Set<string>>(new Set());

  function handleLinkClick(taskId: string) {
    setClickedLinks((prev) => new Set(prev).add(taskId));
  }

  const countdown = useCountdown(cycle.windowClose as unknown as { _seconds: number });
  const done  = tasks.filter((t) => t.completed).length;
  const total = tasks.length;
  const pct   = total ? Math.round((done / total) * 100) : 0;

  /* Decide whether to show the confirmation modal or go straight to marking */
  function requestMark(task: TaskRecord & { completed: boolean }) {
    if (task.completed || marking) return;
    const seen = typeof window !== "undefined" && localStorage.getItem(WARN_KEY) === "1";
    if (!seen) {
      // First time ever — show the "have you done this?" modal
      setPendingTask(task);
    } else {
      // Already seen the warning — mark directly, show network toast after
      doMark(task.id, true);
    }
  }

  async function doMark(taskId: string, showNetworkHint = false) {
    setMarking(taskId);
    await onTaskDone(taskId);
    setMarking(null);
    // if (showNetworkHint) setShowToast(true);
  }

  function handleModalConfirm() {
    if (!pendingTask) return;
    if (typeof window !== "undefined") localStorage.setItem(WARN_KEY, "1");
    const id = pendingTask.id;
    setPendingTask(null);
    doMark(id, false); // no toast on first-time confirm — they just read the warning
  }

  return (
    <>
      {/* Confirmation modal */}
      {pendingTask && (
        <ConfirmModal
          taskTitle={pendingTask.description}
          onConfirm={handleModalConfirm}
          onCancel={() => setPendingTask(null)}
        />
      )}

      {/* Network hint toast */}
      {showToast && <NetworkToast onDismiss={() => setShowToast(false)} />}

      {/* Progress bar */}
      <div className="mb-5 rounded-2xl border border-[var(--line)] bg-white p-5">
        <div className="mb-2.5 flex justify-between text-sm">
          <span className="text-[var(--ink-soft)]">{done}/{total} tasks completed</span>
          <span className="font-mono font-semibold text-[var(--blue)]">⏱ {countdown}</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--grey-100)]">
          <div
            className="h-full rounded-full bg-[var(--blue)] transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
        {done >= cycle.minTasksToQualify && done < total && (
          <p className="mt-2 text-xs text-[var(--forest)]">
            ✓ You qualify. Keep going — more tasks improve your voucher chances.
          </p>
        )}
        {done === total && total > 0 && (
          <p className="mt-2 text-xs text-[var(--forest)]">
            ✓ All tasks done. Good luck in the draw!
          </p>
        )}
      </div>

      {/* "More tasks may be added" notice */}
      <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-[var(--line)] bg-[var(--grey-50)] px-4 py-3">
        <span className="mt-0.5 shrink-0 text-sm">ℹ️</span>
        <p className="text-xs leading-relaxed text-[var(--ink-soft)]">
          More tasks may be added before this cycle closes. Check back regularly to stay on top of your entries.
        </p>
      </div>

      {/* Task cards */}
      <div className="flex flex-col gap-3">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`
              flex w-full items-center gap-4 rounded-2xl border px-5 py-4
              transition-all
              ${task.completed
                ? "border-[var(--line)] bg-white opacity-60"
                : "border-[var(--line)] bg-white hover:border-[var(--grey-200)] hover:shadow-sm"
              }
            `}
          >
            {/* Platform icon — tapping opens the link */}
            <a
              href={task.targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleLinkClick(task.id)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--grey-50)] text-xl hover:opacity-80 transition-opacity"
              title={`Open on ${task.platform}`}
            >
              {task.platform === "instagram" ? "📷"
                : task.platform === "facebook" ? "👍"
                  : task.platform === "x" ? "🐦"
                    : "📲"}
            </a>

            {/* Labels — tapping opens the link */}
            <a
              href={task.targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleLinkClick(task.id)}
              className="flex-1 min-w-0"
            >
              <p className="text-sm font-semibold text-[var(--ink)]">{task.description}</p>
              <p className="text-xs text-[var(--blue)]">
                {clickedLinks.has(task.id) ? `Opened · tap ✓ to mark done` : `Open on ${task.platform}`}
              </p>
            </a>

            {/* Check button — only enabled after the link has been opened */}
            {task.completed ? (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--forest)] text-white">
                <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                  <path d="M1 5l3.5 3.5L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            ) : marking === task.id ? (
              <div className="h-8 w-8 shrink-0 rounded-full border-2 border-[var(--blue)] border-t-transparent animate-spin" />
            ) : (
              <button
                onClick={() => requestMark(task)}
                disabled={!clickedLinks.has(task.id)}
                title={clickedLinks.has(task.id) ? "Mark as done" : "Open the link first"}
                className={`
                  flex h-8 w-8 shrink-0 items-center justify-center
                  rounded-full border-2 transition-all active:scale-95
                  ${clickedLinks.has(task.id)
                    ? "border-[var(--grey-200)] hover:border-[var(--blue)] hover:bg-[var(--blue-soft)] cursor-pointer"
                    : "border-[var(--grey-100)] bg-[var(--grey-50)] cursor-not-allowed opacity-40"
                  }
                `}
              >
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none" className="opacity-0 group-hover:opacity-100">
                  <path d="M1 4l2.5 2.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>

      <p className="mt-4 text-center text-xs text-[var(--mute)]">
        Tasks are self-reported. Our team spot-checks before the draw.
      </p>
    </>
  );
}

/* ── screens ─────────────────────────────────────────────────────────── */
function TasksPending({
  cycle,
  tasks,
  qualified,
  onTaskDone,
}: {
  cycle: CycleRecord;
  tasks: (TaskRecord & { completed: boolean })[];
  qualified: boolean;
  onTaskDone: (taskId: string) => Promise<void>;
}) {
  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6">
        <h1
          className="text-3xl leading-tight tracking-tight md:text-4xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Complete tasks.{" "}
          <em className="italic text-[var(--blue)]">Get your voucher.</em>
        </h1>
        {qualified ? (
          <p className="mt-2 text-sm font-medium text-[var(--forest)]">
            ✓ You qualify for the draw. Keep completing tasks to improve your chances.
          </p>
        ) : (
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            Complete at least {cycle.minTasksToQualify} task
            {cycle.minTasksToQualify !== 1 ? "s" : ""} to qualify for the draw.
            More tasks increase your chances.
          </p>
        )}
      </div>
      <TaskList cycle={cycle} tasks={tasks} onTaskDone={onTaskDone} />
    </div>
  );
}

function DrawDone({ voucher }: { voucher: VoucherRecord }) {
  if (voucher.status === "redeemed") {
    return (
      <div className="mx-auto max-w-lg">
        <span className="mb-4 inline-flex rounded-full bg-[var(--grey-100)] px-4 py-2 text-sm font-medium text-[var(--ink-soft)]">
          Voucher redeemed ✓
        </span>
        <h1
          className="mb-2 mt-4 text-3xl leading-tight tracking-tight md:text-4xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          All done —{" "}
          <em className="italic text-[var(--blue)]">see you tomorrow.</em>
        </h1>
        <p className="mb-6 text-sm text-[var(--ink-soft)]">
          Your voucher has been redeemed. Good luck in the next cycle!
        </p>
        <div className="mb-6">
          {voucher.type === "free" ?
            <RaffleVoucherCard voucher={voucher} /> :
            <DiscountVoucherCard voucher={voucher} />
          }
        </div>
        <Link href="/profile">
          <Button variant="ghost" fullWidth>View history</Button>
        </Link>
      </div>
    );
  }

  if (voucher.type === "free") {
    return (
      <div className="mx-auto max-w-lg">
        <span className="mb-4 inline-flex rounded-full bg-[var(--lime)]/40 px-4 py-2 text-sm font-semibold text-[var(--lime-ink)]">
          🎉 Free meal voucher!
        </span>
        <h1
          className="mb-2 mt-4 text-3xl leading-tight tracking-tight md:text-4xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          You got a{" "}
          <em className="italic text-[var(--blue)]">free meal.</em>
        </h1>
        <p className="mb-6 text-sm text-[var(--ink-soft)]">
          Show your voucher code to the vendor to redeem.
        </p>
        <div className="mb-6">
          <RaffleVoucherCard voucher={voucher} />
        </div>
        <Link href="/voucher-detail">
          <Button fullWidth>Claim my free meal →</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1
        className="mb-2 text-3xl leading-tight tracking-tight md:text-4xl"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Not a free meal —
        <br />
        <em className="italic text-[var(--blue)]">but</em> you have a discount.
      </h1>
      <p className="mb-6 text-sm text-[var(--ink-soft)]">
        {voucher.discountPct}% off at participating vendors.
      </p>
      <div className="mb-6">
        <DiscountVoucherCard voucher={voucher} />
      </div>
      <Link href="/voucher-detail">
        <Button fullWidth>View discount details →</Button>
      </Link>
    </div>
  );
}

function Cooldown({
  nextCycleAt,
  lastVoucher,
}: {
  nextCycleAt: string | null;
  lastVoucher: VoucherRecord | null;
}) {
  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl border border-[var(--line)] bg-[var(--grey-50)] text-3xl">
        🌙
      </div>
      <h1
        className="mb-2 text-3xl leading-tight tracking-tight md:text-4xl"
        style={{ fontFamily: "var(--font-display)" }}
      >
        We&apos;re between{" "}
        <em className="italic text-[var(--blue)]">rounds.</em>
      </h1>
      <p className="mb-8 text-sm text-[var(--ink-soft)]">
        No active cycle right now. Come back when the next window opens.
      </p>

      {nextCycleAt && (
        <div className="mb-5 rounded-2xl border border-[var(--line)] bg-white p-5">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-[var(--mute)]">
            Next window opens
          </p>
          <p className="font-mono text-lg font-semibold text-[var(--ink)]">
            {new Date(nextCycleAt).toLocaleString("en-GB", {
              weekday: "short", day: "2-digit", month: "short",
              hour: "2-digit", minute: "2-digit",
            })}
          </p>
        </div>
      )}

      {lastVoucher && (
        <div className="mb-5">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-[var(--mute)]">
            Your last voucher
          </p>
          <Link href="/voucher-detail">
            {lastVoucher.type === "free" ? (
              <RaffleVoucherCard voucher={lastVoucher} compact />
            ) : (
              <DiscountVoucherCard voucher={lastVoucher} compact />
            )}
          </Link>
        </div>
      )}
    </div>
  );
}

/* ── main page ───────────────────────────────────────────────────────── */

export default function HomePage() {
  const [data,    setData]    = useState<ParticipantDashboardData | null>(null);
  const [tasks,   setTasks]   = useState<(TaskRecord & { completed: boolean })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  const load = useCallback(async () => {
    try {
      const me = await participantGet<ParticipantDashboardData>("/api/participant/me");
      setData(me);

      if (me.cycleState.status === "tasks_pending") {
        const taskDetails = await participantGet<(TaskRecord & { completed: boolean })[]>(
          "/api/participant/tasks?current=true"
        );
        setTasks(taskDetails);
      }
    } catch (err) {
      setError("Failed to load. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function markTaskDone(taskId: string) {
    try {
      await participantPost("/api/participant/tasks", { taskId });
      await load();
    } catch (err) {
      console.error("[markTaskDone]", err);
    }
  }

  if (loading) {
    return (
      <>
        <AuthNavbar />
        <main className="flex min-h-screen items-center justify-center">
          <PageLoader fullPage={false} />
        </main>
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <AuthNavbar />
        <main className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <p className="mb-4 text-sm text-[var(--blue)]">{error || "Something went wrong."}</p>
            <Button onClick={load}>Try again</Button>
          </div>
        </main>
      </>
    );
  }

  const { cycleState } = data;

  return (
    <>
      <AuthNavbar userName={data?.profile?.displayName?.split(" ")[0]} />
      <main className="min-h-screen px-6 py-12 md:py-16">
        {cycleState.status === "tasks_pending" && (
          <TasksPending
            cycle={cycleState.cycle}
            tasks={tasks}
            qualified={cycleState.qualified}
            onTaskDone={markTaskDone}
          />
        )}
        {cycleState.status === "draw_done" && (
          <DrawDone voucher={cycleState.voucher} />
        )}
        {(cycleState.status === "cooldown" || cycleState.status === "no_cycle") && (
          <Cooldown
            nextCycleAt={cycleState.status === "cooldown" ? cycleState.nextCycleAt : null}
            lastVoucher={cycleState.status === "cooldown" ? cycleState.lastVoucher : null}
          />
        )}
      </main>
    </>
  );
}


