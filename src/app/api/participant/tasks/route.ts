import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireParticipant } from "@/lib/require-participant";
import { FieldValue } from "firebase-admin/firestore";
import type { CycleRecord, TaskRecord, VoucherRecord } from "@/lib/types";



/* ── GET /api/participant/tasks?current=true ─────────────────────────
   Returns the active cycle's task records, each with a `completed`
   boolean injected so the home page knows which ones are already done.
──────────────────────────────────────────────────────────────────────── */
export async function GET(req: NextRequest) {
  const result = await requireParticipant(req);
  if ("error" in result) return result.error;
  const { uid } = result;

  const current = req.nextUrl.searchParams.get("current") === "true";
  if (!current) {
    return NextResponse.json(
      { error: "Use ?current=true to fetch active cycle tasks." },
      { status: 400 }
    );
  }

  /* Find active cycle */
  const cycleSnap = await adminDb
    .collection("cycles")
    .where("status", "==", "started")
    .limit(1)
    .get();

  if (cycleSnap.empty) return NextResponse.json([]);

  const cycle = cycleSnap.docs[0].data() as CycleRecord;

  /* Fetch task records in parallel */
  const taskDocs = await Promise.all(
    cycle.taskIds.map((id) => adminDb.doc(`tasks/${id}`).get())
  );
  const tasks = taskDocs.filter((d) => d.exists).map((d) => d.data() as TaskRecord);

  /* Fetch this participant's submissions for this cycle */
  const submissionsSnap = await adminDb
    .collection("taskSubmissions")
    .where("participantId", "==", uid)
    .where("cycleId", "==", cycle.id)
    .get();

  const completedIds = new Set(
    submissionsSnap.docs.map((d) => d.data().taskId as string)
  );

  /* Inject completed flag */
  return NextResponse.json(
    tasks.map((t) => ({ ...t, completed: completedIds.has(t.id) }))
  );
}


/* ── POST /api/participant/tasks ─────────────────────────────────────
   Self-report a task as complete. Vouchers are no longer issued here —
   they are created at draw time for all qualifying participants.
   This route only records the submission and tracks the participant
   on the cycle via arrayUnion (no duplicates).
──────────────────────────────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  const result = await requireParticipant(req);
  if ("error" in result) return result.error;
  const { uid } = result;

  const { taskId } = await req.json() as { taskId?: string };
  if (!taskId) {
    return NextResponse.json({ error: "taskId is required." }, { status: 400 });
  }

  /* Find active cycle */
  const cycleSnap = await adminDb
    .collection("cycles")
    .where("status", "==", "started")
    .limit(1)
    .get();

  if (cycleSnap.empty) {
    return NextResponse.json({ error: "No active cycle." }, { status: 409 });
  }

  const cycleDoc = cycleSnap.docs[0];
  const cycle = cycleDoc.data() as CycleRecord;
  const cycleId = cycle.id;

  if (!cycle.taskIds.includes(taskId)) {
    return NextResponse.json({ error: "Task not part of this cycle." }, { status: 400 });
  }

  /* Idempotent — ignore duplicate submissions */
  const existingSnap = await adminDb
    .collection("taskSubmissions")
    .where("participantId", "==", uid)
    .where("cycleId", "==", cycleId)
    .where("taskId", "==", taskId)
    .limit(1)
    .get();

  if (!existingSnap.empty) {
    return NextResponse.json({ ok: true, alreadyDone: true });
  }

  /* Write submission + add participant to cycle (arrayUnion = no duplicates) */
  const ref = adminDb.collection("taskSubmissions").doc();
  await Promise.all([
    ref.set({
      id: ref.id,
      participantId: uid,
      cycleId,
      taskId,
      submittedAt: FieldValue.serverTimestamp(),
      verified: false,
    }),
    cycleDoc.ref.update({
      participantIds: FieldValue.arrayUnion(uid),
      updatedAt: FieldValue.serverTimestamp(),
    }),
  ]);

  /* Count all submissions for this cycle so the client can show progress */
  const allSnap = await adminDb
    .collection("taskSubmissions")
    .where("participantId", "==", uid)
    .where("cycleId", "==", cycleId)
    .get();

  const completedIds = allSnap.docs.map((d) => d.data().taskId as string);
  const qualifies = completedIds.length >= cycle.minTasksToQualify;

  return NextResponse.json({ ok: true, qualified: qualifies, completedIds });
}

// export async function POST(req: NextRequest) {


//   /* Issue voucher if qualifies and doesn't have one yet */
//   if (qualifies) {
//     const existingVoucher = await adminDb
//       .collection("vouchers")
//       .where("participantId", "==", uid)
//       .where("cycleId", "==", cycleId)
//       .limit(1)
//       .get();

//     if (existingVoucher.empty) {
//       const code = generateVoucherCode();
//       // const expiresAt = new Date(
//       //   (cycle.windowClose as unknown as { _seconds: number })._seconds * 1000
//       // );

//       const windowClose =
//         (cycle.windowClose as unknown as { _seconds: number })._seconds * 1000;

//       const expiresAt = new Date(
//         windowClose + cycle.cooldownHours * 60 * 60 * 1000
//       );

//       await adminDb.collection("vouchers").doc(code).set({
//         code,
//         cycleId,
//         participantId: uid,
//         type: "free",      // overwritten by the draw
//         discountPct: null,
//         status: "eligible",
//         vendorId: null,
//         redeemedAt: null,
//         issuedAt: FieldValue.serverTimestamp(),
//         expiresAt,
//       } satisfies Omit<VoucherRecord, "issuedAt" | "expiresAt"> & { issuedAt: unknown, expiresAt: unknown });

//       return NextResponse.json({
//         ok: true, qualified: true,
//         voucherCode: code, voucherIssued: true,
//         completedIds,
//       });
//     }
//   }

//   return NextResponse.json({ ok: true, qualified: qualifies, completedIds });
// }



/* ── Voucher code generator: PR-XXXX-XXXX ── */
// function generateVoucherCode(): string {
//   const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
//   const seg = (n: number) =>
//     Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
//   return `PR-${seg(4)}-${seg(4)}`;
// }
