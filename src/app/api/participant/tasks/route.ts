import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireParticipant } from "@/lib/require-participant";
import { FieldValue } from "firebase-admin/firestore";
import type { CycleRecord, TaskRecord, VoucherRecord } from "@/lib/types";


export async function GET(req: NextRequest) {
  const result = await requireParticipant(req);
  if ("error" in result) return result.error;

  const current = req.nextUrl.searchParams.get("current");

  // If current=true, only return tasks in the started cycle
  if (current === "true") {
    const cycleSnap = await adminDb
      .collection("cycles")
      .where("status", "==", "started")
      .limit(1)
      .get();

    if (cycleSnap.empty) {
      return NextResponse.json([]);
    }

    const cycle = cycleSnap.docs[0].data();

    const taskIds: string[] = cycle.taskIds || [];

    if (taskIds.length === 0) {
      return NextResponse.json([]);
    }

    const taskSnap = await adminDb
      .collection("tasks")
      .where("__name__", "in", taskIds)
      .get();

    const tasks = taskSnap.docs.map(
      (d) => d.data() as TaskRecord
    );

    return NextResponse.json(tasks);
  }

  // Default: return all tasks
  const snap = await adminDb
    .collection("tasks")
    .orderBy("createdAt", "desc")
    .get();

  const tasks = snap.docs.map(
    (d) => d.data() as TaskRecord
  );

  return NextResponse.json(tasks);
}


// export async function GET(req: NextRequest) {
//   const result = await requireParticipant(req);
//   if ("error" in result) return result.error;

//   const snap  = await adminDb.collection("tasks").orderBy("createdAt", "desc").get();
//   const tasks = snap.docs.map((d) => d.data() as TaskRecord);
//   return NextResponse.json(tasks);
// }


export async function POST(req: NextRequest) {
  const result = await requireParticipant(req);
  if ("error" in result) return result.error;
  const { uid } = result;

  const { taskId } = await req.json() as { taskId?: string };
  if (!taskId) {
    return NextResponse.json({ error: "taskId is required." }, { status: 400 });
  }

  /* ── Find active cycle ── */
  const cycleSnap = await adminDb
    .collection("cycles")
    .where("status", "==", "started")
    .limit(1)
    .get();

  if (cycleSnap.empty) {
    return NextResponse.json({ error: "No active cycle." }, { status: 409 });
  }

  const cycle    = cycleSnap.docs[0].data() as CycleRecord;
  const cycleId  = cycle.id;

  /* ── Validate task belongs to this cycle ── */
  if (!cycle.taskIds.includes(taskId)) {
    return NextResponse.json({ error: "Task not part of this cycle." }, { status: 400 });
  }

  /* ── Check not already submitted ── */
  const existingSnap = await adminDb
    .collection("taskSubmissions")
    .where("participantId", "==", uid)
    .where("cycleId",       "==", cycleId)
    .where("taskId",        "==", taskId)
    .limit(1)
    .get();

  if (!existingSnap.empty) {
    return NextResponse.json({ ok: true, alreadyDone: true });
  }

  /* ── Write submission ── */
  const ref = adminDb.collection("taskSubmissions").doc();
  await ref.set({
    id:            ref.id,
    participantId: uid,
    cycleId,
    taskId,
    submittedAt:   FieldValue.serverTimestamp(),
    verified:      false, // admin spot-check sets this to true
  });

  /* ── Check if all required tasks are now done → issue voucher ── */
  const allSubmissionsSnap = await adminDb
    .collection("taskSubmissions")
    .where("participantId", "==", uid)
    .where("cycleId",       "==", cycleId)
    .get();

  const completedIds = allSubmissionsSnap.docs.map((d) => d.data().taskId as string);
  const qualifies    = cycle.taskIds
    .slice(0, cycle.minTasksToQualify)
    .every((id) => completedIds.includes(id)) ||
    completedIds.length >= cycle.minTasksToQualify;

  if (!qualifies) {
    return NextResponse.json({ ok: true, qualified: false, completedIds });
  }

  /* ── Already have a voucher for this cycle? ── */
  const existingVoucherSnap = await adminDb
    .collection("vouchers")
    .where("participantId", "==", uid)
    .where("cycleId",       "==", cycleId)
    .limit(1)
    .get();

  if (!existingVoucherSnap.empty) {
    return NextResponse.json({ ok: true, qualified: true, voucherAlreadyIssued: true });
  }

  /* ── Issue voucher ── */
  const code       = generateVoucherCode();
  const expiresAt  = new Date(
    (cycle.windowClose as unknown as { _seconds: number })._seconds * 1000
  );

  const voucher: Omit<VoucherRecord, "issuedAt" | "expiresAt"> & {
    issuedAt: unknown; expiresAt: unknown;
  } = {
    code,
    cycleId,
    participantId: uid,
    type:          null,        // type assigned later by draw
    discountPct:   null,
    status:        "eligible",
    vendorId:      null,
    redeemedAt:    null,
    issuedAt:      FieldValue.serverTimestamp(),
    expiresAt:     expiresAt,
  };

  await adminDb.collection("vouchers").doc(code).set(voucher);

  return NextResponse.json({ ok: true, qualified: true, voucherCode: code });
}

/* ── Voucher code generator: PR-XXXX-XXXX ── */
function generateVoucherCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const seg   = (n: number) =>
    Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `PR-${seg(4)}-${seg(4)}`;
}
