import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/require-admin";
import { FieldValue } from "firebase-admin/firestore";
import type { TaskRecord } from "@/lib/types";


export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireAdmin(req);

  if ("error" in result) return result.error;

  const { id } = await params;

  const snap = await adminDb.doc(`tasks/${id}`).get();

  if (!snap.exists) {
    return NextResponse.json(
      { error: "Task not found." },
      { status: 404 }
    );
  }

  return NextResponse.json(snap.data() as TaskRecord);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireAdmin(req);
  if ("error" in result) return result.error;

  const { id } = await params;

  const snap = await adminDb.doc(`tasks/${id}`).get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }

  const body = await req.json() as Partial<
    Pick<TaskRecord, "description" | "targetUrl" | "platform" | "taskType">
  >;

  // Validate URL if provided
  if (body.targetUrl) {
    try { new URL(body.targetUrl); } catch {
      return NextResponse.json({ error: "targetUrl must be a valid URL." }, { status: 400 });
    }
  }

  await adminDb.doc(`tasks/${id}`).update({
    ...body,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireAdmin(req);
  if ("error" in result) return result.error;
  
  const { id } = await params;

  const snap = await adminDb.doc(`tasks/${id}`).get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }

  const task = snap.data() as TaskRecord;
  if (task.activeInCycle) {
    return NextResponse.json(
      { error: "Cannot delete a task that is currently in an active cycle." },
      { status: 409 }
    );
  }

  await adminDb.doc(`tasks/${id}`).delete();
  return NextResponse.json({ ok: true });
}
