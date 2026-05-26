import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/require-admin";
import { FieldValue } from "firebase-admin/firestore";
import type { CycleRecord } from "@/lib/types";

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

  if (cycle.status !== "started") {
    return NextResponse.json(
      { error: `Cannot close a cycle with status "${cycle.status}".` },
      { status: 409 }
    );
  }

  /* Transition → completed */
  await adminDb.doc(`cycles/${id}`).update({
    status:      "completed",
    completedBy: result.admin.uid,
    updatedAt:   FieldValue.serverTimestamp(),
  });

  /* Unmark all tasks so they can be assigned to future cycles */
  const batch = adminDb.batch();
  for (const taskId of cycle.taskIds) {
    batch.update(adminDb.doc(`tasks/${taskId}`), {
      activeInCycle: false,
      updatedAt:     FieldValue.serverTimestamp(),
    });
  }
  await batch.commit();

  return NextResponse.json({ ok: true });
}
