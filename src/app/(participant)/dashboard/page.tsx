"use client";

import AuthNavbar from "@/components/participant/AuthNavbar";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { participantGet, ParticipantFetchError, participantPost } from "@/lib/participant-fetch";
import type { ParticipantDashboardData, CycleState } from "@/app/api/participant/me/route";
import type { CycleRecord, VoucherRecord } from "@/lib/types";
import type { TaskRecord } from "@/lib/types";


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


/* ── sub-screens ─────────────────────────────────────────────────────── */

function TasksPending({
  cycle,
  completedTaskIds,
  tasks,
  onTaskDone,
}: {
  cycle: CycleRecord;
  completedTaskIds: string[];
  tasks: TaskRecord[];
  onTaskDone: (taskId: string) => Promise<void>;
}) {
  const [marking, setMarking] = useState<string | null>(null);
  const countdown = useCountdown(cycle.windowClose as unknown as { _seconds: number });
  const done = completedTaskIds?.length;
  const total = tasks?.length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  async function handle(taskId: string) {
    setMarking(taskId);
    await onTaskDone(taskId);
    setMarking(null);
  }


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
          {done} of {total} done · window closes in {countdown}
        </p>
      </div>

      {/* Progress */}
      <div className="mb-6 rounded-2xl border border-[var(--line)] bg-white p-5">
        <div className="mb-2.5 flex justify-between text-sm">
          <span className="text-[var(--ink-soft)]">{done}/{total} completed</span>
          <span className="font-mono font-semibold text-[var(--blue)]">⏱ {countdown}</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--grey-100)]">
          <div
            className="h-full rounded-full bg-[var(--blue)] transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
        {done >= cycle.minTasksToQualify && (
          <p className="mt-2 text-sm font-medium text-[var(--forest)]">
            ✓ You qualify — your voucher will be issued automatically.
          </p>
        )}
      </div>

      {/* Tasks */}
      <div className="mb-6 flex flex-col gap-3">
        {tasks.map((task) => {
          const isDone = completedTaskIds.includes(task.id);
          return (
            <button
              key={task.id}
              disabled={isDone || marking === task.id}
              onClick={() => !isDone && handle(task.id)}
              className={`
                flex w-full items-center gap-4 rounded-2xl border px-5 py-4 text-left
                transition-all
                ${isDone
                  ? "border-[var(--line)] bg-white opacity-60 cursor-default"
                  : "border-[var(--line)] bg-white hover:border-[var(--grey-200)] hover:shadow-sm"
                }
              `}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--grey-50)] text-xl capitalize">
                {task.platform === "instagram" ? "📷"
                  : task.platform === "facebook" ? "👍"
                    : task.platform === "x" ? "🐦"
                      : "📲"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--ink)]">{task.description}</p>
                <a
                  href={task.targetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs text-[var(--blue)] hover:underline"
                >
                  {/* {new URL(task.targetUrl).hostname} */}
                  {task.platform}
                </a>
              </div>
              {isDone ? (
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
          );
        })}
      </div>

      <p className="text-center text-xs text-[var(--mute)]">
        Tasks are self-reported. Our team spot-checks before the draw.
      </p>
    </div>
  );
}

