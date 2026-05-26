import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireVendor } from "@/lib/require-vendor";
import { FieldValue } from "firebase-admin/firestore";
import type { VendorRecord } from "@/lib/types";

type UpdatePayload = Partial<Pick<
  VendorRecord,
  | "name" | "businessType" | "cuisine" | "address"
  | "operatingHours" | "dineIn"
  | "contactName" | "contactRole" | "phone" | "email"
  | "socials"
>>;

export async function PATCH(req: NextRequest) {
  const result = await requireVendor(req);
  if ("error" in result) return result.error;

  const body = await req.json() as UpdatePayload;

  // Strip fields that must never be updated through this route
  const { ...safe } = body as Record<string, unknown>;
  delete safe.id;
  delete safe.uid;
  delete safe.status;
  delete safe.cycleCount;
  delete safe.createdAt;

  if (Object.keys(safe).length === 0) {
    return NextResponse.json({ error: "No fields to update." }, { status: 400 });
  }

  const snap = await adminDb
    .collection("vendors")
    .where("uid", "==", result.vendor.uid)
    .limit(1)
    .get();

  if (snap.empty) {
    return NextResponse.json({ error: "Vendor not found." }, { status: 404 });
  }

  await snap.docs[0].ref.update({
    ...safe,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ ok: true });
}
