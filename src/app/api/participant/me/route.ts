import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireParticipant } from "@/lib/require-participant";
import type { UserProfile } from "@/lib/user";
import type { CycleRecord, VoucherRecord } from "@/lib/types";

export interface ParticipantDashboardData {
  profile:    UserProfile;
  cycleState: CycleState;
}

export type CycleState =
  | { status: "no_cycle" }
  | { status: "tasks_pending"; cycle: CycleRecord; completedTaskIds: string[] }
  | { status: "voucher_issued"; cycle: CycleRecord; voucher: VoucherRecord; completedTaskIds: string[] }
  | { status: "draw_done";      cycle: CycleRecord; voucher: VoucherRecord }
  | { status: "cooldown";       nextCycleAt: string | null; lastVoucher: VoucherRecord | null };

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

  /* ── 3. No active cycle — cooldown ── */
  if (activeCycleSnap.empty) {
    // Get their last voucher for the cooldown screen
    const lastVoucherSnap = await adminDb
      .collection("vouchers")
      .where("participantId", "==", uid)
      .orderBy("issuedAt", "desc")
      .limit(1)
      .get();

    const lastVoucher = lastVoucherSnap.empty
      ? null
      : lastVoucherSnap.docs[0].data() as VoucherRecord;

    // Find upcoming draft cycle for next window time
    const nextSnap = await adminDb
      .collection("cycles")
      .where("status", "==", "draft")
      .orderBy("windowClose", "asc")
      .limit(1)
      .get();

    const nextCycleAt = nextSnap.empty
      ? null
      : (nextSnap.docs[0].data() as CycleRecord).windowOpen?.toDate().toISOString() ?? null;

    return NextResponse.json({
      profile,
      cycleState: { status: "cooldown", nextCycleAt, lastVoucher },
    } satisfies ParticipantDashboardData);
  }

  const cycle = activeCycleSnap.docs[0].data() as CycleRecord;

  /* ── 4. Check if participant already has a voucher for this cycle ── */
  const voucherSnap = await adminDb
    .collection("vouchers")
    .where("participantId", "==", uid)
    .where("cycleId",       "==", cycle.id)
    .limit(1)
    .get();

  /* ── 5. No voucher yet — show tasks ── */
  const submissionSnap = await adminDb
    .collection("taskSubmissions")
    .where("participantId", "==", uid)
    .where("cycleId",       "==", cycle.id)
    .get();

  const completedTaskIds = submissionSnap.docs.map(
    (d) => d.data().taskId as string
  );

  if (!voucherSnap.empty) {
    const voucher = voucherSnap.docs[0].data() as VoucherRecord;

    // Draw has run — show result
    if (cycle.drawLogId) {
      return NextResponse.json({
        profile,
        cycleState: { status: "draw_done", cycle, voucher },
      } satisfies ParticipantDashboardData);
    }

    // Voucher issued, draw still pending
    return NextResponse.json({
      profile,
      cycleState: { status: "voucher_issued", cycle, voucher, completedTaskIds },
    } satisfies ParticipantDashboardData);
  }

  return NextResponse.json({
    profile,
    cycleState: { status: "tasks_pending", cycle, completedTaskIds },
  } satisfies ParticipantDashboardData);
}