function VoucherIssued({ cycle, voucher }: { cycle: CycleRecord; voucher: VoucherRecord }) {
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
          Voucher issued — sit tight while the draw runs.
        </p>
      </div>

      {/* Voucher card */}
      <div className="relative mb-5 overflow-hidden rounded-2xl bg-[var(--ink)] p-6 text-white">
        <div className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-[var(--bg)]" />
        <div className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-[var(--bg)]" />
        <div className="mb-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--lime)]">
            Raffle voucher
          </p>
          <p className="font-mono text-2xl font-semibold tracking-wider">{voucher.code}</p>
          <p className="mt-1 text-sm text-white/60">
            Cycle #{cycle.cycleNumber} · {fmtTs(voucher.issuedAt as unknown as { _seconds: number })}
            Cycle #{cycle.cycleNumber} · {fmtTs(voucher.expiresAt as unknown as { _seconds: number })}
          </p>
        </div>
        <div className="flex items-center justify-between border-t border-dashed border-white/20 pt-5">
          <p className="text-sm text-white/70">Draw closes in</p>
          <span className="font-mono text-xl font-semibold text-[var(--lime)]">{countdown}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
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
        <div className="mb-6">
          <span className="mb-4 inline-flex rounded-full bg-[var(--grey-100)] px-4 py-2 text-sm font-medium text-[var(--ink-soft)]">
            Voucher redeemed ✓
          </span>
          <h1
            className="text-3xl leading-tight tracking-tight md:text-4xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            All done —{" "}
            <em className="italic text-[var(--blue)]">see you tomorrow.</em>
          </h1>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            Your voucher has been redeemed. Good luck in the next cycle!
          </p>
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
        <div className="mb-6">
          <span className="mb-4 inline-flex rounded-full bg-[var(--lime)]/40 px-4 py-2 text-sm font-semibold text-[var(--lime-ink)]">
            🎉 Free meal voucher!
          </span>
          <h1
            className="text-3xl leading-tight tracking-tight md:text-4xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            You got a{" "}
            <em className="italic text-[var(--blue)]">free meal.</em>
          </h1>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            Voucher {voucher.code} · redeem it at the vendor.
          </p>
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
      <div className="mb-6">
        <h1
          className="text-3xl leading-tight tracking-tight md:text-4xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Not a free meal —
          <br />
          <em className="italic text-[var(--blue)]">but</em> you have a discount.
        </h1>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">
          {voucher.discountPct}% off at participating vendors.
        </p>
      </div>

      <div className="relative mb-6 overflow-hidden rounded-2xl p-7" style={{ background: "var(--lime)" }}>
        <div className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-[var(--bg)]" />
        <div className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-[var(--bg)]" />
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--lime-ink)]">Your discount</p>
        <p
          className="mb-1 font-light leading-none text-[var(--ink)]"
          style={{ fontFamily: "var(--font-display)", fontSize: "clamp(48px, 10vw, 72px)" }}
        >
          {voucher.discountPct}%<em className="italic"> off</em>
        </p>
        <p className="mb-4 font-mono text-sm font-semibold tracking-wider text-[var(--ink)]">
          USE: {voucher.code}
        </p>
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
        <Link
          href="/voucher-detail"
          className="
            mb-5 flex items-center justify-between
            rounded-2xl border border-[var(--line)] bg-white px-5 py-4
            transition-all hover:border-[var(--grey-200)] hover:shadow-sm
          "
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">🎟️</span>
            <div>
              <p className="text-sm font-semibold text-[var(--ink)]">{lastVoucher.code}</p>
              <p className="text-xs text-[var(--mute)]">
                {lastVoucher.type === "free" ? "Free meal" : `${lastVoucher.discountPct}% discount`}
              </p>
            </div>
          </div>
          <span className="text-[var(--mute)]">›</span>
        </Link>
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
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const me = await participantGet<ParticipantDashboardData>("/api/participant/me");
      setData(me);

      // If tasks are pending, fetch the task details
      if (me.cycleState.status === "tasks_pending" || me.cycleState.status === "voucher_issued") {
        const state = me.cycleState as Extract<CycleState, { status: "tasks_pending" }>;
        // const taskDetails = await Promise.all(
        //   state.cycle.taskIds.map((id) =>
        //     participantGet<TaskRecord>(`/api/participant/tasks`)
        //   )
        // );

        const taskDetails = await participantGet<TaskRecord[]>(
          "/api/participant/tasks?current=true"
        );

        setTasks(taskDetails.flat());
      }
    } catch (err) {
      if (err instanceof ParticipantFetchError && err.status === 401) {
        // window.location.href = "/login";
        console.log(err);
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
      await load(); // refresh state
    } catch (err) {
      console.error("[markTaskDone]", err);
    }
  }

  if (loading) {
    return (
      <>
        <AuthNavbar />
        <main className="flex min-h-screen items-center justify-center">
          <p className="text-sm text-[var(--ink-soft)]">Loading…</p>
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
        {(cycleState.status === "tasks_pending" || cycleState.status === "voucher_issued") && (
          <TasksPending
            cycle={cycleState.cycle}
            completedTaskIds={cycleState.completedTaskIds}
            tasks={tasks}
            onTaskDone={markTaskDone}
          />
        )}
        {cycleState.status === "voucher_issued" && (
          <VoucherIssued cycle={cycleState.cycle} voucher={cycleState.voucher} />
        )}
        {cycleState.status === "draw_done" && (
          <DrawDone voucher={cycleState.voucher} />
        )}
        {cycleState.status === "cooldown" && (
          <Cooldown nextCycleAt={cycleState.nextCycleAt} lastVoucher={cycleState.lastVoucher} />
        )}
        {cycleState.status === "no_cycle" && (
          <Cooldown nextCycleAt={null} lastVoucher={null} />
        )}
      </main>
    </>
  );
}






