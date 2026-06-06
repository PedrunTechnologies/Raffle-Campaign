// import { NextRequest, NextResponse } from "next/server";
// import { adminDb } from "@/lib/firebase-admin";
// import { requireAdmin } from "@/lib/require-admin";
// import type { CycleRecord, VendorOptIn } from "@/lib/types";

// export async function GET(req: NextRequest) {
//   const result = await requireAdmin(req);
//   if ("error" in result) return result.error;

//   const cycleId = req.nextUrl.searchParams.get("cycleId");
//   if (!cycleId) {
//     return NextResponse.json({ error: "cycleId is required." }, { status: 400 });
//   }

//   const cycleSnap = await adminDb.collection("cycles").doc(cycleId).get();
//   if (!cycleSnap.exists) {
//     return NextResponse.json({ error: "Cycle not found." }, { status: 404 });
//   }

//   const cycle = cycleSnap.data() as CycleRecord;
//   const totalFreeSlots = (cycle.vendorOptIns ?? []).reduce(
//     (sum: number, v: VendorOptIn) => sum + (v.freeVouchers ?? 0),
//     0
//   );

//   const issuedFreeSnap = await adminDb
//     .collection("vouchers")
//     .where("cycleId", "==", cycleId)
//     .where("type", "==", "free")
//     .get();

//   const leftover = Math.max(0, totalFreeSlots - issuedFreeSnap.size);

//   return NextResponse.json({ cycleId, totalFreeSlots, issuedFree: issuedFreeSnap.size, leftover });
// }


import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/require-admin";
import type { CycleRecord, VendorOptIn, VoucherRecord } from "@/lib/types";

export interface VendorLeftover {
  vendorId:   string;
  vendorName: string;
  allocated:  number;   // total free slots configured for this vendor in the cycle
  issued:     number;   // free vouchers already issued to participants
  remaining:  number;   // allocated - issued
}

export interface LeftoverResponse {
  cycleId:        string;
  totalAllocated: number;
  totalIssued:    number;
  totalRemaining: number;
  vendors:        VendorLeftover[];
}

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

  // Count already-issued free vouchers per vendor
  const issuedFreeSnap = await adminDb
    .collection("vouchers")
    .where("cycleId", "==", cycleId)
    .where("type", "==", "free")
    .get();

  const issuedByVendor = new Map<string, number>();
  for (const doc of issuedFreeSnap.docs) {
    const vid = (doc.data() as VoucherRecord).vendorId ?? "";
    issuedByVendor.set(vid, (issuedByVendor.get(vid) ?? 0) + 1);
  }

  // Build per-vendor leftover breakdown
  const vendors: VendorLeftover[] = (cycle.vendorOptIns ?? [])
    .filter((optIn: VendorOptIn) => (optIn.freeVouchers ?? 0) > 0)
    .map((optIn: VendorOptIn) => {
      const allocated = optIn.freeVouchers ?? 0;
      const issued    = issuedByVendor.get(optIn.vendorId) ?? 0;
      return {
        vendorId:   optIn.vendorId,
        vendorName: optIn.vendorName,
        allocated,
        issued,
        remaining:  Math.max(0, allocated - issued),
      };
    });

  const totalAllocated  = vendors.reduce((s, v) => s + v.allocated,  0);
  const totalIssued     = vendors.reduce((s, v) => s + v.issued,     0);
  const totalRemaining  = vendors.reduce((s, v) => s + v.remaining,  0);

  return NextResponse.json({
    cycleId,
    totalAllocated,
    totalIssued,
    totalRemaining,
    vendors,
  } satisfies LeftoverResponse);
}


