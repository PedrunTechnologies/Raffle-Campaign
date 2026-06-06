import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/require-admin";
import type { CycleRecord, VendorOptIn } from "@/lib/types";

export async function GET(req: NextRequest) {
  const result = await requireAdmin(req);
  if ("error" in result) return result.error;

  const cycleId = req.nextUrl.searchParams.get("cycleId");
  if (!cycleId) {
    return NextResponse.json({ error: "cycleId is required." }, { status: 400 });
  }

  const cycleSnap = await adminDb.collection("cycles").doc(cycleId).get();
  if (!cycleSnap.exists) {
    return NextResponse.json({ error: "Cycle not found." }, { status: 404 });
  }

  const cycle = cycleSnap.data() as CycleRecord;
  const totalFreeSlots = (cycle.vendorOptIns ?? []).reduce(
    (sum: number, v: VendorOptIn) => sum + (v.freeVouchers ?? 0),
    0
  );

  const issuedFreeSnap = await adminDb
    .collection("vouchers")
    .where("cycleId", "==", cycleId)
    .where("type", "==", "free")
    .get();

  const leftover = Math.max(0, totalFreeSlots - issuedFreeSnap.size);

  return NextResponse.json({ cycleId, totalFreeSlots, issuedFree: issuedFreeSnap.size, leftover });
}

