import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireParticipant } from "@/lib/require-participant";
import type { UserProfile } from "@/lib/user";
import type { CycleRecord, VoucherRecord } from "@/lib/types";

export interface ParticipantDashboardData {
  profile: UserProfile;
  cycleState: CycleState;
}

export type CycleState =
  | { status: "no_cycle" }
  | { status: "tasks_pending"; cycle: CycleRecord; completedTaskIds: string[]; qualified: boolean }
  | { status: "draw_done"; cycle: CycleRecord; voucher: VoucherRecord }
  | { status: "cooldown"; nextCycleAt: string | null; lastVoucher: VoucherRecord | null };

export async function GET(req: NextRequest) {
  const result = await requireParticipant(req);
  if ("error" in result) return result.error;
  const { uid } = result;

  /* ── 1. Load user profile ── */
  const profileSnap = await adminDb.doc(`users/${uid}`).get();
  if (!profileSnap.exists) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }
  const profile = profileSnap.data() as UserProfile;

  /* ── 2. Find active cycle ── */
  const activeCycleSnap = await adminDb
    .collection("cycles")
    .where("status", "==", "started")
    .limit(1)
    .get();

  /* ── 3. No active cycle — cooldown or idle ── */
  if (activeCycleSnap.empty) {
    const [lastVoucherSnap, nextSnap] = await Promise.all([
      adminDb
        .collection("vouchers")
        .where("participantId", "==", uid)
        .orderBy("issuedAt", "desc")
        .limit(1)
        .get(),
      adminDb
        .collection("cycles")
        .where("status", "==", "draft")
        .orderBy("windowClose", "asc")
        .limit(1)
        .get(),
    ]);

    const lastVoucher = lastVoucherSnap.empty
      ? null
      : lastVoucherSnap.docs[0].data() as VoucherRecord;

    const nextCycleAt = nextSnap.empty
      ? null
      : (nextSnap.docs[0].data() as CycleRecord).windowOpen?.toDate().toISOString() ?? null;

    return NextResponse.json({
      profile,
      cycleState: { status: "cooldown", nextCycleAt, lastVoucher },
    } satisfies ParticipantDashboardData);
  }

  const cycle = activeCycleSnap.docs[0].data() as CycleRecord;

  /* ── 4. Fetch participant's submissions + any voucher in parallel ── */
  const [submissionSnap, voucherSnap] = await Promise.all([
    adminDb
      .collection("taskSubmissions")
      .where("participantId", "==", uid)
      .where("cycleId", "==", cycle.id)
      .get(),
    adminDb
      .collection("vouchers")
      .where("participantId", "==", uid)
      .where("cycleId", "==", cycle.id)
      .limit(1)
      .get(),
  ]);

  const completedTaskIds = submissionSnap.docs.map((d) => d.data().taskId as string);

  /* ── 5. Voucher exists — draw has been run ── */
  if (!voucherSnap.empty && cycle.drawLogId) {
    const voucher = voucherSnap.docs[0].data() as VoucherRecord;
    return NextResponse.json({
      profile,
      cycleState: { status: "draw_done", cycle, voucher },
    } satisfies ParticipantDashboardData);
  }

  /* ── 6. No voucher yet — show tasks (draw hasn't run) ── */
  const qualified = completedTaskIds.length >= cycle.minTasksToQualify;

  return NextResponse.json({
    profile,
    cycleState: { status: "tasks_pending", cycle, completedTaskIds, qualified },
  } satisfies ParticipantDashboardData);
}

// export async function GET(req: NextRequest) {
//   if (!voucherSnap.empty) {
//     const voucher = voucherSnap.docs[0].data() as VoucherRecord;

//     // Draw has run — show result
//     if (cycle.drawLogId) {
//       return NextResponse.json({
//         profile,
//         cycleState: { status: "draw_done", cycle, voucher },
//       } satisfies ParticipantDashboardData);
//     }

//     // Voucher issued, draw still pending
//     return NextResponse.json({
//       profile,
//       cycleState: { status: "voucher_issued", cycle, voucher, completedTaskIds },
//     } satisfies ParticipantDashboardData);
//   }
// }
