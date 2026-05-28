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

function fmtTs(ts: { _seconds: number } | null | undefined): string {
  if (!ts) return "—";
  return new Date(ts._seconds * 1000).toLocaleString("en-GB", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

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


/* ── task list — shared between tasks_pending and voucher_issued ──────── */

function TaskList({
  cycle,
  tasks,
  onTaskDone,
}: {
  cycle: CycleRecord;
  tasks: (TaskRecord & { completed: boolean })[];
  onTaskDone: (taskId: string) => Promise<void>;
}) {
  const [marking, setMarking] = useState<string | null>(null);
  const countdown = useCountdown(cycle.windowClose as unknown as { _seconds: number });
  const done = tasks.filter((t) => t.completed).length;
  const total = tasks.length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  async function handle(taskId: string) {
    setMarking(taskId);
    await onTaskDone(taskId);
    setMarking(null);
  }

  return (
    <div>
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
        {done === total && (
          <p className="mt-2 text-xs text-[var(--forest)]">
            ✓ All tasks done. Good luck in the draw!
          </p>
        )}
      </div>

      {/* Task cards */}
      <div className="flex flex-col gap-3">
        {tasks.map((task) => (
          <button
            key={task.id}
            disabled={task.completed || marking === task.id}
            onClick={() => !task.completed && handle(task.id)}
            className={`
              flex w-full items-center gap-4 rounded-2xl border px-5 py-4 text-left
              transition-all
              ${task.completed
                ? "border-[var(--line)] bg-white opacity-60 cursor-default"
                : "border-[var(--line)] bg-white hover:border-[var(--grey-200)] hover:shadow-sm"
              }
            `}
          >
            {/* Platform icon */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--grey-50)] text-xl">
              {task.platform === "instagram" ? "📷"
                : task.platform === "facebook" ? "👍"
                  : task.platform === "x" ? "🐦"
                    : "📲"}
            </div>

            {/* Labels */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--ink)]">{task.description}</p>
              <a
                href={task.targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-xs text-[var(--blue)] hover:underline"
              >
                Open on {task.platform}
              </a>
            </div>

            {/* State indicator */}
            {task.completed ? (
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--forest)] text-white">
                <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                  <path d="M1 5l3.5 3.5L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            ) : marking === task.id ? (
              <div className="h-5 w-5 shrink-0 rounded-full border-2 border-[var(--blue)] border-t-transparent animate-spin" />
            ) : (
              <div className="h-6 w-6 shrink-0 rounded-full border-2 border-[var(--grey-200)]" />
            )}
          </button>
        ))}
      </div>

      <p className="mt-4 text-center text-xs text-[var(--mute)]">
        Tasks are self-reported. Our team spot-checks before the draw.
      </p>
    </div>
  );
}

/* ── screens ─────────────────────────────────────────────────────────── */

function TasksPending({
  cycle,
  tasks,
  onTaskDone,
}: {
  cycle: CycleRecord;
  tasks: (TaskRecord & { completed: boolean })[];
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
        <p className="mt-2 text-sm text-[var(--ink-soft)]">
          Complete at least {cycle.minTasksToQualify} task
          {cycle.minTasksToQualify !== 1 ? "s" : ""} to qualify.
          More tasks increase your chances.
        </p>
      </div>
      <TaskList cycle={cycle} tasks={tasks} onTaskDone={onTaskDone} />
    </div>
  );
}

function VoucherIssued({
  cycle,
  voucher,
  tasks,
  onTaskDone,
}: {
  cycle: CycleRecord;
  voucher: VoucherRecord;
  tasks: (TaskRecord & { completed: boolean })[];
  onTaskDone: (taskId: string) => Promise<void>;
}) {
  const countdown = useCountdown(cycle.windowClose as unknown as { _seconds: number });

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6">
        <h1
          className="text-3xl leading-tight tracking-tight md:text-4xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          You&apos;re{" "}
          <em className="italic text-[var(--blue)]">in the draw.</em>
        </h1>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">
          Voucher issued. Keep completing tasks to improve your chances.
        </p>
      </div>

      {/* Voucher — always visible */}
      <div className="mb-6">
        <RaffleVoucherCard
          voucher={voucher}
          countdown={countdown}
          countdownLabel="Draw closes in"
        />
      </div>

      {/* Status pills */}
      <div className="mb-6 flex flex-wrap gap-2">
        {["Issued", "Eligible", "Draw running…", "Result"].map((label, i) => (
          <span
            key={label}
            className="rounded-full px-3 py-1 text-xs font-medium"
            style={{
              background: i === 1 ? "var(--blue)" : "var(--grey-100)",
              color: i === 1 ? "#fff" : "var(--ink-soft)",
            }}
          >
            {label}
          </span>
        ))}
      </div>

      {/* Tasks still shown */}
      <div className="mb-4">
        <p className="mb-3 text-sm font-semibold text-[var(--ink)]">
          Keep going — complete more tasks
        </p>
        <TaskList cycle={cycle} tasks={tasks} onTaskDone={onTaskDone} />
      </div>

      <Link href="/voucher-detail">
        <Button variant="ghost" fullWidth>View full voucher details</Button>
      </Link>
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

  // discount
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

      {/* Last voucher peek — compact version */}
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

      <Link href="/closed">
        <Button variant="ghost" fullWidth>Notify me when it opens</Button>
      </Link>
    </div>
  );
}

/* ── main page ───────────────────────────────────────────────────────── */

export default function HomePage() {
  const [data, setData] = useState<ParticipantDashboardData | null>(null);
  const [tasks, setTasks] = useState<(TaskRecord & { completed: boolean })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const me = await participantGet<ParticipantDashboardData>("/api/participant/me");
      setData(me);

      // Load tasks whenever there's an active cycle
      // (needed for both tasks_pending AND voucher_issued states)
      if (
        me.cycleState.status === "tasks_pending" ||
        me.cycleState.status === "voucher_issued"
      ) {
        const taskDetails = await participantGet<(TaskRecord & { completed: boolean })[]>(
          "/api/participant/tasks?current=true"
        );
        setTasks(taskDetails);
      }
    } catch (err) {
      if (err instanceof ParticipantFetchError && err.status === 401) {
        window.location.href = "/login";
      } else {
        setError("Failed to load. Please refresh.");
      }
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
          {/* <p className="text-sm text-[var(--ink-soft)]">Loading…</p> */}
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
            onTaskDone={markTaskDone}
          />
        )}
        {cycleState.status === "voucher_issued" && (
          <VoucherIssued
            cycle={cycleState.cycle}
            voucher={cycleState.voucher}
            tasks={tasks}
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