// ─── sub-screens ──────────────────────────────────────────────────────────

// function TasksPending() {
//   const tasks = [
//     { id: "follow", emoji: "📷", title: "Follow @pedrun on Instagram", done: true  },
//     { id: "share",  emoji: "🔁", title: "Share today's post to your story", done: true  },
//     { id: "tag",    emoji: "🏷️", title: "Tag 2 friends in comments",  done: false },
//   ];
//   const done = tasks.filter((t) => t.done).length;
//   const pct  = Math.round((done / tasks.length) * 100);

//   return (
//     <div className="mx-auto max-w-lg">
//       {/* greeting */}
//       <div className="mb-6">
//         <h1
//           className="text-3xl leading-tight tracking-tight md:text-4xl"
//           style={{ fontFamily: "var(--font-display)" }}
//         >
//           Complete tasks.{" "}
//           <em className="italic text-[var(--blue)]">Win dinner.</em>
//         </h1>
//         <p className="mt-2 text-sm text-[var(--ink-soft)]">
//           {done} of {tasks.length} tasks done · draw in 03:42:10
//         </p>
//       </div>

//       {/* progress */}
//       <div className="mb-6 rounded-2xl border border-[var(--line)] bg-white p-5">
//         <div className="mb-2.5 flex items-center justify-between text-sm">
//           <span className="text-[var(--ink-soft)]">{done}/{tasks.length} completed</span>
//           <span className="font-mono font-semibold text-[var(--blue)]">⏱ 03:42:10</span>
//         </div>
//         <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--grey-100)]">
//           <div
//             className="h-full rounded-full bg-[var(--blue)] transition-all duration-700"
//             style={{ width: `${pct}%` }}
//           />
//         </div>
//       </div>

//       {/* task list */}
//       <div className="mb-6 flex flex-col gap-3">
//         {tasks.map((task) => (
//           <div
//             key={task.id}
//             className="flex items-center gap-4 rounded-2xl border border-[var(--line)] bg-white px-5 py-4"
//             style={{ opacity: task.done ? 0.65 : 1 }}
//           >
//             <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--grey-50)] text-xl">
//               {task.emoji}
//             </div>
//             <p className="flex-1 text-sm font-semibold text-[var(--ink)]">{task.title}</p>
//             {task.done ? (
//               <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--forest)] text-white">
//                 <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
//                   <path d="M1 5l3.5 3.5L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
//                 </svg>
//               </div>
//             ) : (
//               <div className="h-6 w-6 shrink-0 rounded-full border-2 border-[var(--grey-200)]" />
//             )}
//           </div>
//         ))}
//       </div>

//       <Link href="/tasks">
//         <Button fullWidth>Go to tasks →</Button>
//       </Link>
//     </div>
//   );
// }

// function VoucherIssued() {
//   const countdown = useCountdown(3 * 3600 + 41 * 60 + 52);
//   return (
//     <div className="mx-auto max-w-lg">
//       <div className="mb-6">
//         <h1
//           className="text-3xl leading-tight tracking-tight md:text-4xl"
//           style={{ fontFamily: "var(--font-display)" }}
//         >
//           You&apos;re{" "}
//           <em className="italic text-[var(--blue)]">in the draw.</em>
//         </h1>
//         <p className="mt-2 text-sm text-[var(--ink-soft)]">
//           Voucher issued — sit tight while the draw runs.
//         </p>
//       </div>

//       {/* voucher card */}
//       <div className="relative mb-5 overflow-hidden rounded-2xl bg-[var(--ink)] p-6 text-white">
//         <div className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-[var(--bg)]" />
//         <div className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-[var(--bg)]" />
//         <div className="absolute left-4 right-4 top-1/2 border-t border-dashed border-white/10" />

//         <div className="mb-5">
//           <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--lime)]">
//             Raffle voucher
//           </p>
//           <p className="mb-1 font-mono text-2xl font-semibold tracking-wider">PR-9X4K-A28T</p>
//           <p className="text-sm text-white/60">Cycle #214 · 11 May 2026</p>
//         </div>

//         <div className="flex items-center justify-between border-t border-dashed border-white/20 pt-5">
//           <p className="text-sm text-white/70">Draw begins in</p>
//           <span className="font-mono text-xl font-semibold text-[var(--lime)]">{countdown}</span>
//         </div>
//       </div>

