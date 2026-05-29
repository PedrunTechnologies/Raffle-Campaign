import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireParticipant } from "@/lib/require-participant";
import type { VoucherRecord, VendorRecord } from "@/lib/types";

export async function GET(req: NextRequest) {
  const result = await requireParticipant(req);
  if ("error" in result) return result.error;
  const { uid } = result;

  const { searchParams } = req.nextUrl;
  const cycleId = searchParams.get("cycleId");

  let query = adminDb
    .collection("vouchers")
    .where("participantId", "==", uid);

  if (cycleId) query = query.where("cycleId", "==", cycleId);

  const snap     = await query.get();
  const vouchers = snap.docs.map((d) => d.data() as VoucherRecord);

  /* Collect unique vendorIds that exist on any voucher */
  const vendorIds = [...new Set(
    vouchers.map((v) => v.vendorId).filter((id): id is string => !!id)
  )];

  /* Fetch vendor docs in parallel */
  const vendorMap = new Map<string, Partial<VendorRecord>>();
  if (vendorIds.length > 0) {
    const vendorDocs = await Promise.all(
      vendorIds.map((id) => adminDb.collection("vendors").doc(id).get())
    );
    for (const doc of vendorDocs) {
      if (!doc.exists) continue;
      const v = doc.data() as VendorRecord;
      vendorMap.set(doc.id, {
        name:           v.name,
        address:        v.address,
        operatingHours: v.operatingHours,
        dineIn:         v.dineIn,
        phone:          v.phone,
        cuisine:        v.cuisine,
      });
    }
  }

  /* Stitch vendor details onto each voucher */
  const enriched = vouchers.map((v) => ({
    ...v,
    vendor: v.vendorId ? (vendorMap.get(v.vendorId) ?? null) : null,
  }));

  return NextResponse.json(enriched);
}



// export async function GET(req: NextRequest) {
//   const result = await requireParticipant(req);
//   if ("error" in result) return result.error;
//   const { uid } = result;

//   const { searchParams } = req.nextUrl;
//   const cycleId = searchParams.get("cycleId");

//   let query = adminDb
//     .collection("vouchers")
//     .where("participantId", "==", uid);
//     // .orderBy("issuedAt", "desc") as FirebaseFirestore.Query;

//   if (cycleId) query = query.where("cycleId", "==", cycleId);

//   // const snap     = await query.limit(50).get();
//   const snap     = await query.get();
//   const vouchers = snap.docs.map((d) => d.data() as VoucherRecord);

//   return NextResponse.json(vouchers);
// }
