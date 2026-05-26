"use client";

import { Panel, PageHeader } from "@/components/admin/AdminUI";
import { adminGet, adminPost, AdminFetchError } from "@/lib/admin-fetch";
import { CycleRecord } from "@/lib/types";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";

type DrawState = "idle" | "confirm" | "running" | "done";

interface DrawResult {
  drawLogId:   string;
  cycleNumber: number;
  pool:        number;
  winnersCount: number;
  winnerCodes: string[];
}

function fmtTs(ts: { _seconds: number } | null | undefined): string {
  if (!ts) return "—";
  return new Date(ts._seconds * 1000).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}



export default function TriggerDrawPage() {
  const [drawState, setDrawState] = useState<DrawState>("idle");
  const [password,  setPassword]  = useState("");
  const [pwError,   setPwError]   = useState("");
  const [cycle,     setCycle]     = useState<CycleRecord | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [running,   setRunning]   = useState(false);
  const [drawError, setDrawError] = useState("");
  const [result,    setResult]    = useState<DrawResult | null>(null);







  const [wrongPw, setWrongPw] = useState(false);
  const [stats, setStats] = useState<{
    eligibleUsers: number;
    totalParticipants: number;
    qualifiedSubmissions: number;
    estimatedPayout: number;
  } | null>(null);








  /* ── load active cycle ─────────────────────────────────────────── */
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const startedCycles = await adminGet<CycleRecord[]>("/api/admin/cycles?status=started");
      setCycle(startedCycles[0] ?? null);
    } catch (err) {
      console.error("[draw] loadData:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  /* ── confirm step — verify password against Firebase ──────────── */
  async function handleConfirm() {
    if (!password) { setPwError("Password is required."); return; }
    setPwError("");
    setDrawError("");
    setRunning(true);
    setDrawState("running");

    try {
      /* Verify password by re-authenticating — if it fails Firebase throws */
      const { signInWithEmailAndPassword } = await import("firebase/auth");
      const { auth } = await import("@/lib/firebase");
      const currentEmail = auth.currentUser?.email;
      if (!currentEmail) throw new Error("Not signed in.");
      await signInWithEmailAndPassword(auth, currentEmail, password);

      /* Run the draw */
      const res = await adminPost<DrawResult>("/api/admin/draw", {});
      setResult(res);
      setDrawState("done");
    } catch (err) {
      if (err instanceof AdminFetchError) {
        setDrawError(err.message);
      } else {
        const code = (err as { code?: string })?.code ?? "";
        if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
          setPwError("Incorrect password.");
        } else if (code === "auth/too-many-requests") {
          setPwError("Too many attempts. Please wait.");
        } else {
          setDrawError("Something went wrong. Please try again.");
        }
      }
      setDrawState("confirm"); // step back so admin can retry
    } finally {
      setRunning(false);
    }
  }


  













  /* ── loading state ─────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-[var(--ink-soft)]">Loading cycle data…</p>
      </div>
    );
  }


  /* ── no active cycle ───────────────────────────────────────────── */
  if (!cycle) {
    return (
      <>
        <PageHeader
          title={<>No active <em className="italic text-[var(--blue)]">cycle</em></>}
          sub="Start a cycle before running the draw."
        />
        <div className="max-w-xl">
          <Panel title="Nothing to draw">
            <p className="mb-4 text-sm text-[var(--ink-soft)]">
              There is no started cycle available. Go to Cycle control to start one.
            </p>
            <Link href="/admin/cycle-control">
              <Button>Go to cycle control</Button>
            </Link>
          </Panel>
        </div>
      </>
    );
  }


  /* ── draw already run for this cycle ───────────────────────────── */
  if (cycle.drawLogId && drawState !== "done") {
    return (
      <>
        <PageHeader
          title={<>Draw <em className="italic text-[var(--blue)]">already run</em></>}
          sub={`Cycle #${cycle.cycleNumber} · Draw completed.`}
        />
        <div className="max-w-xl">
          <Panel title="Draw complete">
            <p className="mb-4 text-sm text-[var(--ink-soft)]">
              The draw for cycle #{cycle.cycleNumber} has already been executed.
              Close the cycle from the cycle control page, then view the result in draw logs.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href={`/admin/cycle-control?id=${cycle.id}`}>
                <Button variant="ghost">Close cycle</Button>
              </Link>
              <Link href="/admin/draw-logs">
                <Button>View draw logs</Button>
              </Link>
            </div>
          </Panel>
        </div>
      </>
    );
  }

  /* ── done state — show result ──────────────────────────────────── */
  if (drawState === "done" && result) {
    const executedAt = new Date().toLocaleTimeString("en-GB", {
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });

    return (
      <>
        <PageHeader
          title={<>Draw <em className="italic text-[var(--blue)]">complete</em></>}
          sub={`Cycle #${result.cycleNumber} · Result is immutable and timestamped.`}
        />
        <div className="max-w-xl space-y-5">
          <div className="overflow-hidden rounded-2xl border border-[var(--forest)]/20 bg-[var(--forest)]/5 p-6">
            {/* Draw ID */}
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-[var(--forest)]">
              Draw ID
            </p>
            <p className="mb-5 font-mono text-lg font-semibold text-[var(--ink)]">
              {result.drawLogId}
            </p>

            {/* Stats */}
            <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { l: "Executed at",  v: executedAt           },
                { l: "Eligible pool", v: String(result.pool)  },
                { l: "Winners",       v: String(result.winnersCount) },
                { l: "Cycle",         v: `#${result.cycleNumber}` },
              ].map((s) => (
                <div key={s.l} className="rounded-xl border border-[var(--line)] bg-white px-3.5 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--mute)]">{s.l}</p>
                  <p className="mt-1 font-mono text-xs font-semibold text-[var(--ink)]">{s.v}</p>
                </div>
              ))}
            </div>

            {/* Winner codes */}
            <div className="mb-4">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-[var(--forest)]">
                Winner voucher{result.winnerCodes.length > 1 ? "s" : ""}
              </p>
              <div className="flex flex-wrap gap-2">
                {result.winnerCodes.map((code) => (
                  <span
                    key={code}
                    className="rounded-lg bg-[var(--lime)] px-3 py-1.5 font-mono text-xs font-semibold text-[var(--lime-ink)]"
                  >
                    {code}
                  </span>
                ))}
              </div>
            </div>

            <p className="text-sm text-[var(--ink-soft)]">
              Winner{result.winnerCodes.length > 1 ? "s" : ""} notified via push notification.
              All other participants received a discount code. Vendor redemption window is now open.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href={`/admin/cycle-control?id=${cycle.id}`}>
              <Button variant="ghost">Close cycle</Button>
            </Link>
            <Link href="/admin/draw-logs">
              <Button>View draw logs</Button>
            </Link>
          </div>
        </div>
      </>
    );
  }

  


  /* ── vendor opt-in summary from cycle ─────────────────────────── */
  const totalVendors  = cycle.vendorOptIns?.length ?? 0;
  const totalPool     = cycle.totalPool ?? 0;

  return (
    <>
      <PageHeader
        title={<>Trigger <em className="italic text-[var(--blue)]">the draw</em></>}
        sub={`Cycle #${cycle.cycleNumber} · ${fmtTs(cycle.windowOpen as unknown as { _seconds: number } | null)} → ${fmtTs(cycle.windowClose as unknown as { _seconds: number })}`}
        // sub="Cycle #214 · Randomised selection from valid voucher pool."
        />

      <div className="max-w-xl space-y-5">

        {/* Draw error */}
        {drawError && (
          <div className="rounded-2xl border border-[var(--blue)]/20 bg-[var(--blue)]/5 px-5 py-4 text-sm text-[var(--blue)]">
            {drawError}
          </div>
        )}

        {/* ── Draw zone ── */}
        <div
          className="relative overflow-hidden rounded-2xl p-7 text-white"
          style={{
            background:
              "radial-gradient(at 20% 0%, rgba(30,91,255,.7), transparent 55%), radial-gradient(at 80% 100%, rgba(217,242,60,.25), transparent 55%), #0A0F1F",
          }}
        >
          {drawState === "running" ? (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="mb-5 h-14 w-14 rounded-full border-4 border-[var(--lime)] border-t-transparent animate-spin" />
              <p className="text-lg font-semibold">Running draw…</p>
              <p className="mt-1 text-sm text-white/60">Cryptographic selection in progress</p>
            </div>
          ) : (
            <>
              <span className="mb-4 inline-flex rounded-full bg-[var(--lime)]/20 px-3 py-1 text-xs font-semibold text-[var(--lime)]">
                Ready to draw
              </span>

              <h2
                className="mb-5 text-2xl font-medium leading-snug"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Cycle{" "}
                <em className="italic text-[var(--lime)]">#{cycle.cycleNumber}</em>
                {" "}is live.
              </h2>

              {/* Meta chips */}
              <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  { l: "Vendor opt-ins",  v: String(totalVendors)                   },
                  { l: "Voucher pool",    v: totalPool > 0 ? String(totalPool) : "—" },
                  { l: "Tasks",           v: String(cycle.taskIds.length)             },
                  { l: "Participants",         v: String(cycle.vendorOptIns)               },
                ].map((m) => (
                  <div key={m.l} className="rounded-xl bg-white/10 px-3 py-2.5 text-center">
                    <p className="text-base font-semibold text-[var(--lime)]">{m.v}</p>
                    <p className="mt-0.5 text-[10px] text-white/60">{m.l}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={() => { setDrawError(""); setDrawState("confirm"); }}
                className="
                  flex w-full items-center justify-center gap-2
                  rounded-xl bg-[var(--lime)] py-3.5
                  text-sm font-bold text-[var(--lime-ink)]
                  transition-all hover:brightness-95 active:scale-[.98]
                "
              >
                🎲 Run draw now
              </button>
          

            <p className="mt-3 text-center text-[11px] text-white/50">
              This action is permanent and timestamped. Cannot be reversed once executed.
            </p>

            </>
          )}
        </div>


        {/* ── Password confirmation ── */}
        {drawState === "confirm" && (
          <div className="rounded-2xl border border-[var(--line)] bg-white p-6">
            <h3
              className="mb-1 text-lg font-medium"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Confirm your identity
            </h3>
            <p className="mb-5 text-sm text-[var(--ink-soft)]">
              Enter your admin password to proceed. This action is logged and cannot be undone.
            </p>

            <div className="mb-5 flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-widest text-[var(--mute)]">
                Admin password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setPwError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
                placeholder="••••••••"
                autoFocus
                className={`
                  rounded-xl border px-4 py-3 text-sm outline-none transition-all
                  ${pwError
                    ? "border-[var(--blue)] ring-2 ring-[var(--blue)]/10"
                    : "border-[var(--line)] focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/10"
                  }
                `}
              />
              {pwError && (
                <p className="text-xs text-[var(--blue)]">{pwError}</p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => { setDrawState("idle"); setPassword(""); setPwError(""); }}
                className="flex-1 rounded-xl border border-[var(--line)] bg-[var(--grey-50)] py-2.5 text-sm font-medium hover:bg-[var(--grey-100)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!password || running}
                className="flex-1 rounded-xl bg-[var(--ink)] py-2.5 text-sm font-semibold text-white transition-all hover:bg-[var(--ink-soft)] disabled:opacity-40"
              >
                {running ? "Verifying…" : "Confirm draw"}
              </button>
            </div>


            <div className="mb-4 flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-widest text-[var(--mute)]">
                Admin password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setWrongPw(false); }}
                placeholder="••••••••"
                className={`
                  rounded-xl border px-4 py-3 text-sm outline-none transition-all
                  ${wrongPw
                    ? "border-[var(--blue)] ring-2 ring-[var(--blue)]/10"
                    : "border-[var(--line)] focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/10"
                  }
                `}
              />
              {wrongPw && (
                <p className="text-xs text-[var(--blue)]">Incorrect password. Try: admin123</p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setDrawState("idle")}
                className="flex-1 rounded-xl border border-[var(--line)] bg-[var(--grey-50)] py-2.5 text-sm font-medium text-[var(--ink)] transition-all hover:bg-[var(--grey-100)]"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!password}
                className="flex-1 rounded-xl bg-[var(--ink)] py-2.5 text-sm font-semibold text-white transition-all hover:bg-[var(--ink-soft)] disabled:opacity-40"
              >
                Confirm draw
              </button>
            </div>
          </div>
        )}

        {/* ── What happens ── */}
        <Panel title="What happens when you run the draw">
          <ol className="space-y-3">
            {[
              <>Server snapshots all <code className="rounded bg-[var(--grey-100)] px-1.5 py-0.5 font-mono text-[11px]">eligible</code> vouchers for this cycle.</>,
              <>Cryptographic Fisher-Yates shuffle selects <code className="rounded bg-[var(--grey-100)] px-1.5 py-0.5 font-mono text-[11px]">{cycle.totalPool} vouchers</code>.</>,
              <>Result written to <code className="rounded bg-[var(--grey-100)] px-1.5 py-0.5 font-mono text-[11px]">drawLogs</code> with immutable timestamp and full pool snapshot.</>,
              <>Winner vouchers marked <code className="rounded bg-[var(--grey-100)] px-1.5 py-0.5 font-mono text-[11px]">won</code>. All others become discount codes.</>,
              <>Participants notified. Vendor redemption window opens.</>,
            ].map((step, i) => (
              <li key={i} className="flex gap-3 text-sm text-[var(--ink-soft)]">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--grey-100)] text-[11px] font-bold text-[var(--ink)]">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>

          <ol className="space-y-3">
            {[
              <>Server snapshots all <code className="rounded bg-[var(--grey-100)] px-1.5 py-0.5 font-mono text-[11px]">valid & unexpired</code> vouchers.</>,
              <>Cryptographically randomised selection of <code className="rounded bg-[var(--grey-100)] px-1.5 py-0.5 font-mono text-[11px]">voucher</code> entries.</>,
              <>Result logged with immutable timestamp, total pool, and stats.</>,
              <>Participants notified via push notification.</>,
              <>Vendor portal updates: redemption window opens.</>,
            ].map((step, i) => (
              <li key={i} className="flex gap-3 text-sm text-[var(--ink-soft)]">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--grey-100)] text-[11px] font-bold text-[var(--ink)]">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </Panel>

      </div>
    </>
  );
}