//       {/* status pills */}
//       <div className="mb-5 flex flex-wrap gap-2">
//         {["Issued", "Eligible", "Draw running…", "Result"].map((label, i) => (
//           <span
//             key={label}
//             className="rounded-full px-3 py-1 text-xs font-medium"
//             style={{
//               background: i === 1 ? "var(--blue)" : "var(--grey-100)",
//               color: i === 1 ? "#fff" : "var(--ink-soft)",
//             }}
//           >
//             {label}
//           </span>
//         ))}
//       </div>

//       <Link href="/voucher">
//         <Button variant="ghost" fullWidth>View full voucher details</Button>
//       </Link>
//     </div>
//   );
// }

// function DrawResult({ won }: { won: boolean }) {
//   if (won) {
//     return (
//       <div className="mx-auto max-w-lg">
//         <div className="mb-6">
//           <span className="mb-4 inline-flex rounded-full bg-[var(--lime)]/40 px-4 py-2 text-sm font-semibold text-[var(--lime-ink)]">
//             🏆 You won!
//           </span>
//           <h1
//             className="text-3xl leading-tight tracking-tight md:text-4xl"
//             style={{ fontFamily: "var(--font-display)" }}
//           >
//             You won{" "}
//             <em className="italic text-[var(--blue)]">today&apos;s draw.</em>
//           </h1>
//           <p className="mt-2 text-sm text-[var(--ink-soft)]">
//             Voucher PR-9X4K-A28T · Cycle #214 · Claim within 2 hours
//           </p>
//         </div>

//         <div className="mb-5 flex items-center gap-4 rounded-2xl border border-[var(--line)] bg-white p-5">
//           <div
//             className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-2xl"
//             style={{ background: "radial-gradient(at 25% 25%, var(--lime), transparent 55%), #1A1F35" }}
//           >
//             🛵
//           </div>
//           <div>
//             <p className="font-semibold text-[var(--ink)]">Jollof &amp; grilled chicken</p>
//             <p className="text-sm text-[var(--ink-soft)]">Mama Cass · 4.7 ★ · 1.2 km</p>
//           </div>
//         </div>

//         <Link href="/result/won">
//           <Button fullWidth>Claim my free meal →</Button>
//         </Link>
//         <div className="mt-3 text-center">
//           <Link href="/voucher-detail" className="text-sm font-medium text-[var(--blue)] underline underline-offset-2">
//             View voucher details
//           </Link>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="mx-auto max-w-lg">
//       <div className="mb-6">
//         <h1
//           className="text-3xl leading-tight tracking-tight md:text-4xl"
//           style={{ fontFamily: "var(--font-display)" }}
//         >
//           Not this time —
//           <br />
//           <em className="italic text-[var(--blue)]">but</em> here&apos;s something.
//         </h1>
//         <p className="mt-2 text-sm text-[var(--ink-soft)]">
//           Cycle #214 · Draw complete · Your discount is ready.
//         </p>
//       </div>

//       {/* discount card */}
//       <div
//         className="relative mb-5 overflow-hidden rounded-2xl p-7"
//         style={{ background: "var(--lime)" }}
//       >
//         <div className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-[var(--bg)]" />
//         <div className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-[var(--bg)]" />
//         <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-[var(--lime-ink)]">
//           Your discount
//         </p>
//         <p
//           className="mb-1 font-light leading-none text-[var(--ink)]"
//           style={{ fontFamily: "var(--font-display)", fontSize: "clamp(48px, 10vw, 72px)" }}
//         >
//           30%<em className="italic"> off</em>
//         </p>
//         <p className="mb-4 font-mono text-sm font-semibold tracking-wider text-[var(--ink)]">
//           USE: PR-9X4K-A28T
//         </p>
//         <p className="text-xs font-medium text-[var(--lime-ink)]/70">
//           Valid at Mama Cass · until Sun 17 May
//         </p>
//       </div>

//       <Link href="/result/discount">
//         <Button fullWidth>View discount details →</Button>
//       </Link>
//       <div className="mt-3 text-center">
//         <Link href="/voucher-detail" className="text-sm font-medium text-[var(--blue)] underline underline-offset-2">
//           View voucher details
//         </Link>
//       </div>
//     </div>
//   );
// }

// function Cooldown() {
//   const LAST_VOUCHER = {
//     code:   "PR-9X4K-A28T",
//     cycle:  "#214",
//     date:   "11 May 2026",
//     result: "discount" as "won" | "discount",
//   };

