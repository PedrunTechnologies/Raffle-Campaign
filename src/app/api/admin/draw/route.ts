import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/require-admin";
import { FieldValue } from "firebase-admin/firestore";
import type { CycleRecord, DrawLogRecord, VoucherRecord } from "@/lib/types";

// export async function POST(req: NextRequest) {
//   const result = await requireAdmin(req);
//   if ("error" in result) return result.error;

//   /* ── 1. Find the active cycle ─────────────────────────────────── */
//   const activeSnap = await adminDb
//     .collection("cycles")
//     .where("status", "==", "started")
//     .limit(1)
//     .get();

//   if (activeSnap.empty) {
//     return NextResponse.json(
//       { error: "No started cycle found. Start a cycle before running the draw." },
//       { status: 409 }
//     );
//   }

//   const cycleDoc  = activeSnap.docs[0];
//   const cycle     = cycleDoc.data() as CycleRecord;

//   /* ── 2. Guard: draw already run for this cycle ────────────────── */
//   if (cycle.drawLogId) {
//     return NextResponse.json(
//       { error: `Draw already completed for cycle #${cycle.cycleNumber}. Close the cycle first.` },
//       { status: 409 }
//     );
//   }

//   /* ── 3. Snapshot all eligible vouchers ───────────────────────── */
//   const vouchersSnap = await adminDb
//     .collection("vouchers")
//     .where("cycleId", "==", cycle.id)
//     .where("status",  "==", "eligible")
//     .get();

//   const eligible = vouchersSnap.docs.map((d) => d.data() as VoucherRecord);
//   const pool     = eligible.length;

//   if (pool === 0) {
//     return NextResponse.json(
//       { error: "No eligible vouchers in the pool. Cannot run the draw." },
//       { status: 409 }
//     );
//   }

//   /* ── 4. Cryptographic random selection ───────────────────────── */
//   const winnersCount  = Math.min(1, pool);
//   const shuffled      = cryptoShuffle([...eligible]);
//   const winners       = shuffled.slice(0, winnersCount);
//   const nonWinners    = shuffled.slice(winnersCount);
//   const winnerCodes   = winners.map((v) => v.code);

//   /* ── 5. Write results in a batch ─────────────────────────────── */
//   const logRef = adminDb.collection("drawLogs").doc();

//   const log: Omit<DrawLogRecord, "executedAt"> & { executedAt: unknown } = {
//     id:           logRef.id,
//     cycleId:      cycle.id,
//     cycleNumber:  cycle.cycleNumber,
//     triggeredBy:  result.admin.uid,
//     triggeredByName: result.admin.displayName,
//     eligiblePool: pool,
//     // winnersCount,
//     // winnerCodes,
//     status:       "completed",
//     executedAt:   FieldValue.serverTimestamp(),


//       voucherCodes:    string[]; 
//       freeCodes:       string[];
//       discountCodes:   string[];
//       errorMessage?:   string;
//   };

//   const batch = adminDb.batch();

//   /* Write the draw log */
//   batch.set(logRef, log);

//   /* Update cycle with drawLogId (but keep as "started" — admin closes manually) */
//   batch.update(cycleDoc.ref, {
//     drawLogId:  logRef.id,
//     updatedAt:  FieldValue.serverTimestamp(),
//   });

//   /* Mark winner vouchers as "won" */
//   for (const winner of winners) {
//     const ref = adminDb.collection("vouchers").doc(winner.code);
//     batch.update(ref, {
//       status:      "won",
//       updatedAt:   FieldValue.serverTimestamp(),
//     });
//   }

//   /* Mark non-winner vouchers as "discount" (keep eligible → discount path) */
//   for (const loser of nonWinners) {
//     const ref = adminDb.collection("vouchers").doc(loser.code);
//     batch.update(ref, {
//       status:    "discount",
//       updatedAt: FieldValue.serverTimestamp(),
//     });
//   }

//   await batch.commit();

