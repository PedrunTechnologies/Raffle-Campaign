import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/require-admin";
import type { CycleRecord, DrawLogRecord, VoucherRecord } from "@/lib/types";
import { notifyParticipantsDrawDone, notifyVendorsDrawDone } from "@/lib/fcm";



export async function POST(req: NextRequest) {
  const result = await requireAdmin(req);
  if ("error" in result) return result.error;

  /* ── 1. Find the active cycle ─────────────────────────────────── */
  const activeSnap = await adminDb
    .collection("cycles")
    .where("status", "==", "started")
    .limit(1)
    .get();

  if (activeSnap.empty) {
    return NextResponse.json(
      { error: "No started cycle found. Start a cycle before running the draw." },
      { status: 409 }
    );
  }

  const cycleDoc = activeSnap.docs[0];
  const cycle = cycleDoc.data() as CycleRecord;

  /* ── 2. Guard: draw already run for this cycle ────────────────── */
  if (cycle.drawLogId) {
    return NextResponse.json(
      { error: `Draw already completed for cycle #${cycle.cycleNumber}.` },
      { status: 409 }
    );
  }

  /* ── 3. Find all qualifying participants from taskSubmissions ─── */
  //
  // Group submissions by participantId, keep those with count ≥ minTasksToQualify.
  // This is the source of truth — no pre-existing voucher docs needed.

  const submissionsSnap = await adminDb
    .collection("taskSubmissions")
    .where("cycleId", "==", cycle.id)
    .get();

  // Count distinct tasks per participant
  const taskCountByParticipant = new Map<string, Set<string>>();
  for (const doc of submissionsSnap.docs) {
    const { participantId, taskId } = doc.data() as { participantId: string; taskId: string };
    if (!taskCountByParticipant.has(participantId)) {
      taskCountByParticipant.set(participantId, new Set());
    }
    taskCountByParticipant.get(participantId)!.add(taskId);
  }

  const qualifyingParticipantIds = [...taskCountByParticipant.entries()]
    .filter(([, tasks]) => tasks.size >= cycle.minTasksToQualify)
    .map(([uid]) => uid);

  const pool = qualifyingParticipantIds.length;

  if (pool === 0) {
    return NextResponse.json(
      { error: "No participants have completed the minimum tasks. Cannot run the draw." },
      { status: 409 }
    );
  }

  /* ── 4. Build the prize pool from vendorOptIns ────────────────── */
  //
  // Each vendorOptIn contributes:
  //   - freeVouchers  × { type: "free" }
  //   - discountTiers × { type: "discount", discountPct, dineInAvailable, dineInUntil }
  //
  // Free prizes first, then tiers sorted ascending — the shuffle (step 5)
  // determines who gets which prize; the luckiest participants drawn earliest
  // receive free meals.

  type Prize =
    | { type: "free"; vendorId: string; vendorName: string }
    | { type: "discount"; vendorId: string; vendorName: string; discountPct: number; dineInAvailable: string; dineInUntil: string };

  const prizePool: Prize[] = [];

  for (const optIn of cycle.vendorOptIns ?? []) {
    const { vendorId, vendorName, freeVouchers = 0, discountTiers = [] } = optIn;

    for (let i = 0; i < freeVouchers; i++) {
      prizePool.push({ type: "free", vendorId, vendorName });
    }

    const sortedTiers = [...discountTiers].sort((a, b) => a.percentage - b.percentage);
    for (const tier of sortedTiers) {
      for (let i = 0; i < tier.quantity; i++) {
        prizePool.push({
          type: "discount",
          vendorId,
          vendorName,
          discountPct: tier.percentage,
          dineInAvailable: tier.dineInAvailable,
          dineInUntil: tier.dineInUntil,
        });
      }
    }
  }

  const totalPrizes = prizePool.length;

  if (totalPrizes === 0) {
    return NextResponse.json(
      { error: "Cycle has no prizes configured (empty vendorOptIns). Cannot run the draw." },
      { status: 409 }
    );
  }

  /* ── 5. Shuffle participants, zip against prize pool ──────────── */
  const shuffled = cryptoShuffle([...qualifyingParticipantIds]);
  const prizeWinners = shuffled.slice(0, totalPrizes);   // get a prize
  const noPrize = shuffled.slice(totalPrizes);       // participated but no prize

  const assignments = prizeWinners.map((uid, i) => ({ uid, prize: prizePool[i] }));

  /* ── 6. Voucher expiry — end of cooldown window ───────────────── */
  const windowCloseMs =
    (cycle.windowClose as unknown as { _seconds: number })._seconds * 1000;
  const expiresAt = new Date(windowCloseMs + cycle.cooldownHours * 60 * 60 * 1000);

  /* ── 7. Categorise codes for the draw log ─────────────────────── */
  const freeCodes: string[] = [];
  const discountCodes: string[] = [];

  // Generate all codes up front so we can populate the log
  const assignmentsWithCodes = assignments.map(({ uid, prize }) => {
    const code = generateVoucherCode();
    if (prize.type === "free") freeCodes.push(code);
    else discountCodes.push(code);
    return { uid, prize, code };
  });

  const noPrizeCodes = noPrize.map(() => generateVoucherCode()); // codes for no-prize records
  const voucherCodes = [...freeCodes, ...discountCodes];

  /* ── 8. Write everything in a single batch ────────────────────── */
  const logRef = adminDb.collection("drawLogs").doc();

  const log: Omit<DrawLogRecord, "executedAt"> & { executedAt: unknown } = {
    id: logRef.id,
    cycleId: cycle.id,
    cycleNumber: cycle.cycleNumber,
    triggeredBy: result.admin.uid,
    triggeredByName: result.admin.displayName,
    eligiblePool: pool,
    voucherCodes,
    freeCodes,
    discountCodes,
    status: "completed",
    executedAt: FieldValue.serverTimestamp(),
  };

  // Firestore batch limit is 500 ops; for large cycles use BulkWriter instead.
  // Each participant = 1 voucher set = 1 op. Log + cycle update = 2 ops.
  // Safe up to ~498 participants per batch.
  const batch = adminDb.batch();

  batch.set(logRef, log);

  batch.update(cycleDoc.ref, {
    drawLogId: logRef.id,
    updatedAt: FieldValue.serverTimestamp(),
  });

  /* Create won vouchers */
  for (const { uid, prize, code } of assignmentsWithCodes) {
    const ref = adminDb.collection("vouchers").doc(code);

    const base = {
      code,
      cycleId: cycle.id,
      participantId: uid,
      status: "won",
      expiresAt,
      issuedAt: FieldValue.serverTimestamp(),
      redeemedAt: null,
    };

    if (prize.type === "free") {
      batch.set(ref, {
        ...base,
        type: "free",
        discountPct: null,
        vendorId: prize.vendorId,
        vendorName: prize.vendorName,
      } satisfies Omit<VoucherRecord, "issuedAt" | "expiresAt" | "status"> & { issuedAt: unknown; expiresAt: unknown; "status": unknown });
    } else {
      batch.set(ref, {
        ...base,
        type: "discount",
        discountPct: prize.discountPct,
        vendorId: prize.vendorId,
        vendorName: prize.vendorName,
        dineInAvailable: prize.dineInAvailable,
        dineInUntil: prize.dineInUntil,
      } satisfies Omit<VoucherRecord, "issuedAt" | "expiresAt" | "dineInAvailable" | "dineInUntil" | "status"> & { issuedAt: unknown; expiresAt: unknown; dineInAvailable: unknown; "dineInUntil": unknown; "status": unknown });
    }
  }

  /* Create no-prize vouchers (participant can see they were in the draw) */
  for (let i = 0; i < noPrize.length; i++) {
    const uid = noPrize[i];
    const code = noPrizeCodes[i];
    const ref = adminDb.collection("vouchers").doc(code);

    batch.set(ref, {
      code,
      cycleId: cycle.id,
      participantId: uid,
      type: null,
      discountPct: null,
      status: "no_prize",
      vendorId: null,
      vendorName: null,
      issuedAt: FieldValue.serverTimestamp(),
      expiresAt,
      redeemedAt: null,
    } satisfies Omit<VoucherRecord, "issuedAt" | "expiresAt"> & { issuedAt: unknown; expiresAt: unknown });
  }

  await batch.commit();

  /* Fire push notifications — non-blocking, never fail the response */
  // void Promise.allSettled([
  //   notifyParticipantsDrawDone(cycle.cycleNumber),
  //   notifyVendorsDrawDone(cycle.cycleNumber),
  // ]);

  /* Fire push notifications — awaited so serverless fn doesn't exit early */
  await Promise.allSettled([
    notifyParticipantsDrawDone(cycle.cycleNumber),
    notifyVendorsDrawDone(cycle.cycleNumber),
  ]);


  return NextResponse.json({
    ok: true,
    drawLogId: logRef.id,
    cycleNumber: cycle.cycleNumber,
    eligiblePool: pool,
    voucherCodes,
    freeCodes,
    discountCodes,
  });
}


/* ── Voucher code generator: PR-XXXX-XXXX ───────────────────────── */
function generateVoucherCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const seg = (n: number) =>
    Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `PR-${seg(4)}-${seg(4)}`;
}

/* ── Cryptographic Fisher-Yates shuffle ─────────────────────────── */
function cryptoShuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    const j = buf[0] % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}