//   return (
//     <div className="mx-auto max-w-lg">
//       <div className="mb-6">
//         <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl border border-[var(--line)] bg-[var(--grey-50)] text-3xl">
//           🌙
//         </div>
//         <h1
//           className="mb-2 text-3xl leading-tight tracking-tight md:text-4xl"
//           style={{ fontFamily: "var(--font-display)" }}
//         >
//           We&apos;re between{" "}
//           <em className="italic text-[var(--blue)]">rounds.</em>
//         </h1>
//         <p className="text-sm text-[var(--ink-soft)]">
//           All of today&apos;s vouchers have been claimed. Come back tomorrow — window opens at 09:00 WAT.
//         </p>
//       </div>

//       {/* next window */}
//       <div className="mb-5 rounded-2xl border border-[var(--line)] bg-white p-5">
//         <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-[var(--mute)]">
//           Next window opens
//         </p>
//         <p className="font-mono text-lg font-semibold text-[var(--ink)]">
//           Tomorrow · 09:00 WAT
//         </p>
//       </div>

//       {/* last voucher peek */}
//       <div className="mb-5">
//         <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-[var(--mute)]">
//           Your last voucher
//         </p>
//         <Link
//           href="/voucher-detail"
//           className="
//             flex items-center justify-between
//             rounded-2xl border border-[var(--line)]
//             bg-white px-5 py-4
//             transition-all hover:border-[var(--grey-200)] hover:shadow-sm
//           "
//         >
//           <div className="flex items-center gap-3">
//             <span className="text-xl">🎟️</span>
//             <div>
//               <p className="text-sm font-semibold text-[var(--ink)]">
//                 {LAST_VOUCHER.code}
//               </p>
//               <p className="text-xs text-[var(--mute)]">
//                 Cycle {LAST_VOUCHER.cycle} · {LAST_VOUCHER.date}
//               </p>
//             </div>
//           </div>
//           <div className="flex items-center gap-2">
//             <span
//               className="rounded-lg px-2.5 py-1 text-xs font-semibold"
//               style={{
//                 background: LAST_VOUCHER.result === "won" ? "var(--lime)" : "var(--grey-100)",
//                 color: LAST_VOUCHER.result === "won" ? "var(--lime-ink)" : "var(--ink-soft)",
//               }}
//             >
//               {LAST_VOUCHER.result === "won" ? "🏆 Won" : "30% discount"}
//             </span>
//             <span className="text-[var(--mute)]">›</span>
//           </div>
//         </Link>
//       </div>

//       <Link href="/closed">
//         <Button variant="ghost" fullWidth>
//           Notify me when it opens
//         </Button>
//       </Link>
//     </div>
//   );
// }

// // ─── Demo switcher bar ────────────────────────────────────────────────────
// const STATES: { id: AppState; label: string }[] = [
//   { id: "tasks_pending",   label: "Tasks pending"   },
//   { id: "voucher_issued",  label: "Voucher issued"  },
//   { id: "draw_won",        label: "Won"             },
//   { id: "draw_discount",   label: "Discount"        },
//   { id: "cooldown",        label: "Cooldown"        },
// ];

// // ─── Main page ────────────────────────────────────────────────────────────
// export default function HomePage() {
//   const [appState, setAppState] = useState<AppState>("tasks_pending");

//   return (
//     <>
//       <AuthNavbar userName="Adaeze" />

//       {/* Demo switcher — remove in production */}
//       <div className="border-b border-[var(--line)] bg-[var(--grey-50)] px-6 py-3">
//         <div className="mx-auto flex max-w-lg flex-wrap items-center gap-1.5">
//           <span className="mr-1 text-[11px] font-semibold uppercase tracking-widest text-[var(--mute)]">
//             State:
//           </span>
//           {STATES.map((s) => (
//             <button
//               key={s.id}
//               onClick={() => setAppState(s.id)}
//               className={`
//                 rounded-xl px-3 py-1.5 text-xs font-medium transition-all
//                 ${appState === s.id
//                   ? "bg-[var(--ink)] text-white"
//                   : "bg-white border border-[var(--line)] text-[var(--ink-soft)] hover:border-[var(--grey-200)]"
//                 }
//               `}
//             >
//               {s.label}
//             </button>
//           ))}
//         </div>
//       </div>

//       <main className="min-h-screen px-6 py-12 md:py-16">
//         {appState === "tasks_pending"   && <TasksPending />}
//         {appState === "voucher_issued"  && <VoucherIssued />}
//         {appState === "draw_won"        && <DrawResult won />}
//         {appState === "draw_discount"   && <DrawResult won={false} />}
//         {appState === "cooldown"        && <Cooldown />}
//       </main>
//     </>
//   );
// }