//   return NextResponse.json({
//     ok:          true,
//     drawLogId:   logRef.id,
//     cycleNumber: cycle.cycleNumber,
//     pool,
//     winnersCount,
//     winnerCodes,
//   });
// }


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
      { error: `Draw already completed for cycle #${cycle.cycleNumber}. Close the cycle first.` },
      { status: 409 }
    );
  }

  /* ── 3. Snapshot all eligible vouchers (participants) ─────────── */
  const vouchersSnap = await adminDb
    .collection("vouchers")
    .where("cycleId", "==", cycle.id)
    .where("status", "==", "eligible")
    .get();

  const eligible = vouchersSnap.docs.map((d) => d.data() as VoucherRecord);
  const pool = eligible.length;

  if (pool === 0) {
    return NextResponse.json(
      { error: "No eligible vouchers in the pool. Cannot run the draw." },
      { status: 409 }
    );
  }

  /* ── 4. Build the prize pool from vendorOptIns ────────────────── */
  //
  // Each vendorOptIn contributes:
  //   - freeVouchers × { type: "free" }
  //   - discountTiers × { type: "discount", discountPct, dineInAvailable, dineInUntil }
  //
  // Prizes are ordered: free first, then tiers lowest→highest discount,
  // so the shuffle is what randomises who gets what — not the order here.

  type Prize =
    | { type: "free"; vendorId: string; vendorName: string }
    | { type: "discount"; vendorId: string; vendorName: string; discountPct: number; dineInAvailable: string; dineInUntil: string };

  const prizePool: Prize[] = [];

  for (const optIn of cycle.vendorOptIns ?? []) {
    const { vendorId, vendorName, freeVouchers = 0, discountTiers = [] } = optIn;

    // Free vouchers
    for (let i = 0; i < freeVouchers; i++) {
      prizePool.push({ type: "free", vendorId, vendorName });
    }

    // Discount tiers — sort ascending so lower discounts are assigned first
    // (winners drawn first get the bigger prizes via the shuffle, see step 5)
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

  /* ── 5. Shuffle participants, then assign prizes in order ─────── */
  //
  // Shuffle the eligible participants — the first `totalPrizes` participants
  // are winners; the rest receive no prize this cycle.
  // The prize pool itself is NOT shuffled: free prizes go first, then tiers.
  // This means the luckiest participants (drawn earliest) get free meals.

  const shuffledParticipants = cryptoShuffle([...eligible]);
  const prizeWinners = shuffledParticipants.slice(0, totalPrizes);
  const noPrize = shuffledParticipants.slice(totalPrizes);

  // Pair each winner with their prize
  const assignments = prizeWinners.map((voucher, i) => ({
    voucher,
    prize: prizePool[i],
  }));

  /* ── 6. Categorise for the draw log ──────────────────────────── */
  const freeCodes = assignments.filter((a) => a.prize.type === "free").map((a) => a.voucher.code);
  const discountCodes = assignments.filter((a) => a.prize.type === "discount").map((a) => a.voucher.code);
  const voucherCodes = [...freeCodes, ...discountCodes]; // all distributed (free + discount)

  /* ── 7. Write results in a batch ─────────────────────────────── */
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

  const batch = adminDb.batch();

  /* Write the draw log */
  batch.set(logRef, log);

  /* Update cycle with drawLogId (keep as "started" — admin closes manually) */
  batch.update(cycleDoc.ref, {
    drawLogId: logRef.id,
    updatedAt: FieldValue.serverTimestamp(),
  });

  /* Update winner vouchers with their assigned prize */
  for (const { voucher, prize } of assignments) {
    const ref = adminDb.collection("vouchers").doc(voucher.code);

    const expiresAt = new Date(
      Date.now() + cycle.cooldownHours * 60 * 60 * 1000
    );

    if (prize.type === "free") {
      batch.update(ref, {
        status: "won",
        type: "free",
        vendorId: prize.vendorId,
        vendorName: prize.vendorName,
        expiresAt,
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else {
      batch.update(ref, {
        status: "won",
        type: "discount",
        discountPct: prize.discountPct,
        dineInAvailable: prize.dineInAvailable,
        dineInUntil: prize.dineInUntil,
        vendorId: prize.vendorId,
        vendorName: prize.vendorName,
        expiresAt,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  }

  /* Mark participants without a prize */
  for (const voucher of noPrize) {
    const ref = adminDb.collection("vouchers").doc(voucher.code);
    batch.update(ref, {
      status: "no_prize",
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  await batch.commit();

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