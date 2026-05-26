import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/require-admin";
import { FieldValue } from "firebase-admin/firestore";
import type { CycleRecord } from "@/lib/types";

type Params = { params: Promise<{ id: string }> };

/* ── GET ──────────────────────────────────────────────────────────── */
export async function GET(req: NextRequest, { params }: Params) {
  const result = await requireAdmin(req);
  if ("error" in result) return result.error;

  const { id } = await params;

  const snap = await adminDb.doc(`cycles/${id}`).get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Cycle not found." }, { status: 404 });
  }
  return NextResponse.json(snap.data() as CycleRecord);
}



/* ── PATCH ────────────────────────────────────────────────────────────
   Rules:
   • draft    → all fields editable
   • started  → only windowClose, taskIds, minTasksToQualify, winnersCount editable
                windowOpen is LOCKED (set at start time, server-enforced here)
   • completed → nothing editable — 409
──────────────────────────────────────────────────────────────────────── */
export async function PATCH(req: NextRequest, { params }: Params) {
  const result = await requireAdmin(req);
  if ("error" in result) return result.error;

  const { id } = await params;

  const snap = await adminDb.doc(`cycles/${id}`).get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Cycle not found." }, { status: 404 });
  }

  const cycle = snap.data() as CycleRecord;

  if (cycle.status === "completed") {
    return NextResponse.json(
      { error: "Completed cycles are immutable." },
      { status: 409 }
    );
  }

  const body = await req.json() as Partial<{
    windowClose:       string;
    cooldownHours:     number;
    taskIds:           string[];
    minTasksToQualify: number;
    winnersCount:      number;
  }>;

  /* build allowed update payload */
  const update: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };

  if (body.windowClose !== undefined) {
    if (isNaN(Date.parse(body.windowClose))) {
      return NextResponse.json({ error: "windowClose must be a valid ISO datetime." }, { status: 400 });
    }
    update.windowClose = new Date(body.windowClose);
  }
  if (body.taskIds !== undefined)            update.taskIds            = body.taskIds;
  if (body.minTasksToQualify !== undefined)  update.minTasksToQualify  = body.minTasksToQualify;
  if (body.winnersCount !== undefined)       update.winnersCount       = body.winnersCount;

  /* draft-only fields — silently ignore if started */
  if (cycle.status === "draft") {
    if (body.cooldownHours !== undefined) update.cooldownHours = body.cooldownHours;
  }

  await adminDb.doc(`cycles/${id}`).update(update);
  return NextResponse.json({ ok: true });
}

/* ── DELETE ───────────────────────────────────────────────────────────
   Only draft cycles can be deleted.
──────────────────────────────────────────────────────────────────────── */
export async function DELETE(req: NextRequest, { params }: Params) {
  const result = await requireAdmin(req);
  if ("error" in result) return result.error;

  const { id } = await params;

  const snap = await adminDb.doc(`cycles/${id}`).get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Cycle not found." }, { status: 404 });
  }

  const cycle = snap.data() as CycleRecord;
  if (cycle.status !== "draft") {
    return NextResponse.json(
      { error: "Only draft cycles can be deleted." },
      { status: 409 }
    );
  }

  await adminDb.doc(`cycles/${id}`).delete();
  return NextResponse.json({ ok: true });
}
