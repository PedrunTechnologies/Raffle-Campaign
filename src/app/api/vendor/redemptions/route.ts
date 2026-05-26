import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireVendor } from "@/lib/require-vendor";
import type { RedemptionRecord } from "@/lib/types";

export async function GET(req: NextRequest) {
  const result = await requireVendor(req);
  if ("error" in result) return result.error;

  const snap = await adminDb
    .collection("redemptions")
    .where("vendorId", "==", result.vendor.id)
    .orderBy("redeemedAt", "desc")
    .limit(100)
    .get();

  return NextResponse.json(snap.docs.map((d) => d.data() as RedemptionRecord));
}
