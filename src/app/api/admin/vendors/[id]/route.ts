import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/require-admin";
import { FieldValue } from "firebase-admin/firestore";
import type { VendorRecord } from "@/lib/types";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireAdmin(req);
  if ("error" in result) return result.error;

  const { id } = await params;

  const snap = await adminDb.doc(`vendors/${id}`).get();
  if (!snap.exists) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json(snap.data() as VendorRecord);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireAdmin(req);
  if ("error" in result) return result.error;


  const { id } = await params;

  const body = await req.json() as Partial<Pick<VendorRecord, "status">>;

  const allowed = ["pending", "active", "suspended"];
  if (body.status && !allowed.includes(body.status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  await adminDb.doc(`vendors/${id}`).update({
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

  await adminDb.doc(`vendors/${id}`).delete();
  return NextResponse.json({ ok: true });
}

