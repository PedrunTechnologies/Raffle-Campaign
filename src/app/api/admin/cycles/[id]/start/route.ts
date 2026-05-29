import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/require-admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import type { CycleRecord } from "@/lib/types";
import { notifyParticipantsNewCycle, notifyVendorsNewCycle } from "@/lib/fcm";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const result = await requireAdmin(req);
  if ("error" in result) return result.error;

  const { id } = await params;

  const snap = await adminDb.doc(`cycles/${id}`).get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Cycle not found." }, { status: 404 });
  }

  const cycle = snap.data() as CycleRecord;

  /* guard: must be draft */
  if (cycle.status !== "draft") {
    return NextResponse.json(
      { error: `Cannot start a cycle with status "${cycle.status}".` },
      { status: 409 }
    );
  }

  /* guard: no other cycle already started */
  const activeSnap = await adminDb
    .collection("cycles")
    .where("status", "==", "started")
    .limit(1)
    .get();

  if (!activeSnap.empty) {
    const active = activeSnap.docs[0].data() as CycleRecord;
    return NextResponse.json(
      {
        error: `Cycle #${active.cycleNumber} is already running. Complete or close it before starting a new one.`,
        conflictId: active.id,
      },
      { status: 409 }
    );
  }

  /* guard: must have at least one task */
  if (!cycle.taskIds.length) {
    return NextResponse.json(
      { error: "A cycle must have at least one task before it can be started." },
      { status: 400 }
    );
  }

  /* Transition — windowOpen is set to NOW (server timestamp), not the draft value */
  await adminDb.doc(`cycles/${id}`).update({
    status: "started",
    windowOpen: FieldValue.serverTimestamp(),
    startedBy: result.admin.uid,
    updatedAt: FieldValue.serverTimestamp(),
  });

  /* Mark all assigned tasks as activeInCycle */
  const batch = adminDb.batch();
  for (const taskId of cycle.taskIds) {
    batch.update(adminDb.doc(`tasks/${taskId}`), {
      activeInCycle: true,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
  await batch.commit();

  /* Fire push notifications — non-blocking */
  void Promise.allSettled([
    notifyParticipantsNewCycle(cycle.cycleNumber),
    notifyVendorsNewCycle(cycle.cycleNumber),
  ]);

  return NextResponse.json({ ok: true });
}
