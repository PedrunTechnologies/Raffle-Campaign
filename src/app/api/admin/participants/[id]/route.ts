import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/require-admin";
import { FieldValue } from "firebase-admin/firestore";
import type { ParticipantRecord } from "@/lib/types";


export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireAdmin(req);
  if ("error" in result) return result.error;
  
  const { id } = await params;

  const snap = await adminDb.doc(`users/${id}`).get();
  if (!snap.exists) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json(snap.data() as ParticipantRecord);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireAdmin(req);
  if ("error" in result) return result.error;

  const { id } = await params;

  const { status } = await req.json() as {
    status: "active" | "flagged" | "suspended";
  };

  const allowed = ["active", "flagged", "suspended"];
  if (!allowed.includes(status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  await adminDb.doc(`users/${id}`).update({
    status,
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

  // Delete Firestore doc
  await adminDb.doc(`users/${id}`).delete();

  // Delete Firebase Auth account
  try {
    await adminAuth.deleteUser(id);
  } catch {
    // Auth user may already be gone — not a fatal error
  }

  return NextResponse.json({ ok: true });
}
